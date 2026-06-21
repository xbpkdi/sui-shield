"use client";

import { Eye, Hand, ShieldCheck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: Eye, label: "Transparent trace", hint: "OBSERVE → REASON → ACT → RESULT" },
  { icon: Hand, label: "You sign txs", hint: "Human-in-the-loop sponsorship" },
  { icon: ShieldCheck, label: "Deterministic policy", hint: "No LLM on money decisions" },
  { icon: RotateCcw, label: "Recoverable", hint: "Policy + Protective Mode controls" },
] as const;

interface HcaiTrustStripProps {
  className?: string;
  compact?: boolean;
}

export function HcaiTrustStrip({ className, compact = false }: HcaiTrustStripProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-subtle bg-surface-muted",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        className
      )}
      role="note"
      aria-label="Human-centered AI trust principles"
    >
      <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
        Human-Centered AI
      </p>
      <ul
        className={cn(
          "mt-2 grid gap-2",
          compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <item.icon className="mt-0.5 size-3.5 shrink-0 text-blue-300" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground/90">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}