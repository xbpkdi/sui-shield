"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Bell, Copy, LogOut, ChevronDown, Menu } from "lucide-react";
import { MobileNav } from "@/components/layout/Sidebar";
import { AppBrandLink } from "@/components/layout/AppBrandLink";
import { useSuiShieldStore } from "@/stores/suishield";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { StatusBadge } from "./StatusBadge";
import { getModeTone, getModeLabel } from "./AppMode";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";

function UserMenu() {
  const { session, signOut } = useZkLogin();
  const router = useRouter();
  const { copied, copy } = useCopyToClipboard();

  if (!session) return null;

  const short = formatAddress(session.address, 4);
  const initials = session.address.slice(2, 4).toUpperCase();

  function handleSignOut() {
    signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-emerald-500/25 bg-emerald-500/[0.06] pl-1.5 pr-2 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 focus-visible:ring-blue-400 sm:gap-2 sm:pr-2.5"
        >
          <Avatar className="size-5">
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden font-mono text-xs min-[420px]:inline">{short}</span>
          <ChevronDown className="size-3 text-emerald-400/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>zkLogin · {getNetworkLabel(getActiveNetwork())}</DropdownMenuLabel>
        <div className="px-2.5 pb-2 pt-0.5">
          <p className="truncate font-mono text-xs text-muted-foreground">{session.address}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void copy(session.address)}
          className="text-muted-foreground"
        >
          <Copy className="size-3.5" />
          {copied ? "Copied!" : "Copy address"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-400 focus:bg-red-500/8 focus:text-red-400"
        >
          <LogOut className="size-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const currentMode = useSuiShieldStore((s) => s.currentMode);
  const project = useSuiShieldStore((s) => s.project);
  const gasUsed = useSuiShieldStore((s) => s.gasUsed);
  const sponsorBudget = useSuiShieldStore((s) => s.sponsorBudget);
  const pct = Math.min(100, (gasUsed / sponsorBudget) * 100);
  const modeTone = getModeTone(currentMode);
  const modeLabel = getModeLabel(currentMode);

  return (
    <>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <header className="relative sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-2 border-b border-white/10 bg-gradient-to-r from-[#06102a]/90 via-[#050816]/88 to-[#140c18]/90 px-3 py-2 shadow-[0_4px_24px_-12px_rgba(77,162,255,0.2)] backdrop-blur-2xl sm:gap-3 sm:px-4 sm:py-0 lg:px-6">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.02] text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-4" />
        </button>

        <AppBrandLink
          variant="compact"
          className="lg:hidden [&>span]:hidden min-[400px]:[&>span]:inline"
        />

        <Link
          href="/dashboard"
          className="hidden max-w-[140px] items-center gap-2 truncate rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5 text-sm transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:flex lg:hidden data-cursor-hover"
        >
          <span
            className="size-2 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-violet-500"
            aria-hidden="true"
          />
          <span className="truncate font-medium">{project.name}</span>
        </Link>

        <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex">
          <StatusBadge tone="info" className="hidden md:inline-flex">
            {getNetworkLabel(getActiveNetwork())}
          </StatusBadge>
          <StatusBadge tone={modeTone} pulse={currentMode !== "healthy"} className="max-w-full truncate">
            <span className="truncate">{modeLabel}</span>
          </StatusBadge>
        </div>

        {/* Compact sponsor on tablet */}
        <div
          className="hidden items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.02] px-2 py-1 text-xs sm:flex md:hidden"
          aria-label={`Sponsor budget: ${gasUsed.toFixed(3)} of ${sponsorBudget} SUI`}
        >
          <span className="text-muted-foreground">Gas</span>
          <span className="font-mono text-muted-foreground">
            {gasUsed.toFixed(2)}/{sponsorBudget}
          </span>
        </div>

        <div
          className="hidden items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5 md:flex"
          aria-label={`Sponsor budget: ${gasUsed.toFixed(3)} of ${sponsorBudget} SUI used`}
        >
          <span className="text-xs text-muted-foreground">Sponsor</span>
          <div
            className="relative h-1.5 w-20 overflow-hidden rounded-full bg-white/5 lg:w-24"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-ember-500"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {gasUsed.toFixed(3)}/{sponsorBudget}
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <UserMenu />

          <Link
            href="/demo-lab"
            className="btn-magnetic inline-flex items-center gap-1.5 rounded-lg gradient-cta px-2.5 py-2 text-sm font-semibold text-cinema-navy shadow-[0_0_20px_-6px_rgba(255,107,53,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:px-3.5 data-cursor-hover"
            aria-label="Open Demo Lab"
          >
            <Play className="size-3.5" aria-hidden="true" />
            <span className="hidden min-[400px]:inline">Demo Lab</span>
          </Link>

          <button
            type="button"
            disabled
            title="Notifications — coming soon"
            aria-disabled="true"
            className="hidden size-8 cursor-not-allowed place-items-center rounded-lg border border-white/8 bg-white/[0.02] text-muted-foreground/50 opacity-60 lg:grid"
            aria-label="Notifications — coming soon"
          >
            <Bell className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  );
}