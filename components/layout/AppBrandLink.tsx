"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
      <BrandLogo
        size={variant === "sidebar" || variant === "icon" ? "md" : "sm"}
        interactive
      />
      {variant === "sidebar" && (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-sm font-semibold tracking-tight">
            <span className="text-blue-200/95">Sui</span>
            <span className="text-foreground/95">Shield</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Gasless Agent
          </span>
        </div>
      )}
      {variant === "compact" && (
        <span className="font-display text-sm font-semibold tracking-tight">
          <span className="text-blue-200/95">Sui</span>
          <span className="text-foreground/95">Shield</span>
        </span>
      )}
    </Link>
  );
}