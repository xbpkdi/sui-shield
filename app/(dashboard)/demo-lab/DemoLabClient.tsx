"use client";

import { useState, useCallback } from "react";
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
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  Copy,
} from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { runWorkflow, makeBaseSteps, type FlowStep, type WorkflowScenario } from "@/features/agent/workflow";
import { nowIso } from "@/lib/utils";

interface Outcome {
  ok: boolean;
  title: string;
  subtitle: string;
  digest?: string;
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
    observed: "Eligible wallet, action whitelisted, no duplicate within window.",
    risk: "Low",
    policy: "Passed",
    decision: "Sponsor Gas",
    reason: "All policy checks passed. Simulation succeeded. Budget available.",
    action: "Gas sponsored via Primary RPC. Transaction submitted.",
    tone: "success",
  },
  duplicate: {
    observed: "Identical Mint Badge intent from same wallet 8 seconds ago.",
    risk: "High",
    policy: "Passed",
    decision: "Block Sponsorship",
    reason: "Duplicate intent detected within the 30-second protection window.",
    action: "Sponsorship blocked. User notified. Gas saved.",
    tone: "danger",
  },
  rpc_failure: {
    observed: "Primary RPC latency degraded to 2.8s — above the 2s threshold.",
    risk: "Medium",
    policy: "Passed",
    decision: "Failover + Sponsor",
    reason: "Backup RPC has 420ms latency and a fresher checkpoint.",
    action: "Switched to Backup RPC. Transaction sponsored and submitted.",
    tone: "info",
  },
  unstable: {
    observed: "Sui checkpoint freshness exceeded safe threshold — 92 seconds since last checkpoint.",
    risk: "High",
    policy: "Passed",
    decision: "Queue Intent · Protective Mode",
    reason: "Network instability detected. Write actions paused to protect user.",
    action: "Entered Protective Mode. Intent queued for replay when network recovers.",
    tone: "warning",
  },
  budget_exceeded: {
    observed: "Daily sponsor budget of 10 SUI would be exceeded by this transaction.",
    risk: "Medium",
    policy: "Denied",
    decision: "Reject Sponsorship",
    reason: "Manual approval required to release additional budget for today.",
    action: "Sponsorship rejected. User advised to retry tomorrow or upgrade tier.",
    tone: "warning",
  },
  move_abort: {
    observed: "Transaction simulation returned MoveAbort code 7 (EBadgeAlreadyMinted).",
    risk: "High",
    policy: "Denied",
    decision: "Stop · No Retry",
    reason: "Deterministic Move error — retrying will fail identically. No retry by policy.",
    action: "Sponsorship denied. Developer-friendly explanation surfaced to user.",
    tone: "danger",
  },
};

function StepIcon({ status }: { status: FlowStep["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="size-5 animate-spin text-blue-300" aria-hidden="true" />;
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

  const [steps, setSteps] = useState<FlowStep[]>(makeBaseSteps());
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [activeScenario, setActiveScenario] = useState<WorkflowScenario>("normal");

  function addEvent(text: string, tone: TimelineEvent["tone"] = "info") {
    setEvents((e) => [...e, { time: now(), text, tone }]);
  }

  const handleRunScenario = useCallback(
    async (scenario: WorkflowScenario) => {
      if (running) return;
      setActiveScenario(scenario);
      setRunning(true);
      setOutcome(null);
      setDecision(null);
      setEvents([]);
      setSteps(makeBaseSteps());

      addEvent(`Starting scenario: ${scenarios.find((s) => s.key === scenario)?.label}`, "info");

      const result = await runWorkflow(scenario, store, {
        onStepUpdate: setSteps,
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
      });

      setDecision(DECISION_MAP[scenario]);
      addEvent(result.ok ? "Scenario completed successfully" : "Scenario ended", result.ok ? "success" : "warning");
      setOutcome(result);
      setRunning(false);
    },
    [running, store]
  );

  function resetDemo() {
    store.reset();
    setSteps(makeBaseSteps());
    setOutcome(null);
    setDecision(null);
    setEvents([]);
    setActiveScenario("normal");
  }

  const isProtective = store.currentMode === "protective";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-blue-300">Demo Lab</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Live Simulation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trigger scenarios and watch the agent observe, reason, and act in real time. All
            activity is labeled <strong>Simulation</strong>.
          </p>
        </div>
        <button
          onClick={resetDemo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset Demo
        </button>
      </header>

      {/* Scenario buttons */}
      <GlassCard className="p-3" aria-label="Scenario selector">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {scenarios.map((s) => (
            <button
              key={s.key}
              onClick={() => handleRunScenario(s.key)}
              disabled={running}
              aria-label={`Run scenario: ${s.label}`}
              className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${
                activeScenario === s.key && !running
                  ? "border-blue-400/40 bg-blue-400/8"
                  : "border-white/5 bg-black/15 hover:border-white/20"
              }`}
            >
              <s.icon className="size-3.5 text-blue-300 shrink-0" aria-hidden="true" />
              <span className="font-medium truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* Demo dApp card */}
        <GlassCard className="relative overflow-hidden p-6">
          <div
            className="absolute -right-16 -top-16 size-56 rounded-full bg-blue-400/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Demo Sui dApp · Simulation
              </div>
              <h2 className="mt-1 text-xl font-semibold">Mint Starter Badge Gasless</h2>
            </div>
            <StatusBadge tone={isProtective ? "danger" : "success"}>
              {isProtective ? "Paused — Protective Mode" : "Eligible"}
            </StatusBadge>
          </div>

          {/* Wallet info */}
          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">User wallet</span>
              <button
                className="inline-flex items-center gap-1 font-mono text-foreground hover:text-blue-300 transition-colors"
                onClick={() => navigator.clipboard?.writeText("0x9a2b3c4d5e6f7890abcdef1234567890abcdef12")}
                aria-label="Copy wallet address"
              >
                0x9a2…ef12
                <Copy className="size-3" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">SUI balance</span>
              <span className="font-mono">0 SUI</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Gas payment</span>
              <span className="text-emerald-400">Sponsored by application</span>
            </div>
          </div>

          {/* Primary mint button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={running || isProtective}
            onClick={() => handleRunScenario("normal")}
            className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 px-5 py-3 text-sm font-semibold text-[#050816] shadow-[0_0_28px_-6px_rgba(77,162,255,0.55)] transition-shadow hover:shadow-[0_0_36px_-4px_rgba(77,162,255,0.7)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Zap className="size-4" aria-hidden="true" />
            {running ? "Working…" : "Mint Badge Gasless"}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </motion.button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Gas sponsored by app · Simulation
          </p>

          {/* Flow steps */}
          <div className="mt-6 space-y-2" role="list" aria-label="Transaction flow steps">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                layout
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                role="listitem"
              >
                {step.status === "pending" ? (
                  <span className="grid size-5 place-items-center rounded-full border border-white/15 text-[10px] text-muted-foreground" aria-hidden="true">
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
                  outcome.ok
                    ? "border-emerald-500/30 bg-emerald-500/8"
                    : "border-red-500/25 bg-red-500/6"
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {outcome.ok ? (
                    <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="size-4 text-red-400" aria-hidden="true" />
                  )}
                  {outcome.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{outcome.subtitle}</div>
                {outcome.digest && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[12px]">
                    <span className="text-muted-foreground">Tx digest</span>
                    <span>{outcome.digest}</span>
                    <span className="inline-flex items-center gap-1 text-blue-300 opacity-60" aria-label="Explorer link (simulation — not a real transaction)">
                      Simulation <ExternalLink className="size-3" />
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Agent decision panel */}
        <GlassCard className="p-6" aria-label="Agent decision">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-violet-400" aria-hidden="true" />
            Agent Decision
          </div>
          <AnimatePresence mode="wait">
            {decision ? (
              <motion.div
                key={activeScenario}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-3"
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
                    value={
                      <StatusBadge tone={decision.policy === "Passed" ? "success" : "danger"}>
                        {decision.policy}
                      </StatusBadge>
                    }
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
              <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted-foreground">
                <Sparkles className="mb-2 size-5 text-violet-400" aria-hidden="true" />
                Run a scenario to see the agent&apos;s decision.
              </div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Event timeline */}
      <GlassCard className="p-5" aria-label="Live event timeline">
        <div className="mb-3 text-sm font-semibold">Live Event Timeline</div>
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 py-6 text-center text-xs text-muted-foreground">
            No events yet — trigger a scenario above.
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Event timeline">
            {events.map((e, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
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
    </div>
  );
}

function DecisionField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
