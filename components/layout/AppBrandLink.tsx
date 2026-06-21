"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { markLandingVisit } from "@/components/auth/PostAuthRedirect";

type AppBrandLinkProps = {
  /** sidebar = icon + two-line title; compact = icon + name; icon = icon only */
  variant?: "sidebar" | "compact" | "icon";
  onNavigate?: () => void;
  className?: string;
};

export function AppBrandLink({
  variant = "sidebar",
  onNavigate,
  className,
}: AppBrandLinkProps) {
  return (
    <Link
      href="/"
      title="Back to home"
      onClick={() => {
        markLandingVisit();
        onNavigate?.();
      }}
      className={cn(
        "group rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 data-cursor-hover",
        variant === "sidebar" && "relative z-[1] flex shrink-0 items-center gap-3",
        variant === "compact" && "flex shrink-0 items-center gap-2",
        variant === "icon" && "grid size-8 shrink-0 place-items-center",
        className
      )}
    >
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-xl gradient-cta shadow-[0_0_20px_-4px_rgba(77,162,255,0.5)] transition-transform group-hover:scale-[1.03]",
          variant === "sidebar" && "size-8",
          variant === "compact" && "size-7 rounded-lg",
          variant === "icon" && "size-8 rounded-lg"
        )}
      >
        <Shield
          className={cn("text-cinema-navy", variant === "sidebar" ? "size-4" : "size-3.5")}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </div>
      {variant === "sidebar" && (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-sm font-semibold tracking-tight">SuiShield</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Gasless Agent
          </span>
        </div>
      )}
      {variant === "compact" && (
        <span className="font-display text-sm font-semibold">SuiShield</span>
      )}
    </Link>
  );
}