"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Play, ExternalLink } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { GlassCard } from "@/components/layout/GlassCard";
import { getDeploymentStatus } from "@/lib/deployment";
import { GITHUB_URL, LIVE_DEMO_URL } from "@/lib/constants";

const judgeSteps = [
  {
    step: 1,
    title: "Sign in with Google",
    desc: "zkLogin creates a Sui address — no wallet extension or seed phrase.",
    href: "/login",
    cta: "Sign in",
  },
  {
    step: 2,
    title: "Run Normal Success",
    desc: "Demo Lab → Normal Success → real gasless Starter Badge mint on devnet.",
    href: "/demo-lab",
    cta: "Open Demo Lab",
  },
  {
    step: 3,
    title: "Inspect the trace",
    desc: "TX Guardian shows OBSERVE → REASON → ACT → RESULT with a Sui Explorer link.",
    href: "/transaction-guardian",
    cta: "TX Guardian",
  },
  {
    step: 4,
    title: "Stress-test the agent",
    desc: "Run RPC Failure or Network Instability — Incidents and Agent Logs populate live.",
    href: "/demo-lab",
    cta: "More scenarios",
  },
] as const;

const secondaryBtnClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-subtle bg-surface-muted px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-blue-400/25 hover:bg-surface-hover sm:w-auto";

export function JudgeGuide() {
  const status = getDeploymentStatus();

  return (
    <section
      id="for-judges"
      className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="judges-heading"
    >
      <ScrollReveal className="mb-10 text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <StatusBadge tone={status.liveMintReady ? "success" : "warning"} pulse={status.liveMintReady}>
            {status.liveMintReady ? `Live on Sui ${status.networkLabel}` : "Configure env for live mint"}
          </StatusBadge>
          <StatusBadge tone="info">3-minute judge path</StatusBadge>
        </div>
        <h2 id="judges-heading" className="font-display font-bold tracking-tight">
          Built for judges — click, mint, verify
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Human-centered AI UX: deterministic policy, full reasoning trace, you sign exact bytes before
          sponsor co-signs. Use a fresh Google account if you already minted.
        </p>
      </ScrollReveal>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
        {judgeSteps.map((item, i) => (
          <ScrollReveal key={item.step} delay={i * 0.05}>
            <li className="h-full">
              <GlassCard hover accent="blue" className="flex h-full flex-col bg-gradient-to-br from-[#1a0a2e] via-[#0d0d1a] to-[#050508] p-5">
                <div className="relative z-[2] mb-3 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg border border-blue-400/20 bg-blue-400/10 font-mono text-xs font-semibold text-blue-300">
                    {item.step}
                  </span>
                  <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="relative z-[2] font-display text-sm font-semibold">{item.title}</h3>
                <p className="relative z-[2] mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
                <Link
                  href={item.href}
                  className="relative z-[2] mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-300 transition-colors hover:text-blue-200"
                >
                  {item.cta}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </GlassCard>
            </li>
          </ScrollReveal>
        ))}
      </ol>

      <ScrollReveal delay={0.2} className="mt-8">
        <GlassCard accent="none" className="flex flex-col items-center justify-center gap-4 p-6 sm:flex-row">
          <Link
            href="/demo-lab"
            className="btn-magnetic relative z-[2] inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-cta px-6 py-3 text-sm font-semibold text-cinema-navy shadow-[0_0_32px_-6px_rgba(77,162,255,0.35)] sm:w-auto"
          >
            <Play className="size-4" aria-hidden="true" />
            Start 3-minute demo
          </Link>
          {LIVE_DEMO_URL && (
            <a
              href={`${LIVE_DEMO_URL}/api/status`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-[2] inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-400 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/15 sm:w-auto"
            >
              Live status API
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={`relative z-[2] ${secondaryBtnClass}`}>
            View source
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </GlassCard>
      </ScrollReveal>
    </section>
  );
}