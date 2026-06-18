"use client";

import { AlertTriangle, Info, KeyRound, Network, Bell } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SettingsClient() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-blue-300">Settings</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Application settings. Fields marked &quot;UI only&quot; are not connected to a backend in
          this version.
        </p>
      </header>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
        <div className="text-sm text-amber-300/90">
          <strong>Security:</strong> Sponsor private keys are never stored here. All signing is a
          server-side operation. See{" "}
          <code className="font-mono text-amber-300">.env.example</code> for environment variable
          placeholders.
        </div>
      </div>

      {/* Sponsor service */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="size-4 text-blue-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Sponsor Service</h2>
          <StatusBadge tone="warning">UI only — backend not connected</StatusBadge>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-endpoint">Sponsor API endpoint</Label>
            <Input
              id="sponsor-endpoint"
              type="url"
              placeholder="https://your-sponsor-service/api/sponsor"
              disabled
              aria-describedby="sponsor-endpoint-hint"
            />
            <p id="sponsor-endpoint-hint" className="text-xs text-muted-foreground">
              TODO: Implement server-side sponsor signing via a secure key management service.
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-muted-foreground">
            <code className="font-mono text-blue-300">SPONSOR_PRIVATE_KEY</code> must be stored in
            a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) — never in environment
            variables accessible to the browser.
          </div>
        </div>
      </GlassCard>

      {/* RPC configuration */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Network className="size-4 text-blue-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold">RPC Configuration</h2>
          <StatusBadge tone="warning">UI only</StatusBadge>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="primary-rpc">Primary RPC URL</Label>
            <Input
              id="primary-rpc"
              type="url"
              defaultValue="https://fullnode.testnet.sui.io:443"
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="backup-rpc-1">Backup RPC 1</Label>
            <Input
              id="backup-rpc-1"
              type="url"
              placeholder="Configure in SUI_RPC_BACKUP_1 env var"
              disabled
            />
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="size-4 text-blue-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Notifications</h2>
          <StatusBadge tone="warning">UI only</StatusBadge>
        </div>
        <div className="space-y-3">
          {[
            { id: "notify-incident", label: "Alert on new incidents" },
            { id: "notify-protective", label: "Alert when entering Protective Mode" },
            { id: "notify-budget-80", label: "Alert at 80% daily budget" },
            { id: "notify-rpc", label: "Alert on RPC failover" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/15 p-3">
              <Label htmlFor={item.id} className="font-normal">{item.label}</Label>
              <Switch id={item.id} disabled aria-label={`Toggle: ${item.label}`} />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* App info */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Info className="size-4 text-blue-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold">About</h2>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono">0.1.0</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Network</dt>
            <dd>Sui Testnet</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Architecture</dt>
            <dd>Next.js App Router · Zustand · Framer Motion</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Integration status</dt>
            <dd>
              <StatusBadge tone="warning">Simulated — Testnet integration pending</StatusBadge>
            </dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  );
}
