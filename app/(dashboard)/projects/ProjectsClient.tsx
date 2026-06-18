"use client";

import { motion } from "framer-motion";
import { Plus, Shield, Network, Settings } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { getModeTone, getModeLabel } from "@/components/layout/AppMode";
import { formatRelativeTime } from "@/lib/utils";

export function ProjectsClient() {
  const project = useSuiShieldStore((s) => s.project);
  const policy = useSuiShieldStore((s) => s.policy);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-blue-300">Projects</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Sui dApp Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage sponsorship projects and their configurations.
          </p>
        </div>
        <button
          disabled
          title="Multiple projects coming soon"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground opacity-60 cursor-not-allowed"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New Project
        </button>
      </header>

      {/* Project card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-400/20 to-violet-500/20 border border-white/10">
                <Shield className="size-6 text-blue-300" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge tone="info">{project.network}</StatusBadge>
                  <StatusBadge tone={getModeTone(project.mode)}>
                    {getModeLabel(project.mode)}
                  </StatusBadge>
                </div>
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <Settings className="size-3.5" aria-hidden="true" />
              Configure
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Project ID</dt>
              <dd className="mt-1 font-mono text-sm">{project.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Network</dt>
              <dd className="mt-1 text-sm capitalize">{project.network}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">{formatRelativeTime(project.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Allowed actions</dt>
              <dd className="mt-1 text-sm">{policy.allowedActions.length} configured</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-white/5 pt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Allowed Actions
            </div>
            <div className="flex flex-wrap gap-2">
              {policy.allowedActions.map((action) => (
                <StatusBadge key={action} tone="info">
                  {action}
                </StatusBadge>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Add project placeholder */}
      <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
        <Network className="mx-auto mb-3 size-8 text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm font-medium">Multiple projects coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The architecture supports multiple projects. Only single-project in this version.
        </p>
      </div>
    </div>
  );
}
