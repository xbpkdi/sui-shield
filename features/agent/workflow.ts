import type {
  WorkflowStage,
  TransactionIntent,
  AgentEvent,
  AppMode,
  SponsorshipDecision,
} from "@/types";
import type { SuiShieldState } from "./types";
import {
  evaluatePolicy,
  checkDuplicate,
  countWalletTxLastHour,
  REASON_CODE_MESSAGES,
} from "@/features/policy/engine";
import { generateId, nowIso, randomHex } from "@/lib/utils";
import { MAX_RETRY_ATTEMPTS } from "@/lib/constants";
import type { SponsoredMintResult } from "@/lib/sui/interfaces";
import type { MintBadgeRealParams, DryRunInfo } from "@/lib/sui/real-provider";
import {
  getWalletCompatibility,
  isPhantomAllowed,
  WALLET_ERROR_CODES,
} from "@/features/wallet/compatibility";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";

export type StepStatus = "pending" | "running" | "done" | "skipped" | "failed";

export interface FlowStep {
  id: string;
  label: string;
  status: StepStatus;
}

export function makeBaseSteps(): FlowStep[] {
  return [
    { id: "policy", label: "Checking policy", status: "pending" },
    { id: "sim", label: "Simulating transaction", status: "pending" },
    { id: "dup", label: "Checking duplicate intent", status: "pending" },
    { id: "budget", label: "Checking sponsor budget", status: "pending" },
    { id: "rpc", label: "Selecting RPC endpoint", status: "pending" },
    { id: "sponsor", label: "Sponsoring gas", status: "pending" },
    { id: "submit", label: "Submitting transaction", status: "pending" },
    { id: "success", label: "Success", status: "pending" },
  ];
}

/** Granular step set for the real two-phase sponsored mint path. */
export function makeRealMintSteps(): FlowStep[] {
  const networkLabel = getNetworkLabel(getActiveNetwork());
  return [
    { id: "policy", label: "Validating policy", status: "pending" },
    { id: "eligibility", label: "Checking on-chain eligibility", status: "pending" },
    { id: "prepare", label: "Preparing sponsored transaction", status: "pending" },
    { id: "dryrun", label: "Dry-running final transaction", status: "pending" },
    { id: "sign", label: "Waiting for wallet signature", status: "pending" },
    { id: "sponsor_sign", label: "Sponsor signing server-side", status: "pending" },
    { id: "submit", label: `Submitting to Sui ${networkLabel}`, status: "pending" },
    { id: "verify", label: "Verifying badge ownership", status: "pending" },
    { id: "success", label: `Confirmed on Sui ${networkLabel}`, status: "pending" },
  ];
}

export type WorkflowScenario =
  | "normal"
  | "duplicate"
  | "rpc_failure"
  | "unstable"
  | "budget_exceeded"
  | "move_abort";

export interface WorkflowCallbacks {
  onStepUpdate: (steps: FlowStep[]) => void;
  onAgentEvent: (event: Omit<AgentEvent, "id" | "timestamp">) => void;
  onTransactionCreated: (tx: TransactionIntent) => void;
  onTransactionUpdated: (id: string, patch: Partial<TransactionIntent>) => void;
  onModeChange: (mode: AppMode) => void;
  onRpcUpdate: (id: string, latencyMs: number, status: string) => void;
  onActiveRpcChange: (id: string) => void;
  onIncident: (title: string, type: string, actions: string[]) => void;
  onQueueIntent: (id: string) => void;
  /**
   * When provided and the scenario is "normal", the workflow performs a real
   * on-chain mint instead of a simulation. The callback receives the mint params
   * and must return a SponsoredMintResult.
   */
  mintBadgeReal?: (params: MintBadgeRealParams) => Promise<SponsoredMintResult>;
  /** Wallet + SuiClient passed to mintBadgeReal when present. */
  realMintParams?: MintBadgeRealParams;
  /**
   * Optional callback fired by mintBadgeReal to report intermediate status
   * strings (e.g. "Preparing sponsored transaction…"). Receives null when done.
   */
  onMintStatus?: (status: string | null) => void;
  /**
   * Fired after the prepare endpoint returns with the server dry-run result.
   * Use to display diagnostic info before the wallet prompt.
   */
  onDryRunComplete?: (info: DryRunInfo) => void;
  /** Connected wallet name — used for deterministic compatibility agent events. */
  walletName?: string;
  /**
   * Optional factory for the initial step set. Defaults to makeBaseSteps().
   * Pass makeRealMintSteps for the real two-phase mint path.
   */
  makeSteps?: () => FlowStep[];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runWorkflow(
  scenario: WorkflowScenario,
  storeSnapshot: SuiShieldState,
  callbacks: WorkflowCallbacks
): Promise<{ ok: boolean; title: string; subtitle: string; digest?: string; simulated?: boolean }> {
  const steps = (callbacks.makeSteps ?? makeBaseSteps)();
  const txId = generateId("tx");
  const wallet = "0x9a2b3c4d5e6f7890abcdef1234567890abcdef12";
  const action = "mint_badge";

  function emit(event: Omit<AgentEvent, "id" | "timestamp">) {
    callbacks.onAgentEvent(event);
  }

  function setStep(id: string, status: StepStatus) {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx !== -1) steps[idx] = { ...steps[idx], status };
    callbacks.onStepUpdate([...steps]);
  }

  function skipRemaining(from: string) {
    let found = false;
    for (const s of steps) {
      if (s.id === from) { found = true; continue; }
      if (found && s.status === "pending") {
        s.status = "skipped";
      }
    }
    callbacks.onStepUpdate([...steps]);
  }

  // Create initial intent
  const intent: TransactionIntent = {
    id: txId,
    wallet,
    action,
    status: "pending",
    gasEstimate: 0.004,
    risk: "low",
    decision: null,
    reasonCode: "",
    reasonText: "",
    rpcId: null,
    digest: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  callbacks.onTransactionCreated(intent);

  // ─── Normal Success ──────────────────────────────────────────────────────
  if (scenario === "normal") {
    const isReal = !!(callbacks.mintBadgeReal && callbacks.realMintParams);
    const effectiveWallet = isReal
      ? callbacks.realMintParams!.wallet.address
      : wallet;

    emit({ transactionIntentId: txId, phase: "OBSERVE", category: "Transaction", severity: "info", message: `Mint Badge intent received from wallet ${effectiveWallet.slice(0, 10)}…`, metadata: {} });

    setStep("policy", "running");
    await delay(isReal ? 200 : 380);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "info", message: "Action mint_badge is whitelisted. Gas estimate 0.004 SUI is within the 0.05 SUI limit.", metadata: { action, gasEstimate: 0.004 } });
    setStep("policy", "done");

    setStep("sim", "running");
    if (isReal) {
      emit({ transactionIntentId: txId, phase: "ACT", category: "Simulation", severity: "info", message: "Requesting dry run from sponsor service…", metadata: {} });
    } else {
      await delay(420);
    }
    emit({ transactionIntentId: txId, phase: "ACT", category: "Simulation", severity: "info", message: "Dry run completed successfully — no Move errors detected.", metadata: {} });
    setStep("sim", "done");

    setStep("dup", "running");
    await delay(isReal ? 100 : 280);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "info", message: "No duplicate intent found within the 30-second window.", metadata: {} });
    setStep("dup", "done");

    setStep("budget", "running");
    await delay(isReal ? 100 : 220);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "info", message: "Daily budget check passed. Remaining budget is sufficient.", metadata: {} });
    setStep("budget", "done");

    setStep("rpc", "running");
    await delay(isReal ? 100 : 250);
    emit({ transactionIntentId: txId, phase: "ACT", category: "RPC", severity: "info", message: "Primary RPC selected — latency 380ms, checkpoint fresh.", metadata: { rpcId: "rpc-1" } });
    setStep("rpc", "done");

    setStep("sponsor", "running");
    emit({ transactionIntentId: txId, phase: "ACT", category: "Gasless", severity: "info", message: isReal ? "Requesting sponsor signature from server…" : "Gas sponsored for tx. Sponsor signature added.", metadata: {} });

    if (isReal) {
      // ── Emit wallet compatibility agent events ─────────────────────────
      const walletName = callbacks.walletName ?? "";
      const compat = getWalletCompatibility(walletName);

      emit({
        transactionIntentId: txId,
        phase: "OBSERVE",
        category: "Wallet",
        severity: "info",
        message: `Connected wallet identified as ${compat.walletName || "unknown"} (${walletName || "no wallet"}).`,
        metadata: { walletName, compatibilityLevel: compat.level },
      });

      if (compat.level === "recommended") {
        emit({
          transactionIntentId: txId,
          phase: "REASON",
          category: "Wallet",
          severity: "info",
          message:
            "Wallet is approved for the reference sponsored transaction demo. " +
            "Slush fully supports Sui sponsored transactions.",
          metadata: {},
        });
        emit({
          transactionIntentId: txId,
          phase: "ACT",
          category: "Wallet",
          severity: "info",
          message:
            "Proceeding with server-side preparation and final dry run before wallet signing.",
          metadata: {},
        });
      } else if (compat.level === "warning") {
        const allowed = isPhantomAllowed();
        emit({
          transactionIntentId: txId,
          phase: "REASON",
          category: "Wallet",
          severity: "warn",
          message:
            "Phantom may preview sponsored Sui transactions as if the sender pays gas, " +
            "despite sponsor gas being present. This is a wallet preview limitation, " +
            "not a transaction construction error.",
          metadata: { errorCode: WALLET_ERROR_CODES.UNSUPPORTED_WALLET_PREVIEW },
        });
        emit({
          transactionIntentId: txId,
          phase: "ACT",
          category: "Wallet",
          severity: allowed ? "warn" : "danger",
          message: allowed
            ? "Proceeding with Phantom developer override — preview warnings acknowledged."
            : "Real sponsored mint paused. Slush Wallet recommended for this demo.",
          metadata: {
            errorCode: allowed
              ? WALLET_ERROR_CODES.UNSUPPORTED_WALLET_PREVIEW
              : WALLET_ERROR_CODES.UNSUPPORTED_WALLET_PREVIEW,
          },
        });
      } else {
        emit({
          transactionIntentId: txId,
          phase: "REASON",
          category: "Wallet",
          severity: "warn",
          message: `Wallet "${walletName}" compatibility with sponsored transactions is unverified.`,
          metadata: { errorCode: WALLET_ERROR_CODES.WALLET_COMPATIBILITY_UNVERIFIED },
        });
      }

      // ── Real path ──────────────────────────────────────────────────────
      // Drive the granular realMintSteps (eligibility→prepare→dryrun→sign→
      // sponsor_sign) by wrapping the status callbacks. This avoids having
      // the UI component call setSteps in parallel and racing with onStepUpdate.
      setStep("eligibility", "running");

      const wrappedOnMintStatus = (status: string | null) => {
        callbacks.onMintStatus?.(status);
        if (!status) return;
        if (status.includes("Preparing")) {
          setStep("eligibility", "done");
          setStep("prepare", "running");
        } else if (status.includes("Waiting for wallet")) {
          setStep("prepare", "done");
          setStep("sign", "running");
        } else if (status.includes("Sponsor signing")) {
          setStep("sign", "done");
          setStep("sponsor_sign", "running");
        }
      };

      const wrappedOnDryRunComplete = (info: DryRunInfo) => {
        callbacks.onDryRunComplete?.(info);
        setStep("eligibility", "done");
        setStep("dryrun", "running");
        setStep("dryrun", "done");
      };

      const mintResult = await callbacks.mintBadgeReal!({
        ...callbacks.realMintParams!,
        onMintStatus: wrappedOnMintStatus,
        onDryRunComplete: wrappedOnDryRunComplete,
      });

      if (!mintResult.ok) {
        // Find whichever step is still "running" — that's where the failure occurred.
        const failStep =
          steps.find((s) => s.status === "running")?.id ?? "eligibility";
        setStep(failStep, "failed");
        skipRemaining(failStep);
        const errMsg = mintResult.error;
        const isMoveAbort = !mintResult.simulated && mintResult.moveAbortCode !== undefined;
        emit({
          transactionIntentId: txId,
          phase: "RESULT",
          category: "Error",
          severity: "danger",
          message: isMoveAbort
            ? `Transaction rejected — Move abort code ${mintResult.moveAbortCode}: ${errMsg}`
            : `Transaction failed: ${errMsg}`,
          metadata: { error: errMsg },
        });
        callbacks.onTransactionUpdated(txId, {
          status: "failed",
          decision: "reject",
          reasonCode: isMoveAbort ? "SIMULATION_FAILED" : "POLICY_PASSED",
          reasonText: errMsg,
          updatedAt: nowIso(),
        });
        const abortCode =
          "moveAbortCode" in mintResult ? mintResult.moveAbortCode : undefined;
        const alreadyClaimed =
          errMsg.toLowerCase().includes("already claimed") || abortCode === 7;
        return {
          ok: false,
          title: alreadyClaimed ? "Badge already minted" : "Transaction failed",
          subtitle: errMsg,
        };
      }

      setStep("sponsor_sign", "done");
      setStep("submit", "running");
      const network = getActiveNetwork();
      const networkLabel = getNetworkLabel(network);
      emit({
        transactionIntentId: txId,
        phase: "ACT",
        category: "Gasless",
        severity: "info",
        message: `User signed. Sponsor signed server-side. Submitting to Sui ${networkLabel}…`,
        metadata: {},
      });

      const realDigest = mintResult.digest;
      emit({
        transactionIntentId: txId,
        phase: "RESULT",
        category: "Gasless",
        severity: "success",
        message: `Sponsored Mint Badge confirmed on Sui ${networkLabel.toLowerCase()}. Digest: ${realDigest}`,
        metadata: { digest: realDigest, network },
      });
      emit({
        transactionIntentId: txId,
        phase: "RESULT",
        category: "Wallet",
        severity: "success",
        message:
          `Wallet ${getWalletCompatibility(callbacks.walletName ?? "").walletName || callbacks.walletName || "connected"} ` +
          "signed the exact prepared bytes. Sponsor signed server-side. Badge minted.",
        metadata: { walletName: callbacks.walletName ?? "" },
      });
      setStep("submit", "done");
      setStep("verify", "done");
      setStep("success", "done");

      callbacks.onTransactionUpdated(txId, {
        status: "confirmed",
        decision: "approve",
        reasonCode: "POLICY_PASSED",
        reasonText: REASON_CODE_MESSAGES.POLICY_PASSED,
        rpcId: "rpc-1",
        digest: realDigest,
        updatedAt: nowIso(),
      });

      return {
        ok: true,
        title: `Badge minted on Sui ${networkLabel.toLowerCase()}`,
        subtitle: `Gas paid by sponsor · Sui ${networkLabel}`,
        digest: realDigest,
        simulated: false,
      };
    }

    // ── Simulation path ────────────────────────────────────────────────────
    await delay(350);
    emit({ transactionIntentId: txId, phase: "ACT", category: "Gasless", severity: "info", message: "Gas sponsored for tx. Sponsor signature added.", metadata: {} });
    setStep("sponsor", "done");

    setStep("submit", "running");
    await delay(450);
    const digest = `0x${randomHex(6)}…${randomHex(3)}`;
    emit({ transactionIntentId: txId, phase: "RESULT", category: "Gasless", severity: "success", message: `Sponsored Mint Badge transaction confirmed. Digest: ${digest}`, metadata: { digest } });
    setStep("submit", "done");
    setStep("success", "done");

    callbacks.onTransactionUpdated(txId, { status: "confirmed", decision: "approve", reasonCode: "POLICY_PASSED", reasonText: REASON_CODE_MESSAGES.POLICY_PASSED, rpcId: "rpc-1", digest, updatedAt: nowIso() });

    return { ok: true, title: "Badge minted successfully", subtitle: "Gas paid by sponsor · Simulation", digest, simulated: true };
  }

  // ─── Duplicate Request ───────────────────────────────────────────────────
  if (scenario === "duplicate") {
    emit({ transactionIntentId: txId, phase: "OBSERVE", category: "Transaction", severity: "warn", message: `Identical Mint Badge intent from wallet ${wallet.slice(0, 8)}… observed 8 seconds ago.`, metadata: {} });

    setStep("policy", "running");
    await delay(320);
    setStep("policy", "done");

    setStep("sim", "running");
    await delay(280);
    setStep("sim", "done");

    setStep("dup", "running");
    await delay(380);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "warn", message: "Duplicate intent detected within the 30-second window. Duplicate protection policy active.", metadata: { windowSeconds: 30 } });
    emit({ transactionIntentId: txId, phase: "ACT", category: "Gasless", severity: "warn", message: "Sponsorship blocked. User notified. Gas saved.", metadata: {} });
    setStep("dup", "failed");
    skipRemaining("dup");

    emit({ transactionIntentId: txId, phase: "RESULT", category: "Gasless", severity: "warn", message: "Transaction rejected — duplicate detected.", metadata: { reasonCode: "DUPLICATE_DETECTED" } });
    callbacks.onTransactionUpdated(txId, { status: "rejected", decision: "reject", reasonCode: "DUPLICATE_DETECTED", reasonText: REASON_CODE_MESSAGES.DUPLICATE_DETECTED, updatedAt: nowIso() });

    return { ok: false, title: "Duplicate intent blocked", subtitle: "Gas saved · duplicate protection active" };
  }

  // ─── RPC Failure ────────────────────────────────────────────────────────
  if (scenario === "rpc_failure") {
    emit({ transactionIntentId: txId, phase: "OBSERVE", category: "RPC", severity: "warn", message: "Primary RPC latency exceeded threshold (2.8s > 2s configured limit).", metadata: { latencyMs: 2800 } });
    callbacks.onRpcUpdate("rpc-1", 2800, "degraded");
    callbacks.onModeChange("degraded");

    setStep("policy", "running"); await delay(300); setStep("policy", "done");
    setStep("sim", "running"); await delay(300); setStep("sim", "done");
    setStep("dup", "running"); await delay(280); setStep("dup", "done");
    setStep("budget", "running"); await delay(220); setStep("budget", "done");

    setStep("rpc", "running");
    await delay(700);
    emit({ transactionIntentId: txId, phase: "REASON", category: "RPC", severity: "info", message: "Primary RPC degraded. Backup RPC 1 has acceptable latency (420ms) and fresher checkpoint.", metadata: { primaryLatency: 2800, backupLatency: 420 } });
    emit({ transactionIntentId: txId, phase: "ACT", category: "RPC", severity: "info", message: "Switched active endpoint to Backup RPC 1.", metadata: { rpcId: "rpc-2" } });
    callbacks.onActiveRpcChange("rpc-2");
    setStep("rpc", "done");

    setStep("sponsor", "running"); await delay(350); setStep("sponsor", "done");
    setStep("submit", "running"); await delay(450);
    const digest = `0x${randomHex(6)}…${randomHex(3)}`;
    emit({ transactionIntentId: txId, phase: "RESULT", category: "Gasless", severity: "success", message: `Transaction confirmed via Backup RPC 1. Digest: ${digest}`, metadata: { digest, rpcId: "rpc-2" } });
    setStep("submit", "done");
    setStep("success", "done");

    callbacks.onTransactionUpdated(txId, { status: "confirmed", decision: "recover", reasonCode: "POLICY_PASSED", reasonText: "RPC failover succeeded. Transaction completed via backup endpoint.", rpcId: "rpc-2", digest, updatedAt: nowIso() });

    return { ok: true, title: "Badge minted via Backup RPC", subtitle: "RPC failover succeeded · Simulation", digest };
  }

  // ─── Network Instability ─────────────────────────────────────────────────
  if (scenario === "unstable") {
    emit({ transactionIntentId: txId, phase: "OBSERVE", category: "Incident", severity: "warn", message: "Sui checkpoint freshness exceeded safe threshold. Last checkpoint 92 seconds ago.", metadata: { staleness: 92 } });
    callbacks.onModeChange("protective");

    setStep("policy", "running"); await delay(320); setStep("policy", "done");
    setStep("sim", "running");
    await delay(350);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "warn", message: "Network in Protective Mode. Policy: pause write actions, queue intent for replay.", metadata: {} });
    emit({ transactionIntentId: txId, phase: "ACT", category: "Protective", severity: "danger", message: "Protective Mode enabled. Gasless sponsorship paused. Intent queued.", metadata: {} });
    setStep("sim", "failed");
    skipRemaining("sim");

    callbacks.onIncident(
      "Network Instability",
      "Checkpoint Stale",
      ["Entered Protective Mode", "Paused sponsorship", "Queued transaction intent"],
    );
    callbacks.onQueueIntent(txId);
    callbacks.onTransactionUpdated(txId, { status: "queued", decision: "recover", reasonCode: "PROTECTIVE_MODE_QUEUE", reasonText: REASON_CODE_MESSAGES.PROTECTIVE_MODE_QUEUE, updatedAt: nowIso() });

    emit({ transactionIntentId: txId, phase: "RESULT", category: "Protective", severity: "warn", message: "Intent queued. Will replay when network checkpoint freshness recovers.", metadata: {} });

    return { ok: false, title: "Transaction queued", subtitle: "Protective Mode active · Will replay when network stabilizes" };
  }

  // ─── Budget Exceeded ─────────────────────────────────────────────────────
  if (scenario === "budget_exceeded") {
    emit({ transactionIntentId: txId, phase: "OBSERVE", category: "Gasless", severity: "warn", message: "Sponsoring this transaction would exceed the configured daily budget.", metadata: {} });

    setStep("policy", "running"); await delay(280); setStep("policy", "done");
    setStep("sim", "running"); await delay(250); setStep("sim", "done");
    setStep("dup", "running"); await delay(220); setStep("dup", "done");

    setStep("budget", "running");
    await delay(380);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "warn", message: "Daily gas budget of 10 SUI would be exceeded. Policy: reject sponsorship.", metadata: { dailyBudget: 10 } });
    emit({ transactionIntentId: txId, phase: "ACT", category: "Gasless", severity: "warn", message: "Sponsorship rejected. Manual approval required to release additional budget.", metadata: {} });
    setStep("budget", "failed");
    skipRemaining("budget");

    emit({ transactionIntentId: txId, phase: "RESULT", category: "Gasless", severity: "warn", message: "Transaction rejected — daily budget exceeded.", metadata: { reasonCode: "DAILY_BUDGET_EXCEEDED" } });
    callbacks.onTransactionUpdated(txId, { status: "rejected", decision: "reject", reasonCode: "DAILY_BUDGET_EXCEEDED", reasonText: REASON_CODE_MESSAGES.DAILY_BUDGET_EXCEEDED, updatedAt: nowIso() });

    return { ok: false, title: "Sponsorship rejected", subtitle: "Daily budget exceeded — manual approval required" };
  }

  // ─── Move Abort ──────────────────────────────────────────────────────────
  if (scenario === "move_abort") {
    emit({ transactionIntentId: txId, phase: "OBSERVE", category: "Simulation", severity: "danger", message: "Transaction simulation returned MoveAbort code 7 (EBadgeAlreadyMinted).", metadata: { abortCode: 7 } });

    setStep("policy", "running"); await delay(280); setStep("policy", "done");

    setStep("sim", "running");
    await delay(500);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "danger", message: "Deterministic Move abort detected. Retrying this transaction will fail identically. No retry.", metadata: { moveError: "EBadgeAlreadyMinted" } });
    emit({ transactionIntentId: txId, phase: "ACT", category: "Gasless", severity: "danger", message: "Sponsorship denied. Move abort errors are not retryable by policy.", metadata: {} });
    setStep("sim", "failed");
    skipRemaining("sim");

    emit({ transactionIntentId: txId, phase: "RESULT", category: "Error", severity: "danger", message: "Transaction rejected — Move abort EBadgeAlreadyMinted. No retry attempted.", metadata: { reasonCode: "SIMULATION_FAILED", moveError: "EBadgeAlreadyMinted" } });
    callbacks.onTransactionUpdated(txId, { status: "rejected", decision: "reject", reasonCode: "SIMULATION_FAILED", reasonText: "Simulation returned MoveAbort code 7 (EBadgeAlreadyMinted). Deterministic error — no retry.", updatedAt: nowIso() });

    return { ok: false, title: "Move abort detected", subtitle: "Contract error: EBadgeAlreadyMinted — automatic retry disabled" };
  }

  return { ok: false, title: "Unknown scenario", subtitle: "" };
}

export type { SuiShieldState };
