"use client";

import { motion } from "framer-motion";
import { Plus, X, Info } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-blue-300">Policy</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Gasless Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Policy controls are live — changes immediately affect Demo Lab behavior.
          </p>
        </div>
        <StatusBadge tone="info">
          <Info className="size-3" aria-hidden="true" />
          Changes apply instantly
        </StatusBadge>
      </header>

      {/* Allowed actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <GlassCard className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Allowed Actions</h2>
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm disabled:opacity-40 hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Gas + budget */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Gas &amp; Budget Limits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
      </motion.div>

      {/* Protection toggles */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Protection Settings</h2>
          <div className="space-y-4">
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
      </motion.div>
    </div>
  );
}
