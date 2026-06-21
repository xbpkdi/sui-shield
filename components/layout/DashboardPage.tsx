"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        "relative mx-auto max-w-full space-y-5 px-4 py-5 pb-8 sm:space-y-7 sm:px-6 sm:py-6 sm:pb-10",
        maxWidthClass[maxWidth],
        className
      )}
    >
      {children}
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
    <header className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface-card p-4 backdrop-blur-md sm:p-5 md:flex-row md:items-end md:justify-between">
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
    </header>
  );
}

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  /** @deprecated No longer used — sections render instantly for snappy nav */
  delay?: number;
  "aria-label"?: string;
}

export function PageSection({
  children,
  className,
  "aria-label": ariaLabel,
}: PageSectionProps) {
  const content = <div className={className}>{children}</div>;

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
export const cardGridDemoClass = "grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10";

/** Inline stat blocks inside a card */
export const cardStatsClass = "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4";

/** Default card body padding */
export const cardBodyClass = "p-5 sm:p-6";

/** Compact card body padding (KPI tiles, dense panels) */
export const cardBodyCompactClass = "p-4 sm:p-5";

/** Dense vertical lists inside a card */
export const listCompactClass = "space-y-3";