import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "violet" | "muted";

interface StatusBadgeProps {
  tone?: Tone;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  danger: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  muted: "border-subtle bg-surface-muted text-muted-foreground",
};

const pulseDotStyles: Record<Tone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-blue-300",
  violet: "bg-violet-400",
  muted: "bg-muted-foreground",
};

export function StatusBadge({ tone = "muted", pulse = false, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className
      )}
    >
      {pulse && (
        <span
          className={cn("size-1.5 rounded-full animate-pulse", pulseDotStyles[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
