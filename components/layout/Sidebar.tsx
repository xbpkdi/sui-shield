"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  Activity,
  Shield,
  AlertTriangle,
  Terminal,
  FlaskConical,
  Settings as SettingsIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/gasless-policy", label: "Gasless Policy", icon: ShieldCheck },
  { href: "/rpc-health", label: "RPC Health", icon: Activity },
  { href: "/transaction-guardian", label: "Transaction Guardian", icon: Shield },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/agent-logs", label: "Agent Logs", icon: Terminal },
  { href: "/demo-lab", label: "Demo Lab", icon: FlaskConical },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-white/5 bg-[#070b1f]/80 backdrop-blur-xl lg:flex">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 border-b border-white/5 px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 shadow-[0_0_24px_-4px_rgba(77,162,255,0.6)]">
          <Shield className="size-5 text-[#050816]" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">SuiShield</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Gasless Agent
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <div
          className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
          aria-hidden="true"
        >
          Workspace
        </div>
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                    active
                      ? "bg-white/[0.05] text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-blue-400 to-violet-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <item.icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-blue-300" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Agent status */}
      <div className="m-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Agent</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span
              className="size-1.5 animate-pulse rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            Online
          </span>
        </div>
        <div className="mt-2 text-muted-foreground">
          v{process.env.npm_package_version ?? "0.1.0"} · Testnet
        </div>
      </div>
    </aside>
  );
}
