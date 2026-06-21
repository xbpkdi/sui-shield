"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Github, ExternalLink } from "lucide-react";
import { navItems } from "@/lib/navigation";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { cn, formatAddress } from "@/lib/utils";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppBrandLink } from "@/components/layout/AppBrandLink";
import { GITHUB_HANDLE, GITHUB_URL } from "@/lib/constants";

export const SIDEBAR_WIDTH = 236;

function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function SidebarUser() {
  const { session, signOut } = useZkLogin();
  const router = useRouter();

  if (!session) return null;

  const initials = session.address.slice(2, 4).toUpperCase();

  function handleSignOut() {
    signOut();
    router.push("/login");
  }

  return (
    <div className="m-3 rounded-xl border border-subtle bg-surface-muted">
      <div className="flex items-center gap-3 p-3">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs text-foreground/80">
            {formatAddress(session.address, 4)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            zkLogin · {getNetworkLabel(getActiveNetwork())}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
          aria-label="Sign out"
        >
          <LogOut className="size-3" />
        </button>
      </div>
      <div className="flex items-center justify-between border-t border-subtle px-3 py-2">
        <span className="text-[11px] text-muted-foreground">Agent</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
          Online
        </span>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <footer className="shrink-0 border-t border-subtle px-4 py-3">
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <Github className="size-4 shrink-0 text-muted-foreground/70 group-hover:text-foreground/80" />
        <span className="min-w-0 flex-1 truncate font-medium">{GITHUB_HANDLE}</span>
        <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
      </a>
      <p className="mt-1 px-2 text-[10px] text-muted-foreground/50">Sui Overflow 2026</p>
    </footer>
  );
}

interface NavListProps {
  pathname: string;
  onNavigate?: () => void;
}

function NavList({ pathname, onNavigate }: NavListProps) {
  return (
    <ul className="space-y-0.5" role="list">
      {navItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        const isDemoLab = item.href === "/demo-lab";
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-[1] flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[background-color,border-color,color,box-shadow] duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 data-cursor-hover",
                active && isDemoLab
                  ? "border border-ember-500/30 bg-gradient-to-r from-ember-500/15 to-blue-400/10 text-foreground nav-cta-glow"
                  : active
                  ? "bg-gradient-to-r from-blue-400/12 to-ember-500/8 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  : isDemoLab
                    ? "border border-ember-500/20 bg-ember-500/[0.06] text-ember-300 hover:border-ember-500/35 hover:bg-ember-500/10 nav-cta-glow"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {active && (
                <span
                  className="pointer-events-none absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-blue-400 to-ember-500"
                  aria-hidden="true"
                />
              )}
              <item.icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-blue-300" : "text-muted-foreground/70"
                )}
                aria-hidden="true"
              />
              <span className="truncate font-medium">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: SIDEBAR_WIDTH }}
      className="fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-subtle bg-surface-sidebar shadow-[4px_0_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:flex"
    >
      <div className="shrink-0 border-b border-subtle px-5 py-[18px]">
        <AppBrandLink variant="sidebar" className="focus-visible:ring-inset" />
      </div>

      <nav
        className="relative z-[1] flex-1 overflow-y-auto px-3 py-3"
        aria-label="Main navigation"
      >
        <p
          className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60"
          aria-hidden="true"
        >
          Workspace
        </p>
        <NavList pathname={pathname} />
      </nav>

      <SidebarUser />
      <SidebarFooter />
    </aside>
  );
}

/** Mobile drawer nav — used from TopBar on screens below lg. */
export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />
      <aside
        style={{ width: SIDEBAR_WIDTH }}
        className="absolute inset-y-0 left-0 flex flex-col border-r border-subtle bg-surface-sidebar backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <AppBrandLink variant="compact" onNavigate={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-subtle px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Close
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile navigation">
          <NavList pathname={pathname} onNavigate={onClose} />
        </nav>
        <SidebarUser />
        <SidebarFooter />
      </aside>
    </div>
  );
}