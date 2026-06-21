"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { GlassCard } from "@/components/layout/GlassCard";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

const stats = [
  { label: "Policy checks", value: "< 5ms", hint: "deterministic engine" },
  { label: "RPC endpoints", value: "3+", hint: "health-monitored pool" },
  { label: "Scenarios", value: "6", hint: "in Demo Lab" },
  { label: "Auth", value: "zkLogin", hint: "passwordless" },
];

export function LandingHero() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 lg:pt-10" aria-labelledby="hero-heading">
      <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="success" pulse>
              Live · Gasless mint on Sui devnet
            </StatusBadge>
            <StatusBadge tone="info">Sui Overflow 2026</StatusBadge>
          </div>

          <h1 id="hero-heading" className="mt-6 text-balance font-display font-bold">
            SuiShield{" "}
            <span className="gradient-text-cinema text-glow-cyan">Gasless Agent</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Application-layer gas sponsorship and transaction recovery — cinematic UX, production-grade policy.
          </p>

          <p className="mt-3 max-w-xl text-sm text-muted-foreground/80">
            Human-centered AI UX: deterministic policy (no LLM on money), you sign every tx, and a full
            OBSERVE → REASON → ACT → RESULT trace for auditors and judges.
          </p>

          <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center">
            <Link
              href="/demo-lab"
              className="btn-magnetic inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-cta px-6 py-3 text-sm font-semibold text-cinema-navy shadow-[0_0_32px_-6px_rgba(77,162,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-[400px]:w-auto"
            >
              <Zap className="size-4" aria-hidden="true" />
              Sign in · Demo Lab
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-subtle bg-surface-muted px-6 py-3 text-sm font-medium text-foreground transition-[border-color,background-color,color] duration-100 ease-out hover:border-blue-400/25 hover:bg-surface-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-[400px]:w-auto"
            >
              Sign in with Google
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground/50">
            Application layer only — cannot repair Sui consensus or protocol-level outages.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassCard hover accent="blue" className="p-4 sm:p-6">
            <div className="relative z-[2] mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Agent Decision
              </span>
              <StatusBadge tone="success" pulse>
                Live preview
              </StatusBadge>
            </div>
            <div className="relative z-[2] space-y-2.5">
              {[
                { phase: "OBSERVE", color: "text-blue-300", msg: "Mint Badge intent received. Primary RPC latency 380ms." },
                { phase: "REASON", color: "text-violet-300", msg: "Action whitelisted. Gas within limit. No duplicate." },
                { phase: "ACT", color: "text-ember-300", msg: "Gas sponsored via Primary RPC. Sponsor signature added." },
                { phase: "RESULT", color: "text-emerald-400", msg: "Transaction confirmed. Badge minted. Digest: 0x4da2…f81" },
              ].map((step, i) => (
                <motion.div
                  key={step.phase}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex gap-3 rounded-lg border border-subtle bg-surface-muted px-3 py-2.5 text-sm"
                >
                  <span className={`shrink-0 font-mono text-xs font-semibold ${step.color}`}>
                    {step.phase}
                  </span>
                  <span className="text-foreground/80">{step.msg}</span>
                </motion.div>
              ))}
            </div>
            <div className="relative z-[2] mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
              Badge minted — gas paid by application
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <ScrollReveal className="mt-16" delay={0.1}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
          {stats.map((s) => (
            <GlassCard key={s.label} hover accent="none" className="p-4">
              <p className="relative z-[2] text-xs text-muted-foreground">{s.label}</p>
              <p className="relative z-[2] mt-1 font-mono text-2xl font-semibold">{s.value}</p>
              <p className="relative z-[2] mt-0.5 text-xs text-muted-foreground">{s.hint}</p>
            </GlassCard>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}