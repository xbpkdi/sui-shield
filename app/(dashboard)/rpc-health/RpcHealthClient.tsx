"use client";

import { Activity } from "lucide-react";
import { GlassCard, MotionGlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { formatRelativeTime } from "@/lib/utils";
import type { RpcStatus } from "@/types";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const latencyHistory = [
  { t: "5m", v: 390 }, { t: "4m", v: 375 }, { t: "3m", v: 388 },
  { t: "2m", v: 370 }, { t: "1m", v: 382 }, { t: "now", v: 380 },
];

function statusTone(s: RpcStatus): "success" | "warning" | "danger" | "muted" {
  switch (s) {
    case "healthy": return "success";
    case "degraded": return "warning";
    case "down": return "danger";
    case "standby": return "muted";
  }
}

export function RpcHealthClient() {
  const rpcEndpoints = useSuiShieldStore((s) => s.rpcEndpoints);
  const activeRpcId = useSuiShieldStore((s) => s.activeRpcId);

  const activeRpc = rpcEndpoints.find((r) => r.id === activeRpcId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-blue-300">Infrastructure</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">RPC Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Endpoint status is simulated. Real checks run server-side via /api/rpc-health.
          </p>
        </div>
        <StatusBadge tone="warning">Simulated Health Data</StatusBadge>
      </header>

      {/* Endpoint grid */}
      <section aria-label="RPC endpoints">
        <div className="grid gap-4 md:grid-cols-3">
          {rpcEndpoints.map((rpc, i) => (
            <MotionGlassCard
              key={rpc.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`p-5 ${rpc.id === activeRpcId ? "ring-1 ring-blue-400/30" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{rpc.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground capitalize">{rpc.role}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge tone={statusTone(rpc.status)}>{rpc.status}</StatusBadge>
                  {rpc.id === activeRpcId && (
                    <StatusBadge tone="info">Active</StatusBadge>
                  )}
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Latency</dt>
                  <dd className="font-mono">{rpc.latencyMs}ms</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Success rate</dt>
                  <dd className="font-mono">{rpc.successRate}%</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Checkpoint</dt>
                  <dd className="font-mono text-xs">{rpc.latestCheckpoint.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Last checked</dt>
                  <dd className="text-xs">{formatRelativeTime(rpc.lastCheckedAt)}</dd>
                </div>
              </dl>

              {/* Latency bar */}
              <div className="mt-3">
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-white/5"
                  role="progressbar"
                  aria-valuenow={rpc.latencyMs}
                  aria-valuemin={0}
                  aria-valuemax={2000}
                  aria-label={`Latency ${rpc.latencyMs}ms`}
                >
                  <div
                    className={`h-full rounded-full ${rpc.latencyMs < 500 ? "bg-emerald-500" : rpc.latencyMs < 1000 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(100, (rpc.latencyMs / 2000) * 100)}%` }}
                  />
                </div>
              </div>
            </MotionGlassCard>
          ))}
        </div>
      </section>

      {/* Latency chart for active RPC */}
      {activeRpc && (
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Active RPC Latency
              </div>
              <div className="mt-1 text-sm font-medium">{activeRpc.name}</div>
            </div>
            <StatusBadge tone="warning">Simulated</StatusBadge>
          </div>
          <div className="h-36" aria-label="RPC latency over time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyHistory}>
                <XAxis
                  dataKey="t"
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
                  formatter={(v: number) => [`${v}ms`, "Latency"]}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#4da2ff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Agent recommendation */}
      <GlassCard className="p-5">
        <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
          Agent Recommendation
        </div>
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 size-4 shrink-0 text-blue-300" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {activeRpc && activeRpc.latencyMs < 500
              ? `Primary RPC (${activeRpc.name}) is healthy at ${activeRpc.latencyMs}ms. No failover required.`
              : `Primary RPC latency is elevated. Consider switching to the backup endpoint.`}
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Real RPC health checks run server-side
          at{" "}
          <code className="font-mono text-blue-300">/api/rpc-health</code> to protect private
          endpoint credentials. Run the demo to see failover in action.
        </div>
      </GlassCard>
    </div>
  );
}
