import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  RefreshCcw,
  FileText,
  Terminal,
  Shield,
} from "lucide-react";
import { BackgroundFx } from "@/components/layout/BackgroundFx";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { PostAuthRedirect } from "@/components/auth/PostAuthRedirect";
import { Marquee } from "@/components/effects/Marquee";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

export const metadata: Metadata = {
  title: "SuiShield Gasless Agent — Sui Overflow 2026",
  description:
    "Application-layer gas sponsorship agent for Sui dApps. Live zkLogin + gasless mint on devnet, policy engine, RPC failover, and full agent reasoning trace.",
};

const features = [
  {
    icon: ShieldCheck,
    title: "Gasless Policy Engine",
    desc: "Whitelist sponsored actions, set per-wallet limits, and govern who can spend your sponsor budget. All rules are deterministic and auditable.",
    accent: "from-blue-500/30 via-blue-400/10 to-violet-500/5",
  },
  {
    icon: Shield,
    title: "Duplicate Transaction Guard",
    desc: "Block repeat intents within a configurable rolling window. Prevents double-spends and stops budget exhaustion from rapid retries.",
    accent: "from-violet-500/30 via-violet-400/10 to-blue-500/5",
  },
  {
    icon: RefreshCcw,
    title: "RPC Failover",
    desc: "Health-monitored endpoint pool with automatic switching when latency or checkpoint freshness degrades beyond your threshold.",
    accent: "from-emerald-500/28 via-emerald-400/10 to-blue-500/5",
  },
  {
    icon: ShieldAlert,
    title: "Protective Mode",
    desc: "Pause write actions and queue intents when the Sui network appears unstable. Intents replay automatically when conditions recover.",
    accent: "from-amber-500/28 via-ember-500/12 to-violet-500/5",
  },
  {
    icon: FileText,
    title: "Incident Reports",
    desc: "Auto-generated incident records with timeline, impact, recovery actions, and affected transactions. Exportable for post-mortems.",
    accent: "from-blue-400/25 via-violet-500/12 to-ember-500/5",
  },
  {
    icon: Terminal,
    title: "Agent Action Logs",
    desc: "Full OBSERVE → REASON → ACT → RESULT trace for every agent decision. Auditable, filterable, and exportable.",
    accent: "from-ember-500/28 via-blue-400/12 to-violet-500/5",
  },
];

const agentFlow = ["OBSERVE", "REASON", "ACT", "RESULT"];

const stackItems = [
  "Sui",
  "Next.js 15",
  "Move",
  "zkLogin",
  "Framer Motion",
  "TypeScript",
  "Gas Sponsorship",
  "Policy Engine",
];

export default function LandingPage() {
  return (
    <div className="relative isolate z-0 min-h-screen overflow-hidden bg-cinema">
      <BackgroundFx />
      <PostAuthRedirect />
      <LandingHeader />

      <LandingHero />

      {/* Tech stack marquee */}
      <section className="relative z-10 border-y border-white/5 py-6" aria-label="Tech stack">
        <Marquee items={stackItems} />
      </section>

      {/* Features — glassmorphism grid */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
        aria-labelledby="features-heading"
      >
        <ScrollReveal className="mb-14 text-center">
          <h2 id="features-heading" className="font-display font-bold tracking-tight">
            Built for production Sui dApps
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Every component is deterministic, testable, and replaceable — wrapped in premium glass UI.
          </p>
        </ScrollReveal>

        <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3" role="list">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.06}>
              <li
                className={`glass-card-hover group h-full rounded-2xl border border-white/8 bg-gradient-to-br p-4 sm:p-6 ${f.accent}`}
              >
                <div className="mb-4 grid size-10 place-items-center rounded-xl border border-white/10 bg-black/30 transition-colors group-hover:border-blue-400/30 group-hover:shadow-[0_0_24px_-8px_rgba(77,162,255,0.4)]">
                  <f.icon className="size-4 text-blue-300" aria-hidden="true" />
                </div>
                <h3 className="font-display font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
        aria-labelledby="how-heading"
      >
        <ScrollReveal className="mb-14 text-center">
          <h2 id="how-heading" className="font-display font-bold tracking-tight">
            The agent loop
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every decision follows a concise, auditable 4-phase cycle.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {agentFlow.map((phase, i) => (
              <div key={phase} className="flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-center backdrop-blur-sm transition-colors hover:border-ember-500/30">
                  <div className="font-mono text-xs font-semibold text-blue-300">{phase}</div>
                </div>
                {i < agentFlow.length - 1 && (
                  <ArrowRight className="size-4 text-muted-foreground/60" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15} className="mt-12">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 backdrop-blur-md">
            <p className="mb-5 font-display text-sm font-medium">Example: RPC failover</p>
            <div className="space-y-3 text-sm">
              {[
                { phase: "OBSERVE", text: "Primary RPC latency exceeded threshold (2.8s > 2s)." },
                { phase: "REASON", text: "Transaction unconfirmed. Backup RPC has 420ms latency." },
                { phase: "ACT", text: "Switched active endpoint to Backup RPC. Rebuilt transaction." },
                { phase: "RESULT", text: "Sponsored transaction confirmed via backup endpoint." },
              ].map((s) => (
                <div key={s.phase} className="flex gap-4">
                  <span className="w-20 shrink-0 font-mono text-xs font-semibold text-ember-400">
                    {s.phase}
                  </span>
                  <span className="text-muted-foreground">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Reverse marquee */}
      <section className="relative z-10 border-y border-white/5 py-5" aria-hidden="true">
        <Marquee
          items={["Gasless", "zkLogin", "Sponsored TX", "Protective Mode", "Agent Logs", "Demo Lab"]}
          reverse
          speed="slow"
        />
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <ScrollReveal>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-violet-500/8 to-ember-500/18 p-6 shadow-[0_0_80px_-20px_rgba(77,162,255,0.35)] backdrop-blur-md sm:rounded-3xl sm:p-12">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Try it in the Demo Lab
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Run all 6 scenarios and watch the agent observe, reason, and act in real time.
              Sign in with Google to access Demo Lab and the dashboard.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href="/demo-lab"
                className="btn-magnetic inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-cta px-8 py-3.5 text-sm font-semibold text-cinema-navy shadow-[0_0_32px_-6px_rgba(255,107,53,0.35)] sm:w-auto"
              >
                Open Demo Lab <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 py-3.5 text-sm font-medium transition-colors hover:border-white/20 sm:w-auto"
              >
                Explore Dashboard
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <SiteFooter />
    </div>
  );
}