"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Terminal, Filter } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  cardBodyCompactClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { formatTimestamp } from "@/lib/utils";
import type { AgentPhase, Severity } from "@/types";

const phaseColors: Record<AgentPhase, string> = {
  OBSERVE: "text-blue-300",
  REASON: "text-violet-300",
  ACT: "text-amber-300",
  RESULT: "text-emerald-300",
};

function severityTone(s: Severity): "success" | "warning" | "danger" | "info" {
  switch (s) {
    case "success": return "success";
    case "warn": return "warning";
    case "danger": return "danger";
    default: return "info";
  }
}

export function AgentLogsClient() {
  const agentLogs = useSuiShieldStore((s) => s.agentLogs);

  const [phaseFilter, setPhaseFilter] = useState<AgentPhase | "">("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(agentLogs.map((l) => l.category))),
    [agentLogs]
  );

  const filtered = useMemo(
    () =>
      [...agentLogs]
        .reverse()
        .filter(
          (l) =>
            (!phaseFilter || l.phase === phaseFilter) &&
            (!severityFilter || l.severity === severityFilter) &&
            (!categoryFilter || l.category === categoryFilter)
        ),
    [agentLogs, phaseFilter, severityFilter, categoryFilter]
  );

  const phases: AgentPhase[] = ["OBSERVE", "REASON", "ACT", "RESULT"];
  const severities: Severity[] = ["info", "warn", "danger", "success"];

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Logs"
        title="Agent Logs"
        description={`Automatically populated from workflow events. ${agentLogs.length} total events.`}
      />

      <PageSection>
      <div className="space-y-3">
      <GlassCard hover className={cardBodyCompactClass}>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Filter className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Filter:</span>

          {/* Phase */}
          <div className="flex w-full flex-wrap gap-1.5 sm:w-auto" role="group" aria-label="Filter by phase">
            {phases.map((p) => (
              <button
                key={p}
                onClick={() => setPhaseFilter(phaseFilter === p ? "" : p)}
                className={`rounded px-2 py-0.5 font-mono text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  phaseFilter === p
                    ? `${phaseColors[p]} bg-white/[0.08]`
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={phaseFilter === p}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden="true" />

          {/* Severity */}
          <div className="flex w-full flex-wrap gap-1.5 sm:w-auto" role="group" aria-label="Filter by severity">
            {severities.map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(severityFilter === s ? "" : s)}
                className={`rounded px-2 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  severityFilter === s ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={severityFilter === s}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <>
              <div className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden="true" />
              <div className="flex w-full flex-wrap gap-1.5 sm:w-auto" role="group" aria-label="Filter by category">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}
                    className={`rounded px-2 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      categoryFilter === c ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-pressed={categoryFilter === c}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {(phaseFilter || severityFilter || categoryFilter) && (
            <button
              onClick={() => { setPhaseFilter(""); setSeverityFilter(""); setCategoryFilter(""); }}
              className="w-full text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:ml-auto sm:w-auto sm:text-right"
            >
              Clear filters
            </button>
          )}
        </div>
      </GlassCard>
      {filtered.length === 0 ? (
        <GlassCard hover className="p-8 text-center">
          <Terminal className="mx-auto mb-3 size-10 text-muted-foreground/30" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No log entries match the current filter. Run scenarios in Demo Lab to populate logs.
          </p>
        </GlassCard>
      ) : (
        <GlassCard hover className="overflow-hidden">
          <div className="overflow-y-auto max-h-[70vh]" role="log" aria-live="polite" aria-label="Agent log stream">
            <div className="space-y-px">
              {filtered.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.3) }}
                  className="flex flex-col gap-1.5 border-b border-white/[0.04] px-3.5 py-2.5 hover:bg-white/[0.02] sm:flex-row sm:items-start sm:gap-2.5 sm:py-2"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:contents">
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground sm:mt-0.5 sm:w-16">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-[11px] font-bold sm:w-14 ${phaseColors[log.phase]}`}
                    >
                      {log.phase}
                    </span>
                    <StatusBadge
                      tone={severityTone(log.severity)}
                      className="shrink-0 text-[10px]"
                    >
                      {log.category}
                    </StatusBadge>
                  </div>
                  <span className="text-sm leading-relaxed text-foreground/80 sm:flex-1">{log.message}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
      </div>
      </PageSection>
    </DashboardPage>
  );
}
