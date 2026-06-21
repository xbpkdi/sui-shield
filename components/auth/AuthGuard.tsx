"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { BackgroundFx } from "@/components/layout/BackgroundFx";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useZkLogin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !session) {
      const next = pathname && pathname !== "/login" ? pathname : "/dashboard";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, session, router, pathname]);

  if (isLoading || (!session && !isLoading)) {
    const status = isLoading ? "Checking your session…" : "Redirecting to sign in…";

    return (
      <div className="relative flex min-h-screen flex-col bg-cinema">
        <BackgroundFx />
        <div
          className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="grid size-12 place-items-center rounded-2xl gradient-cta shadow-[0_0_32px_-4px_rgba(77,162,255,0.5)]">
            <Shield className="size-6 text-cinema-navy" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">{status}</p>
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 animate-pulse rounded-full bg-blue-400/60"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}