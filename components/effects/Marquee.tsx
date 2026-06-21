import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: string[];
  className?: string;
  reverse?: boolean;
  speed?: "slow" | "normal" | "fast";
}

const speedMap = {
  slow: "[--marquee-duration:32s]",
  normal: "[--marquee-duration:22s]",
  fast: "[--marquee-duration:14s]",
};

export function Marquee({ items, className, reverse, speed = "normal" }: MarqueeProps) {
  const track = [...items, ...items];

  return (
    <div
      className={cn(
        "marquee group overflow-hidden",
        speedMap[speed],
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "marquee-track",
          reverse && "marquee-track-reverse"
        )}
      >
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors group-hover:border-white/12"
          >
            <span className="size-1 rounded-full bg-gradient-to-r from-blue-400 to-ember-400" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}