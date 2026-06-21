import { cn } from "@/lib/utils";
import { APP_VERSION, GITHUB_HANDLE, GITHUB_URL } from "@/lib/constants";

interface SiteFooterProps {
  className?: string;
  compact?: boolean;
}

export function SiteFooter({ className, compact = false }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "relative z-10 border-t border-subtle px-4 sm:px-6",
        compact ? "py-6" : "py-10",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground",
          compact ? "sm:flex-row" : "sm:flex-row"
        )}
      >
        <span>SuiShield Gasless Agent · v{APP_VERSION}</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-surface-muted px-3 py-1.5 transition-colors hover:border-blue-400/25 hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 data-cursor-hover"
        >
          github.com/{GITHUB_HANDLE}
        </a>
        <span className="text-muted-foreground/60">Sui Overflow 2026 · Application layer</span>
      </div>
    </footer>
  );
}