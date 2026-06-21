"use client";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { GlassCard } from "@/components/layout/GlassCard";
import { HCAI_TAGLINE, hcaiPillars } from "@/lib/hcai/principles";

const pillarAccent = ["blue", "ember", "emerald", "violet"] as const;

export function HcaiSection() {
  return (
    <section
      id="hcai"
      className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="hcai-heading"
    >
      <ScrollReveal className="mb-10 text-center">
        <StatusBadge tone="violet">Human-Centered AI</StatusBadge>
        <h2 id="hcai-heading" className="mt-4 font-display font-bold tracking-tight">
          Trustworthy agent UX
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{HCAI_TAGLINE}</p>
      </ScrollReveal>

      <ul className="grid gap-5 sm:grid-cols-2" role="list">
        {hcaiPillars.map((pillar, i) => (
          <ScrollReveal key={pillar.id} delay={i * 0.05}>
            <li className="h-full">
              <GlassCard hover accent={pillarAccent[i]} className="h-full p-5">
                <h3 className="relative z-[2] font-display text-sm font-semibold">{pillar.title}</h3>
                <p className="relative z-[2] mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pillar.desc}
                </p>
              </GlassCard>
            </li>
          </ScrollReveal>
        ))}
      </ul>
    </section>
  );
}