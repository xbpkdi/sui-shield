"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { Button } from "@/components/ui/button";
import { AppBrandLink } from "@/components/layout/AppBrandLink";


const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/demo-lab", label: "Demo Lab", isRoute: true },
];

const menuVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const linkVariants = {
  closed: { opacity: 0, y: 24 },
  open: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
      <motion.header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-gradient-to-r from-[#06102a]/80 via-cinema-navy/75 to-[#140c18]/80 backdrop-blur-xl"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <AppBrandLink variant="sidebar" className="[&>div:first-child]:size-9 [&_svg]:size-5" />

          <nav
            className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"
            aria-label="Site navigation"
          >
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button size="sm" asChild className="gradient-cta btn-magnetic text-cinema-navy">
                  <Link href="/demo-lab">
                    Try Demo <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <Link href="/demo-lab">Demo Lab</Link>
                </Button>
                <Button size="sm" asChild className="gradient-cta btn-magnetic text-cinema-navy">
                  <Link href="/login" className="gap-1.5">
                    <LogIn className="size-3.5" />
                    <span className="hidden sm:inline">Sign in</span>
                  </Link>
                </Button>
              </>
            )}

            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Fullscreen overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-cinema-navy/95 backdrop-blur-2xl md:hidden"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <span className="font-display text-sm font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid size-9 place-items-center rounded-lg border border-white/10"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-2 px-8" aria-label="Mobile navigation">
              {navLinks.map((link, i) => (
                <motion.div key={link.href} custom={i} variants={linkVariants} initial="closed" animate="open">
                  {link.isRoute ? (
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="font-display block py-3 text-4xl font-semibold tracking-tight text-foreground/90 transition-colors hover:text-blue-300"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="font-display block py-3 text-4xl font-semibold tracking-tight text-foreground/90 transition-colors hover:text-blue-300"
                    >
                      {link.label}
                    </a>
                  )}
                </motion.div>
              ))}
              <motion.div custom={navLinks.length} variants={linkVariants} initial="closed" animate="open" className="mt-8">
                <Link
                  href={session ? "/dashboard" : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl gradient-cta px-6 py-3 text-sm font-semibold text-cinema-navy"
                >
                  {session ? "Dashboard" : "Sign in"}
                  <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-[72px]" aria-hidden="true" />
    </>
  );
}