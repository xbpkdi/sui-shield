import type { Metadata } from "next";
import { Suspense } from "react";
import { Shield } from "lucide-react";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign in · SuiShield",
};

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cinema" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl gradient-cta">
          <Shield className="size-5 text-cinema-navy" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">Loading sign in…</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}