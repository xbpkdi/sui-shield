"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { BackgroundFx } from "@/components/layout/BackgroundFx";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";
import { consumeAuthNext, peekAuthNext } from "@/lib/auth/redirect";

export function CallbackClient() {
  const { handleCallback } = useZkLogin();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Verifying with Google…");
  const networkLabel = getNetworkLabel(getActiveNetwork());

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (!idToken) {
      setError("No id_token received from Google. Please try signing in again.");
      return;
    }

    setStatus("Getting your Sui address…");

    handleCallback(idToken)
      .then(() => {
        setStatus("Done! Redirecting…");
        router.replace(consumeAuthNext("/dashboard"));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToLogin() {
    const next = peekAuthNext();
    router.replace(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-cinema">
      <BackgroundFx />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-blue-400/35 via-violet-500/20 to-ember-500/35 opacity-80 blur-sm"
              aria-hidden="true"
            />

            <div className="glass-card-hover relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-blue-500/[0.1] via-white/[0.04] to-ember-500/[0.08] shadow-[0_24px_80px_-24px_rgba(77,162,255,0.35)] backdrop-blur-xl after:pointer-events-none after:absolute after:inset-0 after:bg-card-shine">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-400 via-violet-400 to-ember-500" />

              <div className="relative flex flex-col items-center gap-5 p-4 text-center sm:p-6">
                <div className="grid size-14 place-items-center rounded-2xl gradient-cta shadow-[0_0_40px_-8px_rgba(255,107,53,0.4)]">
                  <Shield className="size-7 text-cinema-navy" strokeWidth={2.5} />
                </div>

                {error ? (
                  <div className="w-full space-y-4">
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 p-4 text-left text-sm text-red-400 backdrop-blur-sm">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToLogin}
                      className="h-11 w-full rounded-xl border-white/10 bg-white/[0.04] text-sm hover:bg-white/[0.08]"
                    >
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin text-blue-400" />
                      <span>{status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/50">
                      Generating zero-knowledge proof on Sui {networkLabel} — this takes a few
                      seconds
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <SiteFooter compact />
    </div>
  );
}