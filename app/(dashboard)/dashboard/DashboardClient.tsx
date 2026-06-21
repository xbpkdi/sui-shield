"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  cardGridBentoClass,
  cardGridTwoColClass,
  cardGridClass,
  cardBodyClass,
  cardBodyCompactClass,
  listCompactClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";
import { CountUp } from "@/components/dashboard/CountUp";
import { useShallow } from "zustand/react/shallow";
import { useSuiShieldStore, selectActiveRpc } from "@/stores/suishield";
import { getModeTone, getModeLabel } from "@/components/layout/AppMode";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

// Static chart data (illustrative)
const gasSeries = [
  { h: "00", v: 0.12 }, { h: "02", v: 0.09 }, { h: "04", v: 0.05 },
  { h: "06", v: 0.14 }, { h: "08", v: 0.31 }, { h: "10", v: 0.28 },
  { h: "12", v: 0.42 }, { h: "14", v: 0.38 }, { h: "15", v: 0.21 },
];

export function DashboardClient() {
  const currentMode = useSuiShieldStore((s) => s.currentMode);
  const project = useSuiShieldStore((s) => s.project);
  const sponsorBudget = useSuiShieldStore((s) => s.sponsorBudget);
  const gasUsed = useSuiShieldStore((s) => s.gasUsed);
  const txSuccessRate = useSuiShieldStore((s) => s.txSuccessRate);
  const agentLogs = useSuiShieldStore((s) => s.agentLogs);
  const blockedDuplicates = useSuiShieldStore((s) => s.blockedDuplicates);
  const transactions = useSuiShieldStore((s) => s.transactions);
  const activeRpc = useSuiShieldStore(selectActiveRpc);
  const activeIncidents = useSuiShieldStore(
    useShallow((s) => s.incidents.filter((i) => i.status === "active"))
  );

  const sponsoredCount = transactions.filter((t) => t.status === "confirmed").length;
  const sponsorPct = Math.min(100, (gasUsed / sponsorBudget) * 100);
  const modeTone = getModeTone(currentMode);
  const modeLabel = getModeLabel(currentMode);
  const networkLabel = getNetworkLabel(getActiveNetwork());

  const kpis = [
    {
      label: "Network Health",
      value: modeLabel,
      hint: `Checkpoint freshness normal`,
      tone: modeTone,
      icon: Activity,
      accent: "emerald" as const,
    },
    {
      label: "Gasless Sponsorship",
      value: currentMode === "protective" ? "Paused" : "Active",
      hint: `${sponsoredCount} txs sponsored`,
      tone: currentMode === "protective" ? ("warning" as const) : ("info" as const),
      icon: ShieldCheck,
      accent: "blue" as const,
    },
    {
      label: "Sponsor Budget",
      value: `${gasUsed.toFixed(3)} / ${sponsorBudget} SUI`,
      hint: `${sponsorPct.toFixed(1)}% used`,
      tone: "violet" as const,
      icon: Wallet,
      progress: sponsorPct,
      accent: "violet" as const,
    },
    {
      label: "Tx Success Rate",
      value: txSuccessRate,
      hint: "Derived from all transactions",
      tone: "success" as const,
      icon: CheckCircle2,
      count: txSuccessRate,
      suffix: "%",
      decimals: 1,
      accent: "emerald" as const,
    },
    {
      label: "Agent Actions",
      value: agentLogs.length,
      hint: "Total agent events",
      tone: "info" as const,
      icon: Zap,
      count: agentLogs.length,
      accent: "amber" as const,
    },
    {
      label: "Blocked Duplicates",
      value: blockedDuplicates,
      hint: "Duplicate intents stopped",
      tone: "danger" as const,
      icon: ShieldAlert,
      count: blockedDuplicates,
      accent: "ember" as const,
    },
  ] as const;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Overview"
        title={project.name}
        description="Real-time agent metrics, sponsorship budget, and system health at a glance."
        badges={
          <>
            <StatusBadge tone="info">{networkLabel}</StatusBadge>
            <StatusBadge tone={modeTone} pulse={currentMode !== "healthy"}>
              {modeLabel}
            </StatusBadge>
          </>
        }
      />

      <PageSection aria-label="Key metrics">
        <div className={cardGridBentoClass}>
          {kpis.map((k) => (
            <GlassCard key={k.label} hover accent={k.accent} className={cardBodyCompactClass}>
              <div className="flex items-start justify-between">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </div>
                <span className="grid size-8 place-items-center rounded-lg border border-white/5 bg-white/[0.03]">
                  <k.icon className="size-4 text-blue-300" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold tracking-tight">
                  {"count" in k && typeof k.count === "number" ? (
                    <CountUp value={k.count} decimals={"decimals" in k ? k.decimals : 0} suffix={"suffix" in k ? k.suffix : ""} />
                  ) : (
                    <StatusBadge tone={k.tone}>{String(k.value)}</StatusBadge>
                  )}
                </span>
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">{k.hint}</div>
              {"progress" in k && typeof k.progress === "number" && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuenow={k.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${k.label} progress`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${k.progress}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-500"
                  />
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </PageSection>

      <PageSection delay={0.05}>
        <div className={`${cardGridClass} lg:grid-cols-3`}>
        <GlassCard hover accent="blue" className={cardBodyClass}>
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Live System Mode
            </div>
            <StatusBadge tone={modeTone} pulse>
              {modeLabel}
            </StatusBadge>
          </div>
          <div className="relative mt-4 grid place-items-center">
            <div
              className={`relative grid size-24 place-items-center rounded-full border sm:size-32 ${
                currentMode === "healthy"
                  ? "border-emerald-500/40"
                  : currentMode === "protective"
                    ? "border-red-500/40"
                    : "border-amber-500/40"
              }`}
            >
              <div
                className={`absolute inset-3 rounded-full animate-pulse-ring ${
                  currentMode === "healthy"
                    ? "bg-emerald-500/12"
                    : currentMode === "protective"
                      ? "bg-red-500/12"
                      : "bg-amber-500/12"
                }`}
                aria-hidden="true"
              />
              <div className="relative text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Agent
                </div>
                <div className="font-mono text-sm font-semibold">{modeLabel}</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {currentMode === "healthy"
              ? "All systems nominal. Sponsorship active."
              : currentMode === "protective"
                ? "Network instability detected. Write actions paused; intents queued."
                : "Endpoint quality degraded. Routing through backup RPC."}
          </p>
        </GlassCard>

        <GlassCard hover accent="violet" className={`${cardBodyClass} lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Sponsored Gas Usage
              </div>
              <div className="mt-1 text-sm">
                Today ·{" "}
                <span className="font-mono text-foreground">{gasUsed.toFixed(4)} SUI</span>
              </div>
            </div>
            <StatusBadge tone="info">Hourly</StatusBadge>
          </div>
          <div className="mt-4 h-36 sm:h-44" aria-label="Gas usage chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gasSeries}>
                <defs>
                  <linearGradient id="gasGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4da2ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4da2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="h"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d1424",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "#94a3b8" }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  name="SUI"
                  stroke="#4da2ff"
                  strokeWidth={2}
                  fill="url(#gasGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        </div>
      </PageSection>

      <PageSection delay={0.1}>
        <div className={cardGridTwoColClass}>
        <GlassCard hover className={cardBodyClass}>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Active RPC Endpoint
            </div>
            {activeRpc && (
              <StatusBadge tone={activeRpc.status === "healthy" ? "success" : "warning"}>
                {activeRpc.status}
              </StatusBadge>
            )}
          </div>
          {activeRpc ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{activeRpc.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono">{activeRpc.latencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Success rate</span>
                <span className="font-mono">{activeRpc.successRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Checkpoint</span>
                <span className="font-mono">{activeRpc.latestCheckpoint.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active RPC</p>
          )}
        </GlassCard>

        <GlassCard hover className={cardBodyClass}>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Active Incidents
            </div>
            {activeIncidents.length > 0 && (
              <StatusBadge tone="danger">{activeIncidents.length} active</StatusBadge>
            )}
          </div>
          {activeIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="mb-2 size-8 text-emerald-500/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No active incidents</p>
            </div>
          ) : (
            <ul className={listCompactClass} role="list">
              {activeIncidents.map((inc) => (
                <li key={inc.id}>
                  <Link
                    href="/incidents"
                    className="block rounded-lg border border-white/5 bg-black/20 p-3 transition-colors hover:border-white/10 hover:bg-black/30 data-cursor-hover"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{inc.title}</p>
                        <p className="text-xs text-muted-foreground">{inc.type}</p>
                      </div>
                      <StatusBadge tone="danger">Active</StatusBadge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
        </div>
      </PageSection>

      <PageSection delay={0.15}>
      <GlassCard hover className={cardBodyClass}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Recent Agent Decisions
          </div>
          <StatusBadge tone="info">{agentLogs.length} total</StatusBadge>
        </div>
        {agentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-8 text-center">
            <Zap className="mb-2 size-8 text-muted-foreground/30" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No agent decisions yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Run a scenario in{" "}
              <Link href="/demo-lab" className="text-blue-400 transition-colors hover:text-blue-300">
                Demo Lab
              </Link>{" "}
              to populate this feed.
            </p>
          </div>
        ) : (
        <div className={listCompactClass}>
          {[...agentLogs]
            .reverse()
            .slice(0, 6)
            .map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/15 px-3 py-2 text-sm"
              >
                <span className="w-16 shrink-0 font-mono text-[11px] font-semibold text-blue-300">
                  {log.phase}
                </span>
                <StatusBadge
                  tone={
                    log.severity === "success"
                      ? "success"
                      : log.severity === "warn"
                        ? "warning"
                        : log.severity === "danger"
                          ? "danger"
                          : "info"
                  }
                >
                  {log.category}
                </StatusBadge>
                <span className="truncate text-foreground/80">{log.message}</span>
              </div>
            ))}
        </div>
        )}
      </GlassCard>
      </PageSection>
    </DashboardPage>
  );
}
