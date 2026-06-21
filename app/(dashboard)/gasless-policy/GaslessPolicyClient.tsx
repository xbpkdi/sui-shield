"use client";

import { Plus, X, Info } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  cardGridClass,
  cardBodyClass,
  listCompactClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSuiShieldStore } from "@/stores/suishield";
import { useState } from "react";

export function GaslessPolicyClient() {
  const policy = useSuiShieldStore((s) => s.policy);
  const updatePolicy = useSuiShieldStore((s) => s.updatePolicy);
  const [newAction, setNewAction] = useState("");

  function addAction() {
    const trimmed = newAction.trim();
    if (trimmed && !policy.allowedActions.includes(trimmed)) {
      updatePolicy({ allowedActions: [...policy.allowedActions, trimmed] });
      setNewAction("");
    }
  }

  function removeAction(action: string) {
    updatePolicy({ allowedActions: policy.allowedActions.filter((a) => a !== action) });
  }

  return (
    <DashboardPage maxWidth="4xl">
      <PageHeader
        eyebrow="Policy"
        title="Gasless Policy"
        description="Policy controls are live — changes immediately affect Demo Lab behavior."
        badges={
          <StatusBadge tone="info">
            <Info className="size-3" aria-hidden="true" />
            Changes apply instantly
          </StatusBadge>
        }
      />

      <PageSection>
        <GlassCard hover className={cardBodyClass}>
          <h2 className="mb-3 text-sm font-semibold">Allowed Actions</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {policy.allowedActions.map((action) => (
              <span
                key={action}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/20 bg-blue-400/8 px-2.5 py-1 text-xs text-blue-300"
              >
                {action}
                <button
                  onClick={() => removeAction(action)}
                  aria-label={`Remove ${action}`}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAction()}
              placeholder="e.g. stake_token"
              className="max-w-xs"
              aria-label="New allowed action"
            />
            <button
              onClick={addAction}
              disabled={!newAction.trim()}
              className="btn-magnetic inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40 data-cursor-hover"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          </div>
        </GlassCard>
      </PageSection>

      <PageSection delay={0.05}>
        <GlassCard hover className={cardBodyClass}>
          <h2 className="mb-3 text-sm font-semibold">Gas &amp; Budget Limits</h2>
          <div className={`${cardGridClass} sm:grid-cols-2`}>
            <div className="space-y-1.5">
              <Label htmlFor="max-gas">Max gas per transaction (SUI)</Label>
              <Input
                id="max-gas"
                type="number"
                step="0.001"
                min="0"
                value={policy.maxGasPerTx}
                onChange={(e) => updatePolicy({ maxGasPerTx: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Transactions exceeding this require manual approval.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily-budget">Daily budget (SUI)</Label>
              <Input
                id="daily-budget"
                type="number"
                step="0.5"
                min="0"
                value={policy.dailyBudget}
                onChange={(e) => updatePolicy({ dailyBudget: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wallet-quota">Max transactions per wallet per hour</Label>
              <Input
                id="wallet-quota"
                type="number"
                step="1"
                min="1"
                value={policy.maxTransactionsPerWalletPerHour}
                onChange={(e) =>
                  updatePolicy({ maxTransactionsPerWalletPerHour: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-threshold">Manual approval threshold (SUI)</Label>
              <Input
                id="manual-threshold"
                type="number"
                step="0.01"
                min="0"
                value={policy.manualApprovalThreshold}
                onChange={(e) =>
                  updatePolicy({ manualApprovalThreshold: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </GlassCard>
      </PageSection>

      <PageSection delay={0.1}>
        <GlassCard hover className={cardBodyClass}>
          <h2 className="mb-3 text-sm font-semibold">Protection Settings</h2>
          <div className={listCompactClass}>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/15 p-3">
              <div>
                <Label htmlFor="dup-protection" className="font-medium">Duplicate protection</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Block identical intents within the window. Current window:{" "}
                  <span className="font-mono">{policy.duplicateWindowSeconds}s</span>
                </p>
              </div>
              <Switch
                id="dup-protection"
                checked={policy.duplicateProtection}
                onCheckedChange={(v) => updatePolicy({ duplicateProtection: v })}
                aria-label="Toggle duplicate protection"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/15 p-3">
              <div>
                <Label htmlFor="sim-required" className="font-medium">Require simulation</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deny sponsorship if the dry run fails. Prevents Move abort waste.
                </p>
              </div>
              <Switch
                id="sim-required"
                checked={policy.simulationRequired}
                onCheckedChange={(v) => updatePolicy({ simulationRequired: v })}
                aria-label="Toggle simulation requirement"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/15 p-3">
              <div>
                <Label htmlFor="pause-instability" className="font-medium">Pause on instability (Protective Mode)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically enter Protective Mode when network checkpoints go stale.
                </p>
              </div>
              <Switch
                id="pause-instability"
                checked={policy.pauseOnInstability}
                onCheckedChange={(v) => updatePolicy({ pauseOnInstability: v })}
                aria-label="Toggle Protective Mode on instability"
              />
            </div>
          </div>
        </GlassCard>
      </PageSection>
    </DashboardPage>
  );
}
