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
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runWorkflow(
  scenario: WorkflowScenario,
  storeSnapshot: SuiShieldState,
  callbacks: WorkflowCallbacks
): Promise<{ ok: boolean; title: string; subtitle: string; digest?: string }> {
  const steps = makeBaseSteps();
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
    emit({ transactionIntentId: txId, phase: "OBSERVE", category: "Transaction", severity: "info", message: `Mint Badge intent received from wallet ${wallet.slice(0, 8)}…`, metadata: {} });

    setStep("policy", "running");
    await delay(380);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "info", message: "Action mint_badge is whitelisted. Gas estimate 0.004 SUI is within the 0.05 SUI limit.", metadata: { action, gasEstimate: 0.004 } });
    setStep("policy", "done");

    setStep("sim", "running");
    await delay(420);
    emit({ transactionIntentId: txId, phase: "ACT", category: "Simulation", severity: "info", message: "Dry run completed successfully — no Move errors detected.", metadata: {} });
    setStep("sim", "done");

    setStep("dup", "running");
    await delay(280);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "info", message: "No duplicate intent found within the 30-second window.", metadata: {} });
    setStep("dup", "done");

    setStep("budget", "running");
    await delay(220);
    emit({ transactionIntentId: txId, phase: "REASON", category: "Policy", severity: "info", message: "Daily budget check passed. Remaining budget is sufficient.", metadata: {} });
    setStep("budget", "done");

    setStep("rpc", "running");
    await delay(250);
    emit({ transactionIntentId: txId, phase: "ACT", category: "RPC", severity: "info", message: "Primary RPC selected — latency 380ms, checkpoint fresh.", metadata: { rpcId: "rpc-1" } });
    setStep("rpc", "done");

    setStep("sponsor", "running");
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

    return { ok: true, title: "Badge minted successfully", subtitle: "Gas paid by sponsor · Simulation", digest };
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
