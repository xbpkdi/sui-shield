"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

type MaxWidth = "3xl" | "4xl" | "7xl";

const maxWidthClass: Record<MaxWidth, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "7xl": "max-w-7xl",
};

interface DashboardPageProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
}

export function DashboardPage({ children, maxWidth = "7xl", className }: DashboardPageProps) {
  return (
    <div
      className={cn(
        "relative mx-auto max-w-full space-y-6 px-4 py-4 pb-6 sm:space-y-8 sm:px-6 sm:py-5 sm:pb-8",
        maxWidthClass[maxWidth],
        className
      )}
    >
      <div
        className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/16 via-violet-500/8 to-transparent blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/3 h-48 w-48 rounded-full bg-gradient-to-bl from-ember-500/12 to-transparent blur-[90px]"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, badges, actions }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-2 flex flex-col gap-3 rounded-xl border border-white/10 bg-gradient-to-r from-blue-500/[0.1] via-white/[0.04] to-ember-500/[0.08] p-3.5 backdrop-blur-sm sm:p-4 md:flex-row md:items-end md:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/80">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-[1.65rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {(badges || actions) && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {badges}
          {actions}
        </div>
      )}
    </motion.header>
  );
}

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  "aria-label"?: string;
}

export function PageSection({
  children,
  className,
  delay = 0,
  "aria-label": ariaLabel,
}: PageSectionProps) {
  const content = (
    <ScrollReveal className={className} delay={delay}>
      {children}
    </ScrollReveal>
  );

  if (ariaLabel) {
    return <section aria-label={ariaLabel}>{content}</section>;
  }

  return content;
}

/** Primary dashboard action button */
export const pageActionClass =
  "btn-magnetic inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.05] px-3.5 py-2 text-sm font-medium transition-colors hover:border-blue-400/30 hover:bg-blue-400/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 data-cursor-hover";

/** Disabled / coming-soon control — clearly not interactive */
export const pageDisabledClass =
  "inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.02] px-3.5 py-2 text-sm text-muted-foreground opacity-70";

/** Standard gap between sibling cards */
export const cardGridClass = "grid gap-6";

/** KPI / bento card grid — tighter tiles, still separated */
export const cardGridBentoClass =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6";

/** Two-column dashboard layout */
export const cardGridTwoColClass = "grid gap-6 lg:grid-cols-2";

/** Demo lab split layout */
export const cardGridDemoClass = "grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-7";

/** Inline stat blocks inside a card */
export const cardStatsClass = "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4";

/** Default card body padding */
export const cardBodyClass = "p-4";

/** Compact card body padding (KPI tiles, dense panels) */
export const cardBodyCompactClass = "p-3.5";

/** Dense vertical lists inside a card */
export const listCompactClass = "space-y-2";