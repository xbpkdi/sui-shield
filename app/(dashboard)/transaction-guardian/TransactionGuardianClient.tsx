"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  cardGridTwoColClass,
  listCompactClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { formatAddress, formatRelativeTime } from "@/lib/utils";
import { explorerTxUrl, isRealDigest } from "@/lib/sui/explorer";
import { getActiveNetwork } from "@/lib/sui/network";
import type { AgentEvent, TransactionIntent } from "@/types";

function statusTone(s: TransactionIntent["status"]): "success" | "warning" | "danger" | "info" | "muted" {
  switch (s) {
    case "confirmed": return "success";
    case "rejected": return "danger";
    case "failed": return "danger";
    case "queued": return "warning";
    case "pending": return "muted";
    default: return "info";
  }
}

function riskTone(r: TransactionIntent["risk"]): "success" | "warning" | "danger" {
  switch (r) {
    case "low": return "success";
    case "medium": return "warning";
    case "high": return "danger";
  }
}

function TxExpandDetail({
  tx,
  relatedLogs,
  rpc,
}: {
  tx: TransactionIntent;
  relatedLogs: AgentEvent[];
  rpc: { name: string } | null | undefined;
}) {
  return (
    <div className={cardGridTwoColClass}>
      <div className={listCompactClass}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Agent Decision</div>
        <dl className="space-y-2 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <dt className="shrink-0 text-muted-foreground sm:w-28">Decision</dt>
            <dd>
              {tx.decision ? (
                <StatusBadge
                  tone={
                    tx.decision === "approve"
                      ? "success"
                      : tx.decision === "reject"
                        ? "danger"
                        : "warning"
                  }
                >
                  {tx.decision}
                </StatusBadge>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <dt className="shrink-0 text-muted-foreground sm:w-28">Reason code</dt>
            <dd className="font-mono text-xs break-all">{tx.reasonCode || "—"}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <dt className="shrink-0 text-muted-foreground sm:w-28">Reason</dt>
            <dd className="text-muted-foreground">{tx.reasonText || "—"}</dd>
          </div>
          {rpc && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
              <dt className="shrink-0 text-muted-foreground sm:w-28">RPC used</dt>
              <dd>{rpc.name}</dd>
            </div>
          )}
          {tx.digest && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
              <dt className="shrink-0 text-muted-foreground sm:w-28">Digest</dt>
              <dd className="font-mono text-xs break-all">
                {isRealDigest(tx.digest) ? (
                  <a
                    href={explorerTxUrl(tx.digest, getActiveNetwork())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-300 hover:text-blue-200"
                  >
                    {tx.digest}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">{tx.digest}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>
      <div>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Agent Trace</div>
        {relatedLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trace available.</p>
        ) : (
          <div className="space-y-1.5">
            {relatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex gap-2 rounded border border-white/5 bg-black/20 px-2.5 py-1.5 text-xs"
              >
                <span className="w-14 shrink-0 font-mono font-semibold text-blue-300">{log.phase}</span>
                <span className="text-muted-foreground">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TxMobileCard({ tx }: { tx: TransactionIntent }) {
  const [open, setOpen] = useState(false);
  const agentLogs = useSuiShieldStore((s) => s.agentLogs);
  const rpcEndpoints = useSuiShieldStore((s) => s.rpcEndpoints);
  const relatedLogs = agentLogs.filter((l) => l.transactionIntentId === tx.id);
  const rpc = tx.rpcId ? rpcEndpoints.find((r) => r.id === tx.rpcId) : null;

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
            <p className="font-mono text-xs text-muted-foreground">{formatAddress(tx.wallet)}</p>
            <p className="mt-0.5 text-sm font-medium">{tx.action}</p>
          </div>
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statusTone(tx.status)}>{tx.status}</StatusBadge>
          <StatusBadge tone={riskTone(tx.risk)}>{tx.risk}</StatusBadge>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(tx.createdAt)}</span>
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
            <TxExpandDetail tx={tx} relatedLogs={relatedLogs} rpc={rpc} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TxRow({ tx }: { tx: TransactionIntent }) {
  const [open, setOpen] = useState(false);
  const agentLogs = useSuiShieldStore((s) => s.agentLogs);
  const rpcEndpoints = useSuiShieldStore((s) => s.rpcEndpoints);

  const relatedLogs = agentLogs.filter((l) => l.transactionIntentId === tx.id);
  const rpc = tx.rpcId ? rpcEndpoints.find((r) => r.id === tx.rpcId) : null;

  return (
    <>
      <tr
        className="border-t border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        <td className="py-3 pl-4">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </td>
        <td className="py-3 px-2">
          <span className="font-mono text-xs">{formatAddress(tx.wallet)}</span>
        </td>
        <td className="py-3 px-2 text-sm">{tx.action}</td>
        <td className="py-3 px-2">
          <StatusBadge tone={statusTone(tx.status)}>{tx.status}</StatusBadge>
        </td>
        <td className="py-3 px-2">
          <StatusBadge tone={riskTone(tx.risk)}>{tx.risk}</StatusBadge>
        </td>
        <td className="py-3 px-2 font-mono text-xs text-muted-foreground">
          {tx.gasEstimate.toFixed(4)}
        </td>
        <td className="py-3 px-2 text-xs text-muted-foreground">
          {formatRelativeTime(tx.createdAt)}
        </td>
        <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
          {tx.digest && isRealDigest(tx.digest) ? (
            <a
              href={explorerTxUrl(tx.digest, getActiveNetwork())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-blue-300 hover:text-blue-200 data-cursor-hover"
            >
              {tx.digest.slice(0, 10)}…
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : tx.digest ? (
            <span className="font-mono text-xs text-muted-foreground">{tx.digest}</span>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          )}
        </td>
      </tr>
      <AnimatePresence>
        {open && (
          <tr>
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-white/5 bg-black/15 p-3.5">
                  <TxExpandDetail tx={tx} relatedLogs={relatedLogs} rpc={rpc} />
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export function TransactionGuardianClient() {
  const transactions = useSuiShieldStore((s) => s.transactions);
  const confirmed = transactions.filter((t) => t.status === "confirmed").length;
  const rejected = transactions.filter((t) => t.status === "rejected").length;
  const queued = transactions.filter((t) => t.status === "queued").length;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Guardian"
        title="Transaction Guardian"
        description="All transactions from the shared state. Click a row to see the full agent trace."
      />

      <PageSection delay={0.06}>
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone="muted">{transactions.length} total</StatusBadge>
        <StatusBadge tone="success">{confirmed} confirmed</StatusBadge>
        <StatusBadge tone="danger">{rejected} rejected</StatusBadge>
        {queued > 0 && <StatusBadge tone="warning">{queued} queued</StatusBadge>}
      </div>
      {transactions.length === 0 ? (
        <GlassCard hover className="p-8 text-center">
          <Shield className="mx-auto mb-3 size-10 text-muted-foreground/30" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No transactions yet. Run a scenario in Demo Lab.
          </p>
        </GlassCard>
      ) : (
        <GlassCard hover className="overflow-hidden">
          <div className="md:hidden">
            {[...transactions].reverse().map((tx) => (
              <TxMobileCard key={tx.id} tx={tx} />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm" aria-label="Transaction list">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="w-8 py-3 pl-4" aria-label="Expand row" />
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Wallet
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Risk
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Gas (SUI)
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Time
                  </th>
                  <th className="py-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Digest
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...transactions].reverse().map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
      </PageSection>
    </DashboardPage>
  );
}
