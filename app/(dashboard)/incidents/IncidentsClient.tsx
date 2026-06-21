"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  cardGridTwoColClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { formatRelativeTime } from "@/lib/utils";
import type { Incident } from "@/types";

function IncidentDetail({ incident }: { incident: Incident }) {
  return (
    <div className={cardGridTwoColClass}>
      <div>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Summary</div>
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

      <div>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Timeline</div>
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
              <span className="shrink-0 font-mono text-xs text-emerald-400 mt-0.5">Resolved</span>
              <span className="text-emerald-400">{formatRelativeTime(incident.resolvedAt)}</span>
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}

function IncidentMobileCard({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">{incident.id}</p>
            <p className="mt-0.5 text-sm font-medium">{incident.title}</p>
          </div>
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={incident.status === "active" ? "danger" : "success"}>
            {incident.status}
          </StatusBadge>
          <StatusBadge tone="muted">{incident.type}</StatusBadge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(incident.startedAt)}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 bg-black/15 p-4"
          >
            <IncidentDetail incident={incident} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-white/5 first:border-0">
      <button
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-400"
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
              <IncidentDetail incident={incident} />
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
    <DashboardPage>
      <PageHeader
        eyebrow="Incidents"
        title="Incident Log"
        description="Populated from Demo Lab events. Run scenarios to generate incidents."
      />

      <PageSection delay={0.06}>
        <div className="mb-3 flex flex-wrap gap-2">
          <StatusBadge tone="muted">{incidents.length} total</StatusBadge>
          {active.length > 0 && <StatusBadge tone="danger">{active.length} active</StatusBadge>}
          <StatusBadge tone="success">{resolved.length} resolved</StatusBadge>
        </div>
        {incidents.length === 0 ? (
          <GlassCard hover className="p-8 text-center">
            <AlertTriangle
              className="mx-auto mb-3 size-10 text-muted-foreground/30"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No incidents recorded. Run the &quot;Network Instability&quot; or &quot;RPC Failure&quot;
              scenario in Demo Lab.
            </p>
          </GlassCard>
        ) : (
          <GlassCard hover className="overflow-hidden">
            <div className="md:hidden">
              {incidents.map((incident) => (
                <IncidentMobileCard key={incident.id} incident={incident} />
              ))}
            </div>
            <div className="hidden md:block">
              {incidents.map((incident) => (
                <IncidentRow key={incident.id} incident={incident} />
              ))}
            </div>
          </GlassCard>
        )}
      </PageSection>
    </DashboardPage>
  );
}