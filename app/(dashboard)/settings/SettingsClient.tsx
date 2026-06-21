"use client";

import { AlertTriangle, Info, KeyRound, Network, Bell } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  cardBodyClass,
  listCompactClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APP_VERSION } from "@/lib/constants";
import { getDeploymentStatus } from "@/lib/deployment";
import { getActiveNetwork, getDefaultRpcUrl, getNetworkLabel } from "@/lib/sui/network";

export function SettingsClient() {
  const networkLabel = getNetworkLabel(getActiveNetwork());
  const primaryRpc = getDefaultRpcUrl();
  const deployment = getDeploymentStatus();
  const contractConfigured = deployment.contractConfigured;
  const liveMintReady = deployment.liveMintReady;

  return (
    <DashboardPage maxWidth="3xl">
      <PageHeader
        eyebrow="Settings"
        title="Configuration"
        description="Runtime config is driven by server environment variables. This page shows status — not editable fields."
      />

      <PageSection>
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
          <div className="text-sm text-amber-300/90">
            <strong>Security:</strong> Sponsor private keys live only in server env (
            <code className="font-mono text-amber-300">SUI_SPONSOR_PRIVATE_KEY</code>). Never commit{" "}
            <code className="font-mono text-amber-300">.env.local</code>. See{" "}
            <code className="font-mono text-amber-300">.env.example</code> and{" "}
            <code className="font-mono text-amber-300">SUBMISSION.md</code>.
          </div>
        </div>
      </PageSection>

      <PageSection delay={0.05}>
        <GlassCard hover className={cardBodyClass}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <KeyRound className="size-4 text-blue-300" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Sponsor Service</h2>
            {liveMintReady ? (
              <StatusBadge tone="success">Live — two-phase API</StatusBadge>
            ) : contractConfigured ? (
              <StatusBadge tone="warning">Contract set — enable live mint</StatusBadge>
            ) : (
              <StatusBadge tone="warning">Contract env not set</StatusBadge>
            )}
            <StatusBadge tone="muted">Read-only</StatusBadge>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sponsor-endpoint">Sponsor API endpoints</Label>
              <Input
                id="sponsor-endpoint"
                type="text"
                defaultValue="/api/sponsor/prepare · /api/sponsor/execute"
                disabled
                aria-describedby="sponsor-endpoint-hint"
              />
              <p id="sponsor-endpoint-hint" className="text-xs text-muted-foreground">
                Server builds and dry-runs txs, stores intents, verifies user signatures, then
                sponsor-signs. Protected by same-origin check and rate limiting in production.
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-muted-foreground">
              Configure <code className="font-mono text-blue-300">SUI_SPONSOR_PRIVATE_KEY</code> in{" "}
              <code className="font-mono">.env.local</code> or your deployment secrets manager.
            </div>
          </div>
        </GlassCard>
      </PageSection>

      <PageSection delay={0.1}>
        <GlassCard hover className={cardBodyClass}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Network className="size-4 text-blue-300" aria-hidden="true" />
            <h2 className="text-sm font-semibold">RPC Configuration</h2>
            <StatusBadge tone="info">{networkLabel}</StatusBadge>
            <StatusBadge tone="muted">Env-driven · Read-only</StatusBadge>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="primary-rpc">Primary RPC URL</Label>
              <Input id="primary-rpc" type="url" defaultValue={primaryRpc} disabled aria-describedby="primary-rpc-hint" />
              <p id="primary-rpc-hint" className="text-xs text-muted-foreground">
                Set via <code className="font-mono text-blue-300">NEXT_PUBLIC_SUI_RPC_URL</code> env var.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backup-rpc-1">Backup RPC 1</Label>
              <Input
                id="backup-rpc-1"
                type="url"
                placeholder="Configure in SUI_RPC_BACKUP_1 env var"
                disabled
                aria-describedby="backup-rpc-hint"
              />
              <p id="backup-rpc-hint" className="text-xs text-muted-foreground">
                Set via <code className="font-mono text-blue-300">SUI_RPC_BACKUP_1</code> env var.
              </p>
            </div>
          </div>
        </GlassCard>
      </PageSection>

      <PageSection delay={0.15}>
        <GlassCard hover className={cardBodyClass}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Bell className="size-4 text-blue-300" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Notifications</h2>
            <StatusBadge tone="warning">Roadmap</StatusBadge>
          </div>
          <div className={listCompactClass}>
            {[
              { id: "notify-incident", label: "Alert on new incidents" },
              { id: "notify-protective", label: "Alert when entering Protective Mode" },
              { id: "notify-budget-80", label: "Alert at 80% daily budget" },
              { id: "notify-rpc", label: "Alert on RPC failover" },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-black/15 p-3"
              >
                <Label htmlFor={item.id} className="font-normal">
                  {item.label}
                </Label>
                <Switch id={item.id} disabled aria-label={`Toggle: ${item.label}`} />
              </div>
            ))}
          </div>
        </GlassCard>
      </PageSection>

      <PageSection delay={0.2}>
        <GlassCard hover className={cardBodyClass}>
          <div className="mb-2.5 flex items-center gap-2">
            <Info className="size-4 text-blue-300" aria-hidden="true" />
            <h2 className="text-sm font-semibold">About</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-mono">{APP_VERSION}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Network</dt>
              <dd>Sui {networkLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Hackathon</dt>
              <dd>Sui Overflow 2026</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Architecture</dt>
              <dd className="text-right">Next.js · Zustand · Move · zkLogin</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Integration</dt>
              <dd>
                <StatusBadge tone={liveMintReady ? "success" : "warning"}>
                  {liveMintReady ? `Live on ${networkLabel}` : "Simulation only"}
                </StatusBadge>
              </dd>
            </div>
          </dl>
        </GlassCard>
      </PageSection>
    </DashboardPage>
  );
}