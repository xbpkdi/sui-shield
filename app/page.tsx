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
  Zap,
  CheckCircle2,
} from "lucide-react";
import { BackgroundFx } from "@/components/layout/BackgroundFx";
import { StatusBadge } from "@/components/layout/StatusBadge";

export const metadata: Metadata = {
  title: "SuiShield Gasless Agent — Application-layer gas sponsorship for Sui dApps",
  description:
    "Application-layer gas sponsorship and transaction recovery for Sui dApps. Policy-controlled sponsorship, RPC failover, duplicate protection, and Protective Mode.",
};

const features = [
  {
    icon: ShieldCheck,
    title: "Gasless Policy Engine",
    desc: "Whitelist sponsored actions, set per-wallet limits, and govern who can spend your sponsor budget. All rules are deterministic and auditable.",
    color: "from-blue-400/20 to-blue-400/5",
    border: "border-blue-400/15",
  },
  {
    icon: Shield,
    title: "Duplicate Transaction Guard",
    desc: "Block repeat intents within a configurable rolling window. Prevents double-spends and stops budget exhaustion from rapid retries.",
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/15",
  },
  {
    icon: RefreshCcw,
    title: "RPC Failover",
    desc: "Health-monitored endpoint pool with automatic switching when latency or checkpoint freshness degrades beyond your threshold.",
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/15",
  },
  {
    icon: ShieldAlert,
    title: "Protective Mode",
    desc: "Pause write actions and queue intents when the Sui network appears unstable. Intents replay automatically when conditions recover.",
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/15",
  },
  {
    icon: FileText,
    title: "Incident Reports",
    desc: "Auto-generated incident records with timeline, impact, recovery actions, and affected transactions. Exportable for post-mortems.",
    color: "from-blue-400/20 to-violet-500/5",
    border: "border-blue-400/15",
  },
  {
    icon: Terminal,
    title: "Agent Action Logs",
    desc: "Full OBSERVE → REASON → ACT → RESULT trace for every agent decision. Auditable, filterable, and exportable.",
    color: "from-violet-500/20 to-blue-400/5",
    border: "border-violet-500/15",
  },
];

const agentFlow = ["OBSERVE", "REASON", "ACT", "RESULT"];

const stats = [
  { label: "Policy checks", value: "< 5ms", hint: "deterministic engine" },
  { label: "RPC endpoints", value: "3+", hint: "health-monitored pool" },
  { label: "Scenarios", value: "6", hint: "in Demo Lab" },
  { label: "Network", value: "Testnet", hint: "Sui testnet" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b1f]">
      <BackgroundFx />

      {/* Navigation */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg">
          <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 shadow-[0_0_24px_-4px_rgba(77,162,255,0.6)]">
            <Shield className="size-5 text-[#050816]" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">SuiShield</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Gasless Agent
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Site navigation">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <Link href="/demo-lab" className="hover:text-foreground transition-colors">Demo Lab</Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:border-white/20 transition-colors md:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Dashboard
          </Link>
          <Link
            href="/demo-lab"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-400 to-violet-500 px-3 py-1.5 text-sm font-medium text-[#050816] shadow-[0_0_20px_-4px_rgba(77,162,255,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Try Demo <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10 lg:pt-16" aria-labelledby="hero-heading">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
              Live on Sui Testnet
            </div>

            <h1
              id="hero-heading"
              className="mt-5 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
            >
              SuiShield{" "}
              <span className="bg-gradient-to-br from-blue-300 via-blue-400 to-violet-400 bg-clip-text text-transparent text-glow-cyan">
                Gasless Agent
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Application-layer gas sponsorship and transaction recovery for Sui dApps.
            </p>

            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Policy-controlled sponsorship with deterministic rules. RPC failover, duplicate
              protection, Protective Mode, and a full agent reasoning trace — built for production
              dApps on Sui.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/demo-lab"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-[#050816] shadow-[0_0_28px_-4px_rgba(77,162,255,0.5)] transition-shadow hover:shadow-[0_0_36px_-4px_rgba(77,162,255,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Zap className="size-4" aria-hidden="true" />
                Open Demo Lab
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-foreground hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                View Dashboard
              </Link>
            </div>

            {/* Disclaimer */}
            <p className="mt-5 text-xs text-muted-foreground/60">
              SuiShield operates at the application layer. It cannot repair Sui consensus,
              validators, or protocol-level outages.
            </p>
          </div>

          {/* Hero card */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Agent Decision
              </span>
              <StatusBadge tone="success" pulse>Simulation</StatusBadge>
            </div>
            <div className="space-y-3">
              {[
                { phase: "OBSERVE", color: "text-blue-300", msg: "Mint Badge intent received. Primary RPC latency 380ms." },
                { phase: "REASON", color: "text-violet-300", msg: "Action whitelisted. Gas 0.004 SUI within limit. No duplicate." },
                { phase: "ACT", color: "text-emerald-300", msg: "Gas sponsored via Primary RPC. Sponsor signature added." },
                { phase: "RESULT", color: "text-emerald-400", msg: "Transaction confirmed. Badge minted. Digest: 0x4da2…f81" },
              ].map((step, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5 text-sm">
                  <span className={`shrink-0 font-mono text-xs font-semibold ${step.color}`}>
                    {step.phase}
                  </span>
                  <span className="text-foreground/80">{step.msg}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
              Badge minted — gas paid by application · Simulation
            </div>
          </div>
        </div>

        {/* Stats */}
        <dl className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold">{s.value}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{s.hint}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20"
        aria-labelledby="features-heading"
      >
        <div className="mb-12 text-center">
          <h2 id="features-heading" className="text-3xl font-semibold tracking-tight">
            Built for production Sui dApps
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every component is deterministic, testable, and replaceable.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {features.map((f) => (
            <li
              key={f.title}
              className={`rounded-xl border bg-gradient-to-br p-5 ${f.color} ${f.border}`}
            >
              <div className="mb-3 grid size-9 place-items-center rounded-lg border border-white/10 bg-black/30">
                <f.icon className="size-4 text-blue-300" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20"
        aria-labelledby="how-heading"
      >
        <div className="mb-12 text-center">
          <h2 id="how-heading" className="text-3xl font-semibold tracking-tight">
            The agent loop
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every decision follows a concise, auditable 4-phase cycle.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {agentFlow.map((phase, i) => (
            <div key={phase} className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center">
                <div className="font-mono text-xs font-semibold text-blue-300">{phase}</div>
              </div>
              {i < agentFlow.length - 1 && (
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <p className="mb-4 text-sm font-medium">Example: RPC failover</p>
          <div className="space-y-2 text-sm">
            {[
              { phase: "OBSERVE", text: "Primary RPC latency exceeded threshold (2.8s > 2s)." },
              { phase: "REASON", text: "Transaction unconfirmed. Backup RPC has 420ms latency and fresher checkpoint." },
              { phase: "ACT", text: "Switched active endpoint to Backup RPC. Rebuilt transaction." },
              { phase: "RESULT", text: "Sponsored transaction confirmed via backup endpoint." },
            ].map((s) => (
              <div key={s.phase} className="flex gap-3">
                <span className="w-16 shrink-0 font-mono text-xs font-semibold text-blue-300 mt-0.5">
                  {s.phase}
                </span>
                <span className="text-muted-foreground">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 text-center">
        <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-blue-400/8 to-violet-500/5 p-12">
          <h2 className="text-3xl font-semibold tracking-tight">Try it in the Demo Lab</h2>
          <p className="mt-3 text-muted-foreground">
            Run all 6 scenarios — Normal Success, Duplicate, RPC Failure, Network Instability,
            Budget Exceeded, Move Abort — and watch the agent observe, reason, and act in real time.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/demo-lab"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 px-6 py-3 text-sm font-semibold text-[#050816] shadow-[0_0_28px_-4px_rgba(77,162,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Open Demo Lab <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Explore Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-muted-foreground">
          <span>SuiShield Gasless Agent · v0.1.0</span>
          <span>Built for Sui · Application layer only</span>
        </div>
      </footer>
    </div>
  );
}
