"use client";

import { ExternalLink, Copy, Check } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { GlassCard } from "@/components/layout/GlassCard";
import { getDeploymentStatus } from "@/lib/deployment";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";

function ProofRow({
  label,
  value,
  explorerUrl,
}: {
  label: string;
  value: string;
  explorerUrl: string | null;
}) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <GlassCard accent="emerald" className="px-4 py-3">
      <div className="relative z-[2] flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copy(value)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label={`Copy ${label}`}
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1 text-blue-300 transition-colors hover:bg-surface-hover hover:text-blue-200"
              aria-label={`View ${label} on Sui Explorer`}
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
      <p className="relative z-[2] mt-1 break-all font-mono text-xs text-foreground/90">{value}</p>
    </GlassCard>
  );
}

export function OnChainProof() {
  const status = getDeploymentStatus();

  if (!status.contractConfigured) return null;

  return (
    <section
      className="relative z-10 border-y border-subtle bg-surface-muted py-12"
      aria-labelledby="onchain-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <StatusBadge tone="success">On-chain proof</StatusBadge>
          </div>
          <h2 id="onchain-heading" className="font-display text-xl font-bold tracking-tight">
            Deployed Move contract on Sui {status.networkLabel}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            <code className="font-mono text-blue-300">starter_badge::mint_badge</code> — one badge per
            wallet, abort code 7 on duplicate. Gas sponsored by the application layer.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mx-auto grid max-w-3xl gap-3">
            {status.packageId && (
              <ProofRow
                label="Package ID"
                value={status.packageId}
                explorerUrl={status.explorerPackageUrl}
              />
            )}
            {status.registryId && (
              <ProofRow
                label="BadgeRegistry (shared)"
                value={status.registryId}
                explorerUrl={status.explorerRegistryUrl}
              />
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}