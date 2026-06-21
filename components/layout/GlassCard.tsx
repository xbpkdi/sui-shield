"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export type GlassAccent = "blue" | "violet" | "ember" | "emerald" | "amber" | "none";

const accentBar: Record<GlassAccent, string> = {
  blue: "before:bg-gradient-to-r before:from-blue-400/80 before:via-blue-400/40 before:to-transparent",
  violet: "before:bg-gradient-to-r before:from-violet-400/80 before:via-violet-400/40 before:to-transparent",
  ember: "before:bg-gradient-to-r before:from-ember-400/80 before:via-ember-500/40 before:to-transparent",
  emerald: "before:bg-gradient-to-r before:from-emerald-400/80 before:via-emerald-400/40 before:to-transparent",
  amber: "before:bg-gradient-to-r before:from-amber-400/80 before:via-amber-400/40 before:to-transparent",
  none: "before:hidden",
};

const accentSurface: Record<GlassAccent, string> = {
  blue: "bg-[var(--surface-card-blue)]",
  violet: "bg-[var(--surface-card-violet)]",
  ember: "bg-[var(--surface-card-ember)]",
  emerald: "bg-[var(--surface-card-emerald)]",
  amber: "bg-[var(--surface-card-amber)]",
  none: "bg-[var(--surface-card)]",
};

const accentBorder: Record<GlassAccent, string> = {
  blue: "border-blue-400/20",
  violet: "border-violet-400/20",
  ember: "border-ember-400/20",
  emerald: "border-emerald-400/20",
  amber: "border-amber-400/20",
  none: "border-subtle",
};

const accentGlow: Record<GlassAccent, string> = {
  blue: "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-blue-500/22 after:via-blue-400/10 after:to-transparent after:pointer-events-none",
  violet:
    "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-violet-500/22 after:via-violet-400/10 after:to-transparent after:pointer-events-none",
  ember:
    "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-ember-500/22 after:via-ember-400/10 after:to-transparent after:pointer-events-none",
  emerald:
    "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-emerald-500/22 after:via-emerald-400/10 after:to-transparent after:pointer-events-none",
  amber:
    "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-amber-500/22 after:via-amber-400/10 after:to-transparent after:pointer-events-none",
  none: "",
};

const cardShell =
  "relative overflow-hidden rounded-2xl shadow-[var(--card-inset),var(--card-shadow)] backdrop-blur-xl";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  accent?: GlassAccent;
};

export function GlassCard({
  className,
  hover = false,
  accent = "none",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        cardShell,
        accentSurface[accent],
        accentBorder[accent],
        accentGlow[accent],
        "before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-px before:rounded-t-2xl",
        accentBar[accent],
        hover && "glass-card-hover",
        className
      )}
      {...props}
    />
  );
}

type MotionGlassCardProps = HTMLMotionProps<"div"> & {
  className?: string;
  hover?: boolean;
  accent?: GlassAccent;
};

export function MotionGlassCard({
  className,
  hover = false,
  accent = "none",
  ...props
}: MotionGlassCardProps) {
  return (
    <motion.div
      className={cn(
        cardShell,
        accentSurface[accent],
        accentBorder[accent],
        accentGlow[accent],
        "before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-px before:rounded-t-2xl",
        accentBar[accent],
        hover && "glass-card-hover",
        className
      )}
      {...props}
    />
  );
}