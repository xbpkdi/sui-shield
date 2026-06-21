"use client";

import { User, Bot } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import { agentScope, humanControls } from "@/lib/hcai/principles";

export function HumanControlPanel() {
  return (
    <GlassCard accent="violet" className="p-4">
      <p className="relative z-[2] text-xs font-semibold uppercase tracking-wider text-violet-300">
        Human · Agent boundary
      </p>
      <p className="relative z-[2] mt-1 text-xs text-muted-foreground">
        Clear split of control — you stay in charge of signatures and policy; the agent handles auditable prep and co-sign.
      </p>
      <div className="relative z-[2] mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ember-300">
            <User className="size-3.5" aria-hidden="true" />
            You control
          </div>
          <ul className="space-y-2">
            {humanControls.map((item) => (
              <li key={item.label} className="rounded-lg border border-subtle bg-surface-muted px-2.5 py-2">
                <p className="text-xs font-medium text-foreground/90">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-blue-300">
            <Bot className="size-3.5" aria-hidden="true" />
            Agent scope
          </div>
          <ul className="space-y-2">
            {agentScope.map((item) => (
              <li key={item.label} className="rounded-lg border border-subtle bg-surface-muted px-2.5 py-2">
                <p className="text-xs font-medium text-foreground/90">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}