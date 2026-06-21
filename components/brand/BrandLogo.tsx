import { cn } from "@/lib/utils";
import { SuiShieldMark } from "@/components/brand/SuiShieldMark";

export type BrandLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeStyles: Record<
  BrandLogoSize,
  { box: string; mark: number; glow: string }
> = {
  xs: {
    box: "size-6 rounded-md",
    mark: 13,
    glow: "shadow-[0_0_12px_-3px_rgba(77,162,255,0.5),0_0_8px_-4px_rgba(255,107,53,0.35)]",
  },
  sm: {
    box: "size-7 rounded-lg",
    mark: 15,
    glow: "shadow-[0_0_14px_-3px_rgba(77,162,255,0.52),0_0_10px_-4px_rgba(255,107,53,0.38)]",
  },
  md: {
    box: "size-8 rounded-xl",
    mark: 17,
    glow: "shadow-[0_0_18px_-4px_rgba(77,162,255,0.55),0_0_12px_-5px_rgba(255,107,53,0.4)]",
  },
  lg: {
    box: "size-12 rounded-2xl",
    mark: 26,
    glow: "shadow-[0_0_36px_-6px_rgba(77,162,255,0.58),0_0_24px_-8px_rgba(255,107,53,0.42)]",
  },
  xl: {
    box: "size-14 rounded-2xl",
    mark: 30,
    glow: "shadow-[0_0_40px_-6px_rgba(77,162,255,0.5),0_0_28px_-8px_rgba(255,107,53,0.48)]",
  },
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  /** Subtle hover scale — off for static loaders */
  interactive?: boolean;
}

export function BrandLogo({ size = "md", className, interactive = false }: BrandLogoProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden border border-subtle bg-surface-muted",
        styles.box,
        styles.glow,
        interactive && "transition-transform duration-200 group-hover:scale-[1.03]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-ember-500/15"
        aria-hidden="true"
      />
      <SuiShieldMark size={styles.mark} className="relative z-[1]" />
    </div>
  );
}