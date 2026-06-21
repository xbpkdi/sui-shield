"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  RefreshCcw,
  ShieldAlert,
  Wallet,
  Bug,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ClipboardList,
  Zap,
  ArrowRight,
  ExternalLink,
  Copy,
  ChevronDown,
  Shield,
} from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  pageActionClass,
  cardGridDemoClass,
  cardBodyClass,
  cardBodyCompactClass,
  listCompactClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import {
  runWorkflow,
  makeBaseSteps,
  makeRealMintSteps,
  type FlowStep,
  type WorkflowScenario,
} from "@/features/agent/workflow";
import { nowIso } from "@/lib/utils";
import { explorerTxUrl, isRealDigest } from "@/lib/sui/explorer";
import { mintBadgeReal, hasClaimedBadgeOnChain, type DryRunInfo } from "@/lib/sui/real-provider";
import { signPreparedBytesWithZkLogin } from "@/lib/sui/zklogin-signer";
import { useSuiClient } from "@mysten/dapp-kit";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";
import { saveAuthNext } from "@/lib/auth/redirect";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { HcaiTrustStrip } from "@/components/hcai/HcaiTrustStrip";
import { HumanControlPanel } from "@/components/hcai/HumanControlPanel";
import { CapabilityLabel, type CapabilityMode } from "@/components/hcai/CapabilityLabel";
import { HCAI_TAGLINE } from "@/lib/hcai/principles";

interface Outcome {
  ok: boolean;
  title: string;
  subtitle: string;
  digest?: string;
  simulated?: boolean;
}

interface AgentDecision {
  observed: string;
  risk: "Low" | "Medium" | "High";
  policy: "Passed" | "Denied";
  decision: string;
  reason: string;
  action: string;
  tone: "success" | "warning" | "danger" | "info";
}

interface TimelineEvent {
  time: string;
  text: string;
  tone: "info" | "success" | "warning" | "danger";
}

const scenarios: {
  key: WorkflowScenario;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "normal", label: "Normal Success", icon: CheckCircle2 },
  { key: "duplicate", label: "Duplicate Request", icon: ShieldCheck },
  { key: "rpc_failure", label: "RPC Failure", icon: RefreshCcw },
  { key: "unstable", label: "Network Instability", icon: ShieldAlert },
  { key: "budget_exceeded", label: "Budget Exceeded", icon: Wallet },
  { key: "move_abort", label: "Move Abort", icon: Bug },
];

const DECISION_MAP: Record<WorkflowScenario, AgentDecision> = {
  normal: {
    observed: "Mint Badge intent. Action whitelisted, budget OK, no duplicate.",
    risk: "Low",
    policy: "Passed",
    decision: "Sponsor",
    reason: "All policy checks passed. Sponsor gas budget sufficient.",
    action: "Gas sponsored via Primary RPC. Transaction submitted.",
    tone: "success",
  },
  duplicate: {
    observed: "Repeat intent detected within 60s dedup window.",
    risk: "Medium",
    policy: "Denied",
    decision: "Reject",
    reason: "Duplicate detected within dedup window.",
    action: "Intent rejected — sponsor gas protected.",
    tone: "warning",
  },
  rpc_failure: {
    observed: "Primary RPC latency exceeded threshold (2.8s > 2s).",
    risk: "Medium",
    policy: "Passed",
    decision: "Failover",
    reason: "Primary endpoint degraded. Backup RPC healthy.",
    action: "Switched to Backup RPC. Transaction re-submitted successfully.",
    tone: "info",
  },
  unstable: {
    observed: "Checkpoint freshness lag > 30s. Network instability detected.",
    risk: "High",
    policy: "Denied",
    decision: "Protect",
    reason: "Network state uncertain. Entered Protective Mode.",
    action: "Intent queued. Will replay when network stabilises.",
    tone: "danger",
  },
  budget_exceeded: {
    observed: "Gas budget limit reached for current period.",
    risk: "High",
    policy: "Denied",
    decision: "Reject",
    reason: "Sponsor budget exhausted for this period.",
    action: "Intent rejected — no gas spent.",
    tone: "danger",
  },
  move_abort: {
    observed: "BadgeAlreadyMinted abort (code 7) from Move contract.",
    risk: "Low",
    policy: "Passed",
    decision: "Abort",
    reason: "Move contract rejected the transaction with abort code 7.",
    action: "Transaction reverted. Sponsor recovered unspent gas.",
    tone: "warning",
  },
};

function buildDecision(scenario: WorkflowScenario, result: Outcome): AgentDecision {
  if (result.ok) return DECISION_MAP[scenario];

  const alreadyClaimed =
    result.subtitle.toLowerCase().includes("already claimed") ||
    result.subtitle.includes("abort code 7");

  if (alreadyClaimed) {
    return {
      observed: "On-chain eligibility check: this wallet already owns a Starter Badge.",
      risk: "Low",
      policy: "Denied",
      decision: "Reject",
      reason: "The Move contract allows one badge per wallet (BadgeAlreadyMinted / abort 7).",
      action: "Mint blocked — no sponsor gas spent. Use another Google account or reset is not possible on-chain.",
      tone: "warning",
    };
  }

  return {
    observed: DECISION_MAP[scenario].observed,
    risk: "Medium",
    policy: "Passed",
    decision: "Failed",
    reason: result.subtitle,
    action: "Transaction halted before completion. Expand error details below.",
    tone: "danger",
  };
}

function StepIcon({ status }: { status: FlowStep["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="size-5 animate-spin text-ember-400" aria-hidden="true" />;
    case "done":
      return <CheckCircle2 className="size-5 text-emerald-400" aria-hidden="true" />;
    case "failed":
      return <AlertTriangle className="size-5 text-red-400" aria-hidden="true" />;
    case "skipped":
      return (
        <span className="grid size-5 place-items-center rounded-full border border-white/10 text-[10px] text-muted-foreground/60" aria-hidden="true">
          —
        </span>
      );
    default:
      return null;
  }
}

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export function DemoLabClient() {
  const store = useSuiShieldStore();
  const { session, error: zkLoginError, signIn } = useZkLogin();
  const suiClient = useSuiClient();
  const { copied: addressCopied, copy: copyAddress } = useCopyToClipboard();

  const [steps, setSteps] = useState<FlowStep[]>(makeBaseSteps());
  const [running, setRunning] = useState(false);
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [dryRunInfo, setDryRunInfo] = useState<DryRunInfo | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [activeScenario, setActiveScenario] = useState<WorkflowScenario>("normal");
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [alreadyMinted, setAlreadyMinted] = useState(false);
  const [checkingMinted, setCheckingMinted] = useState(false);

  const sponsorConfigured =
    !!process.env.NEXT_PUBLIC_BADGE_PACKAGE_ID &&
    !!process.env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID;

  const canRunReal = !!(session && sponsorConfigured);
  const networkLabel = getNetworkLabel(getActiveNetwork());

  const effectiveAddress = session
    ? `${session.address.slice(0, 6)}…${session.address.slice(-4)}`
    : "0x9a2…ef12";

  useEffect(() => {
    if (!session || !sponsorConfigured) {
      setAlreadyMinted(false);
      return;
    }
    let cancelled = false;
    setCheckingMinted(true);
    hasClaimedBadgeOnChain(suiClient, session.address)
      .then((claimed) => {
        if (!cancelled) setAlreadyMinted(claimed);
      })
      .finally(() => {
        if (!cancelled) setCheckingMinted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, sponsorConfigured, suiClient]);

  function addEvent(text: string, tone: TimelineEvent["tone"] = "info") {
    setEvents((e) => [...e, { time: now(), text, tone }]);
  }

  const handleMintStatus = useCallback((status: string | null) => {
    setMintStatus(status);
  }, []);

  const _executeScenario = useCallback(
    async (scenario: WorkflowScenario) => {
      if (running) return;
      setActiveScenario(scenario);
      setRunning(true);
      setMintStatus(null);
      setDryRunInfo(null);
      setOutcome(null);
      setDecision(null);
      setErrorExpanded(false);
      setEvents([]);

      const isRealRun = scenario === "normal" && canRunReal;
      setSteps(isRealRun ? makeRealMintSteps() : makeBaseSteps());

      addEvent(
        `Starting scenario: ${scenarios.find((s) => s.key === scenario)?.label}${isRealRun ? ` (Sui ${networkLabel})` : " (Simulation)"}`,
        "info"
      );

      const result = await runWorkflow(scenario, store, {
        onStepUpdate: setSteps,
        makeSteps: isRealRun ? makeRealMintSteps : makeBaseSteps,
        onAgentEvent: (event) => store.pushAgentEvent(event),
        onTransactionCreated: (tx) => store.addTransaction(tx),
        onTransactionUpdated: (id, patch) => store.updateTransaction(id, patch),
        onModeChange: (mode) => {
          store.setMode(mode);
          if (mode === "protective") addEvent("Entered Protective Mode", "danger");
          else if (mode === "degraded") addEvent("System mode: Degraded", "warning");
        },
        onRpcUpdate: (id, latencyMs, status) =>
          store.setRpcStatus(id, { latencyMs, status: status as never, lastCheckedAt: nowIso() }),
        onActiveRpcChange: (id) => {
          store.setActiveRpc(id);
          const rpc = store.rpcEndpoints.find((r) => r.id === id);
          if (rpc) addEvent(`Switched to ${rpc.name}`, "info");
        },
        onIncident: (title, type, actions) => {
          store.addIncident({
            type,
            title,
            status: "active",
            startedAt: nowIso(),
            resolvedAt: null,
            affectedTransactions: [],
            actions,
            summary: `${title} — agent entered Protective Mode and queued pending intents.`,
            timeline: [{ time: now(), text: `${title} detected` }],
          });
          addEvent(`Incident created: ${title}`, "danger");
        },
        onQueueIntent: (id) => {
          store.queueIntent(id);
          addEvent(`Intent ${id} queued`, "warning");
        },
        walletName: "Google (zkLogin)",
        ...(isRealRun && session
          ? {
              mintBadgeReal,
              realMintParams: {
                wallet: {
                  address: session.address,
                  signTransaction: (txBytesBase64: string) =>
                    signPreparedBytesWithZkLogin(session, txBytesBase64),
                },
                suiClient,
              },
              onMintStatus: handleMintStatus,
              onDryRunComplete: (info: DryRunInfo) => setDryRunInfo(info),
            }
          : {}),
      });

      setDecision(buildDecision(scenario, result));
      addEvent(
        result.ok ? "Scenario completed successfully" : `Scenario failed: ${result.subtitle}`,
        result.ok ? "success" : "danger"
      );
      setOutcome(result);
      setErrorExpanded(!result.ok);
      if (!result.ok && result.subtitle.toLowerCase().includes("already claimed")) {
        setAlreadyMinted(true);
      }
      setRunning(false);
    },
    [running, store, canRunReal, session, suiClient, handleMintStatus, networkLabel]
  );

  const handleRunScenario = useCallback(
    (scenario: WorkflowScenario) => {
      void _executeScenario(scenario);
    },
    [_executeScenario]
  );

  function resetDemo() {
    store.reset();
    setSteps(makeBaseSteps());
    setOutcome(null);
    setDecision(null);
    setEvents([]);
    setMintStatus(null);
    setDryRunInfo(null);
    setErrorExpanded(false);
    setActiveScenario("normal");
  }

  const isProtective = store.currentMode === "protective";
  const capabilityMode: CapabilityMode = isProtective
    ? "paused"
    : canRunReal
      ? "live"
      : "simulation";

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Demo Lab"
        title="Agent Demo Lab"
        description={
          <>
            <span className="hidden sm:inline">
              {`Human-centered agent demo — transparent reasoning, you sign every tx. Normal Success runs on Sui ${networkLabel} when zkLogin is signed in and the contract is deployed.`}
            </span>
            <span className="sm:hidden">
              Transparent agent trace on Sui {networkLabel}. You sign; sponsor co-signs after policy checks.
            </span>
          </>
        }
        badges={<CapabilityLabel mode={capabilityMode} />}
        actions={
          <button onClick={resetDemo} className={pageActionClass}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset Demo
          </button>
        }
      />

      <PageSection>
        <HcaiTrustStrip />
      </PageSection>

      {alreadyMinted && canRunReal && (
        <PageSection>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <strong>Badge already minted.</strong> This zkLogin wallet (
            <span className="font-mono">{effectiveAddress}</span>) already owns a Starter Badge on
            Sui {networkLabel}. Minting again is blocked by the contract — not a UI bug. Sign in
            with a different Google account to mint again.
          </div>
        </PageSection>
      )}

      {zkLoginError && (
        <PageSection>
        <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{zkLoginError}</p>
            <button
              onClick={() => {
                saveAuthNext("/demo-lab");
                void signIn();
              }}
              className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Sign in with Google
            </button>
          </div>
        </div>
        </PageSection>
      )}

      {!sponsorConfigured && (
        <PageSection>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/6 px-4 py-3 text-sm text-amber-300">
          <strong>Demo mode:</strong> Deploy the Move contract and set{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_BADGE_PACKAGE_ID</code> +{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID</code> +{" "}
          <code className="font-mono text-xs">SUI_SPONSOR_PRIVATE_KEY</code> to enable real
          {networkLabel.toLowerCase()} transactions. All scenarios run as simulations until then.
        </div>
        </PageSection>
      )}

      <PageSection>
        <HumanControlPanel />
      </PageSection>

      <PageSection>
      <GlassCard hover accent="ember" className={cardBodyCompactClass} aria-label="Scenario selector">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
          {scenarios.map((s) => {
            const willBeReal = s.key === "normal" && canRunReal;
            return (
              <button
                key={s.key}
                onClick={() => handleRunScenario(s.key)}
                disabled={running}
                aria-label={`Run scenario: ${s.label}${willBeReal ? " (real)" : " (simulation)"}`}
                className={`group flex min-h-[4.5rem] flex-col items-start justify-between gap-1.5 rounded-xl border px-3 py-3 text-left text-xs transition-[border-color,background-color,box-shadow,color] duration-100 ease-out active:scale-[0.99] active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 data-cursor-hover ${
                  activeScenario === s.key && !running
                    ? "border-ember-500/40 bg-gradient-to-br from-blue-500/12 to-ember-500/10 shadow-[0_8px_28px_-10px_rgba(255,107,53,0.35)]"
                    : "border-subtle bg-surface-muted hover:border-blue-400/25 hover:bg-blue-400/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <s.icon className="size-3.5 shrink-0 text-blue-300" aria-hidden="true" />
                  <span className="truncate font-medium">{s.label}</span>
                </div>
                <span className={`text-[10px] ${willBeReal ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                  {willBeReal ? `Sui ${networkLabel}` : "Simulation"}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>
      </PageSection>

      <PageSection delay={0.06}>
      <div className={cardGridDemoClass}>
        <GlassCard hover accent="blue" className={`relative overflow-hidden ${cardBodyClass}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Demo Sui dApp · {canRunReal ? `Sui ${networkLabel}` : "Simulation"}
              </div>
              <h2 className="mt-1 text-xl font-semibold">Mint Starter Badge Gasless</h2>
            </div>
            <StatusBadge
              tone={
                isProtective ? "danger" : alreadyMinted ? "warning" : checkingMinted ? "muted" : "success"
              }
            >
              {isProtective
                ? "Paused — Protective Mode"
                : alreadyMinted
                  ? "Already minted"
                  : checkingMinted
                    ? "Checking…"
                    : "Eligible"}
            </StatusBadge>
          </div>

          {/* User info */}
          <div className="mt-5 rounded-xl border border-subtle bg-surface-muted p-4">
            {session ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Auth method</span>
                  <div className="flex items-center gap-1.5">
                    <Shield className="size-3 text-blue-300" aria-hidden="true" />
                    <span className="font-medium">Google · zkLogin</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Address</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-mono text-foreground transition-colors hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                    onClick={() => void copyAddress(session.address)}
                    aria-label={addressCopied ? "Address copied" : "Copy wallet address"}
                  >
                    {addressCopied ? "Copied!" : effectiveAddress}
                    <Copy className="size-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-blue-300">{networkLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gas payment</span>
                  <span className="text-emerald-400">Sponsored by application</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">User wallet</span>
                  <span className="font-mono text-muted-foreground">{effectiveAddress} (demo)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gas payment</span>
                  <span className="text-emerald-400">Sponsored by application</span>
                </div>
              </div>
            )}
          </div>

          {/* Dry-run info */}
          <AnimatePresence>
            {dryRunInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/6 px-3 py-2.5 text-xs"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  <span className="font-medium">Server dry run passed</span>
                </div>
                <div className="space-y-0.5 text-muted-foreground">
                  <div>Sender: <span className="font-mono text-foreground/70">{session?.address.slice(0, 10)}…</span></div>
                  <div>Gas owner: <span className="font-mono text-foreground/70">{dryRunInfo.sponsorAddress.slice(0, 10)}…</span> <span className="text-emerald-400/70">(sponsor)</span></div>
                  <div>Gas estimate: <span className="font-mono text-foreground/70">{dryRunInfo.gasEstimateMist.toLocaleString()} MIST</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mint button */}
          <button
            type="button"
            disabled={running || isProtective || alreadyMinted}
            onClick={() => handleRunScenario("normal")}
            className="btn-magnetic group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-cta px-5 py-3.5 text-sm font-bold text-cinema-navy shadow-[0_0_32px_-6px_rgba(255,107,53,0.5)] transition-[box-shadow,transform] duration-100 hover:shadow-[0_0_40px_-4px_rgba(255,107,53,0.65)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 data-cursor-hover"
          >
            <Zap className="size-4" aria-hidden="true" />
            {running ? (mintStatus ?? "Working…") : "Mint Badge Gasless"}
            <ArrowRight className="size-4 transition-transform duration-100 group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Gas sponsored by app · {canRunReal ? `Sui ${networkLabel}` : "Simulation"}
          </p>

          {/* Flow steps */}
          <div className={`mt-6 ${listCompactClass}`} role="list" aria-label="Transaction flow steps">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                layout
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  step.status === "running"
                    ? "border-ember-500/30 bg-ember-500/8 shadow-[0_0_24px_-8px_rgba(255,107,53,0.3)]"
                    : step.status === "done"
                      ? "border-emerald-500/15 bg-emerald-500/5"
                      : step.status === "failed"
                        ? "border-red-500/25 bg-red-500/8"
                        : "border-subtle bg-surface-muted"
                }`}
                role="listitem"
              >
                {step.status === "pending" ? (
                  <span className="grid size-5 place-items-center rounded-full border border-subtle text-[10px] text-muted-foreground" aria-hidden="true">
                    {i + 1}
                  </span>
                ) : (
                  <StepIcon status={step.status} />
                )}
                <span
                  className={
                    step.status === "skipped"
                      ? "text-muted-foreground/50"
                      : step.status === "failed"
                      ? "text-red-300"
                      : "text-foreground/90"
                  }
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Outcome */}
          <AnimatePresence>
            {outcome && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-5 rounded-xl border p-4 ${
                  outcome.ok ? "border-emerald-500/30 bg-emerald-500/8" : "border-red-500/25 bg-red-500/6"
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {outcome.ok ? (
                    <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="size-4 text-red-400" aria-hidden="true" />
                  )}
                  {outcome.title}
                </div>

                {!outcome.ok && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-red-200/90">{outcome.subtitle}</p>
                    {!outcome.simulated && (
                      <button
                        onClick={() => setErrorExpanded((e) => !e)}
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        aria-expanded={errorExpanded}
                      >
                        <ChevronDown
                          className={`size-3 transition-transform ${errorExpanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                        {errorExpanded ? "Hide" : "Show"} technical details
                      </button>
                    )}
                    {errorExpanded && !outcome.simulated && (
                      <div className="break-words rounded-lg border border-subtle bg-surface-muted px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {outcome.subtitle}
                      </div>
                    )}
                  </div>
                )}

                {(outcome.ok || outcome.simulated) && (
                  <div className="mt-1 text-xs text-muted-foreground">{outcome.subtitle}</div>
                )}

                {outcome.digest && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-subtle bg-surface-muted px-3 py-2 font-mono text-[12px]">
                    <span className="text-muted-foreground">Tx digest</span>
                    <span className="max-w-[120px] truncate">{outcome.digest}</span>
                    {outcome.simulated === false && isRealDigest(outcome.digest) ? (
                      <a
                        href={explorerTxUrl(outcome.digest, getActiveNetwork())}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-300 transition-colors hover:text-blue-200"
                        aria-label="View on Sui Explorer"
                      >
                        Explorer <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/60">
                        Simulation <ExternalLink className="size-3" />
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        <GlassCard hover accent="violet" className={cardBodyClass} aria-label="Agent decision">
          <div className="relative z-[2] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="size-4 text-violet-300" aria-hidden="true" />
              Explainable decision
            </div>
            <StatusBadge tone="violet">Deterministic</StatusBadge>
          </div>
          <p className="relative z-[2] mt-1 text-xs text-muted-foreground">{HCAI_TAGLINE}</p>
          <AnimatePresence mode="wait">
            {decision ? (
              <motion.div
                key={activeScenario}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-3 ${listCompactClass}`}
              >
                <DecisionField label="Observed signal" value={decision.observed} />
                <div className="flex gap-3">
                  <DecisionField
                    label="Risk"
                    value={
                      <StatusBadge tone={decision.risk === "Low" ? "success" : decision.risk === "Medium" ? "warning" : "danger"}>
                        {decision.risk}
                      </StatusBadge>
                    }
                  />
                  <DecisionField
                    label="Policy"
                    value={<StatusBadge tone={decision.policy === "Passed" ? "success" : "danger"}>{decision.policy}</StatusBadge>}
                  />
                </div>
                <DecisionField
                  label="Decision"
                  value={<StatusBadge tone={decision.tone}>{decision.decision}</StatusBadge>}
                />
                <DecisionField label="Reason" value={decision.reason} />
                <DecisionField label="Action taken" value={decision.action} />
              </motion.div>
            ) : (
              <div className="relative z-[2] mt-5 grid min-h-[280px] place-items-center rounded-xl border border-dashed border-subtle bg-surface-muted px-4 py-12 text-center text-sm text-muted-foreground">
                <ClipboardList className="mb-2 size-5 text-violet-300/70" aria-hidden="true" />
                Run a scenario to see plain-language reasoning for each sponsorship decision.
              </div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
      </PageSection>

      <PageSection delay={0.1}>
      <GlassCard hover className={cardBodyClass} aria-label="Live event timeline">
        <div className="mb-2.5 text-sm font-semibold">Live Event Timeline</div>
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-subtle py-6 text-center text-xs text-muted-foreground">
            No events yet — trigger a scenario above.
          </div>
        ) : (
          <ol className={listCompactClass} aria-label="Event timeline">
            {events.map((e, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-lg border border-subtle bg-surface-muted px-3 py-2 text-sm"
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{e.time}</span>
                <StatusBadge tone={e.tone}>
                  {e.tone === "success" ? "OK" : e.tone === "warning" ? "Warn" : e.tone === "danger" ? "Alert" : "Event"}
                </StatusBadge>
                <span className="text-foreground/90">{e.text}</span>
              </motion.li>
            ))}
          </ol>
        )}
      </GlassCard>
      </PageSection>
    </DashboardPage>
  );
}

function DecisionField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-subtle bg-surface-muted px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
