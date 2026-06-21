"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { AppBrandLink } from "@/components/layout/AppBrandLink";
import { cn } from "@/lib/utils";


const navLinks = [
  { href: "#for-judges", label: "For judges" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/demo-lab", label: "Demo Lab", isRoute: true, accent: true },
] as const;

const linkClass =
  "rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

function NavLink({
  href,
  label,
  accent,
  isRoute,
  onClick,
  className,
}: {
  href: string;
  label: string;
  accent?: boolean;
  isRoute?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const classes = cn(linkClass, accent && "nav-link-accent", className);

  if (isRoute) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} onClick={onClick} className={classes}>
      {label}
    </a>
  );
}

export function LandingHeader() {
  const { session } = useZkLogin();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-subtle bg-surface-header backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <AppBrandLink variant="compact" />

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Site navigation"
          >
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href="/dashboard"
                className="btn-magnetic inline-flex h-8 items-center gap-1.5 rounded-lg border border-subtle bg-surface-muted px-3.5 text-xs font-medium text-foreground transition-colors hover:border-blue-400/25 hover:bg-blue-400/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 data-cursor-hover"
              >
                Dashboard
                <ArrowRight className="size-3.5 text-blue-300/80" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-magnetic nav-cta inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 data-cursor-hover"
              >
                Sign in
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}

            <button
              type="button"
              className="grid size-8 place-items-center rounded-lg border border-subtle bg-surface-muted text-foreground transition-colors hover:bg-surface-hover md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-surface-sidebar backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex h-14 items-center justify-between border-b border-subtle px-4">
              <AppBrandLink variant="compact" onNavigate={() => setMenuOpen(false)} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid size-8 place-items-center rounded-lg border border-subtle bg-surface-muted"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-2 px-4 py-6" aria-label="Mobile navigation">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <NavLink
                    {...link}
                    onClick={() => setMenuOpen(false)}
                    className="block w-full px-4 py-3 text-sm"
                  />
                </motion.div>
              ))}
            </nav>

            <div className="border-t border-subtle p-4">
              <Link
                href={session ? "/dashboard" : "/login"}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "btn-magnetic flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                  session
                    ? "border border-subtle bg-surface-muted text-foreground hover:bg-surface-hover"
                    : "nav-cta"
                )}
              >
                {session ? "Dashboard" : "Sign in"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-14" aria-hidden="true" />
    </>
  );
}