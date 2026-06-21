"use client";

import { StatusBadge } from "@/components/layout/StatusBadge";

export type CapabilityMode = "live" | "simulation" | "paused";

const labels: Record<CapabilityMode, { tone: "success" | "warning" | "muted"; text: string }> = {
  live: { tone: "success", text: "Live on-chain" },
  simulation: { tone: "warning", text: "Simulation — no chain write" },
  paused: { tone: "muted", text: "Paused — Protective Mode" },
};

export function CapabilityLabel({ mode }: { mode: CapabilityMode }) {
  const { tone, text } = labels[mode];
  return (
    <StatusBadge tone={tone} aria-label={`System capability: ${text}`}>
      {text}
    </StatusBadge>
  );
}