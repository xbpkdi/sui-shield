"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Play, Bell, User } from "lucide-react";
import { useSuiShieldStore } from "@/stores/suishield";
import { StatusBadge } from "./StatusBadge";
import { getModeTone, getModeLabel } from "./AppMode";

export function TopBar() {
  const currentMode = useSuiShieldStore((s) => s.currentMode);
  const project = useSuiShieldStore((s) => s.project);
  const gasUsed = useSuiShieldStore((s) => s.gasUsed);
  const sponsorBudget = useSuiShieldStore((s) => s.sponsorBudget);
  const pct = Math.min(100, (gasUsed / sponsorBudget) * 100);
  const modeTone = getModeTone(currentMode);
  const modeLabel = getModeLabel(currentMode);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-[#070b1f]/80 px-4 backdrop-blur-xl">
      {/* Project selector */}
      <button
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label="Select project"
      >
        <span className="size-2 rounded-full bg-gradient-to-br from-blue-400 to-violet-500" aria-hidden="true" />
        <span className="font-medium">{project.name}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>

      {/* Network + mode badges */}
      <StatusBadge tone="info">Testnet</StatusBadge>
      <StatusBadge tone={modeTone} pulse={currentMode !== "healthy"} aria-label={`System mode: ${modeLabel}`}>
        {modeLabel}
      </StatusBadge>

      {/* Budget indicator */}
      <div
        className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 md:flex"
        aria-label={`Sponsor budget: ${gasUsed.toFixed(3)} of ${sponsorBudget} SUI used`}
      >
        <span className="text-xs text-muted-foreground">Sponsor</span>
        <div className="relative h-1.5 w-28 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-500"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {gasUsed.toFixed(3)} / {sponsorBudget} SUI
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Run simulation link */}
        <Link
          href="/demo-lab"
          className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-sm font-medium text-blue-300 transition-all hover:bg-blue-400/18 hover:shadow-[0_0_20px_-4px_rgba(77,162,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <Play className="size-3.5" aria-hidden="true" />
          Run Simulation
        </Link>

        {/* Notifications */}
        <button
          className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Notifications"
        >
          <Bell className="size-4" aria-hidden="true" />
        </button>

        {/* User */}
        <div
          className="grid size-9 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-blue-400/20 to-violet-500/20"
          aria-label="User account"
        >
          <User className="size-4" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
