"use client";

import Link from "next/link";
import { Plus, Shield, Network, Settings } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  DashboardPage,
  PageHeader,
  PageSection,
  pageActionClass,
  pageDisabledClass,
  cardStatsClass,
  cardBodyClass,
} from "@/components/layout/DashboardPage";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useSuiShieldStore } from "@/stores/suishield";
import { getModeTone, getModeLabel } from "@/components/layout/AppMode";
import { formatRelativeTime } from "@/lib/utils";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";

export function ProjectsClient() {
  const project = useSuiShieldStore((s) => s.project);
  const policy = useSuiShieldStore((s) => s.policy);
  const networkLabel = getNetworkLabel(getActiveNetwork());

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Projects"
        title="Sui dApp Projects"
        description="Manage sponsorship projects and their configurations."
        actions={
          <span className={pageDisabledClass} title="Multiple projects coming soon">
            <Plus className="size-3.5" aria-hidden="true" />
            New Project
            <StatusBadge tone="muted" className="ml-1 text-[10px]">
              Soon
            </StatusBadge>
          </span>
        }
      />

      <PageSection>
        <GlassCard hover className={cardBodyClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-400/20 to-violet-500/20 border border-white/10">
                <Shield className="size-6 text-blue-300" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge tone="info">{networkLabel}</StatusBadge>
                  <StatusBadge tone={getModeTone(project.mode)}>
                    {getModeLabel(project.mode)}
                  </StatusBadge>
                </div>
              </div>
            </div>
            <Link href="/gasless-policy" className={pageActionClass}>
              <Settings className="size-3.5" aria-hidden="true" />
              Configure
            </Link>
          </div>

          <dl className={`mt-5 ${cardStatsClass}`}>
            <div>
              <dt className="text-xs text-muted-foreground">Project ID</dt>
              <dd className="mt-1 font-mono text-sm">{project.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Network</dt>
              <dd className="mt-1 text-sm">{networkLabel}</dd>
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
      </PageSection>

      <PageSection delay={0.08}>
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-sm">
        <Network className="mx-auto mb-3 size-8 text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm font-medium">Multiple projects coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The architecture supports multiple projects. Only single-project in this version.
        </p>
      </div>
      </PageSection>
    </DashboardPage>
  );
}
