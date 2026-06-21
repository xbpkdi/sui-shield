"use client";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { StatusBadge } from "@/components/layout/StatusBadge";

const prepareSnippet = `POST /api/sponsor/prepare
{ "action": "mint_badge", "sender": "0x..." }
→ { txBytes, intentId, sponsorAddress, gasEstimateMist }`;

const executeSnippet = `POST /api/sponsor/execute
{ intentId, transactionBytes, userSignature }
→ { digest, explorerUrl }`;

export function IntegrateSection() {
  return (
    <section
      id="integrate"
      className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="integrate-heading"
    >
      <ScrollReveal className="mb-10 text-center">
        <StatusBadge tone="info">Drop-in for any Sui dApp</StatusBadge>
        <h2 id="integrate-heading" className="mt-4 font-display font-bold tracking-tight">
          Two-phase sponsor API
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Your frontend calls prepare → user signs exact bytes → execute co-signs and submits.
          Policy engine, dry-run, and intent store run server-side — sponsor key never touches the browser.
        </p>
      </ScrollReveal>

      <div className="grid gap-5 lg:grid-cols-2">
        <ScrollReveal delay={0.05}>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Phase 1 — Prepare
            </div>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/85">
              {prepareSnippet}
            </pre>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ember-300">
              Phase 2 — Execute
            </div>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/85">
              {executeSnippet}
            </pre>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}