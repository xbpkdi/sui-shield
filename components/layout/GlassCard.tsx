"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export type GlassAccent = "blue" | "violet" | "ember" | "emerald" | "amber" | "none";

const accentBar: Record<GlassAccent, string> = {
  blue: "before:bg-gradient-to-r before:from-blue-400 before:via-blue-300 before:to-transparent",
  violet: "before:bg-gradient-to-r before:from-violet-400 before:via-violet-300 before:to-transparent",
  ember: "before:bg-gradient-to-r before:from-ember-400 before:via-ember-500 before:to-transparent",
  emerald: "before:bg-gradient-to-r before:from-emerald-400 before:via-emerald-300 before:to-transparent",
  amber: "before:bg-gradient-to-r before:from-amber-400 before:via-amber-300 before:to-transparent",
  none: "before:hidden",
};

const accentSurface: Record<GlassAccent, string> = {
  blue: "bg-gradient-to-br from-blue-500/[0.14] via-blue-400/[0.05] to-white/[0.02]",
  violet: "bg-gradient-to-br from-violet-500/[0.14] via-violet-400/[0.05] to-white/[0.02]",
  ember: "bg-gradient-to-br from-ember-500/[0.14] via-blue-500/[0.06] to-white/[0.02]",
  emerald: "bg-gradient-to-br from-emerald-500/[0.12] via-white/[0.04] to-white/[0.01]",
  amber: "bg-gradient-to-br from-amber-500/[0.12] via-ember-500/[0.04] to-white/[0.01]",
  none: "bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent",
};

const cardShell =
  "relative overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] backdrop-blur-md after:pointer-events-none after:absolute after:inset-0 after:bg-card-shine";

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
        "before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-[2px] before:rounded-t-2xl",
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
        "before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-[2px] before:rounded-t-2xl",
        accentBar[accent],
        hover && "glass-card-hover",
        className
      )}
      {...props}
    />
  );
}