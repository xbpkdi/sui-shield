import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSceneShell } from "@/components/layout/AuthSceneShell";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign in · SuiShield",
};

function LoginFallback() {
  return (
    <AuthSceneShell className="flex min-h-screen flex-col">
      <div
        className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3"
        role="status"
        aria-live="polite"
      >
        <BrandLogo size="md" />
        <p className="text-sm text-muted-foreground">Loading sign in…</p>
      </div>
    </AuthSceneShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}