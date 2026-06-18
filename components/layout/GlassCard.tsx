"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-white/[0.025] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

type MotionGlassCardProps = HTMLMotionProps<"div"> & { className?: string };

export function MotionGlassCard({ className, ...props }: MotionGlassCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-xl border border-white/5 bg-white/[0.025] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
