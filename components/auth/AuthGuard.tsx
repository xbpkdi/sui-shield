"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { AuthSceneShell } from "@/components/layout/AuthSceneShell";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
      <AuthSceneShell className="flex min-h-screen flex-col">
        <div
          className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <BrandLogo size="lg" />
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
      </AuthSceneShell>
    );
  }

  return <>{children}</>;
}