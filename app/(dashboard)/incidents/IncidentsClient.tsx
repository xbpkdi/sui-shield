"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { formatRelativeTime } from "@/lib/utils";
import type { Incident } from "@/types";

function IncidentRow({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-white/5 first:border-0">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-400"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {incident.id}
          </span>
          <span className="font-medium">{incident.title}</span>
          <StatusBadge tone={incident.status === "active" ? "danger" : "success"}>
            {incident.status}
          </StatusBadge>
          <StatusBadge tone="muted">{incident.type}</StatusBadge>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(incident.startedAt)}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-black/15 px-4 pb-4 pt-0">
              <div className="grid gap-5 md:grid-cols-2">
                {/* Summary + actions */}
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Summary
                  </div>
                  <p className="text-sm text-muted-foreground">{incident.summary || "No summary available."}</p>

                  <div className="mt-4 mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Actions Taken
                  </div>
                  <ul className="space-y-1" role="list">
                    {incident.actions.map((action, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500/60" aria-hidden="true" />
                        {action}
                      </li>
                    ))}
                  </ul>

                  {incident.affectedTransactions.length > 0 && (
                    <>
                      <div className="mt-4 mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                        Affected Transactions
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {incident.affectedTransactions.map((txId) => (
                          <StatusBadge key={txId} tone="muted">
                            {txId}
                          </StatusBadge>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Timeline
                  </div>
                  <ol className="space-y-2" aria-label="Incident timeline">
                    {incident.timeline.map((event, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="shrink-0 font-mono text-xs text-muted-foreground mt-0.5">
                          {event.time}
                        </span>
                        <span className="text-muted-foreground">{event.text}</span>
                      </li>
                    ))}
                    {incident.resolvedAt && (
                      <li className="flex gap-3 text-sm">
                        <span className="shrink-0 font-mono text-xs text-emerald-400 mt-0.5">
                          Resolved
                        </span>
                        <span className="text-emerald-400">
                          {formatRelativeTime(incident.resolvedAt)}
                        </span>
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IncidentsClient() {
  const incidents = useSuiShieldStore((s) => s.incidents);
  const active = incidents.filter((i) => i.status === "active");
  const resolved = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-blue-300">Incidents</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Incident Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Populated from Demo Lab events. Run scenarios to generate incidents.
        </p>
      </header>

      <div className="flex gap-3">
        <StatusBadge tone="muted">{incidents.length} total</StatusBadge>
        {active.length > 0 && <StatusBadge tone="danger">{active.length} active</StatusBadge>}
        <StatusBadge tone="success">{resolved.length} resolved</StatusBadge>
      </div>

      {incidents.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="mx-auto mb-3 size-10 text-muted-foreground/30" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No incidents recorded. Run the &quot;Network Instability&quot; or &quot;RPC Failure&quot; scenario in Demo Lab.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))}
        </GlassCard>
      )}
    </div>
  );
}
