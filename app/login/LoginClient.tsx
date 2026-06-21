"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  Zap,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useZkLogin } from "@/contexts/ZkLoginContext";
import { getGoogleClientId } from "@/lib/sui/zklogin-config";
import { AuthSceneShell } from "@/components/layout/AuthSceneShell";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";
import { markLandingVisit } from "@/components/auth/PostAuthRedirect";
import { saveAuthNext, sanitizeNextPath } from "@/lib/auth/redirect";

const GoogleIcon = () => (
  <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const perks = [
  {
    icon: KeyRound,
    title: "Passwordless",
    desc: "Google OAuth creates your Sui address — no seed phrase, no browser extension.",
  },
  {
    icon: Zap,
    title: "Gasless ready",
    desc: "Mint your Starter Badge with sponsored gas on Sui devnet after sign-in.",
  },
  {
    icon: Sparkles,
    title: "Agent-backed",
    desc: "Policy engine, RPC failover, and Protective Mode kick in from your dashboard.",
  },
] as const;

export function LoginClient() {
  const { session, signIn, error, isLoading } = useZkLogin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = !!getGoogleClientId();
  const [pending, setPending] = useState(false);
  const networkLabel = getNetworkLabel(getActiveNetwork());
  const nextPath = sanitizeNextPath(searchParams.get("next")) ?? "/dashboard";

  useEffect(() => {
    saveAuthNext(nextPath);
  }, [nextPath]);

  useEffect(() => {
    if (session) {
      router.replace(nextPath);
    }
  }, [session, router, nextPath]);

  async function handleSignIn() {
    saveAuthNext(nextPath);
    setPending(true);
    try {
      await signIn();
    } catch {
      setPending(false);
    }
  }

  return (
    <AuthSceneShell className="flex min-h-screen flex-col">
      <Link
        href="/"
        onClick={markLandingVisit}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-white/14 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:left-6 sm:top-6 data-cursor-hover"
      >
        <ArrowLeft className="size-3.5" />
        Home
      </Link>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 sm:gap-10 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-8 lg:py-16">
        {/* Left — brand panel */}
        <motion.div
          className="w-full max-w-lg lg:max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <StatusBadge tone="info">Sui {networkLabel}</StatusBadge>
            <StatusBadge tone="success" pulse>
              Gasless agent online
            </StatusBadge>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <BrandLogo size="lg" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/80">
                SuiShield
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight gradient-text-cinema lg:text-4xl">
                Gasless Agent
              </h1>
            </div>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Application-layer gas sponsorship for Sui dApps. Sign in once with Google zkLogin and
            jump straight into the dashboard or Demo Lab.
          </p>

          <ul className="mt-6 hidden space-y-3 sm:mt-8 sm:block" role="list">
            {perks.map((perk, i) => (
              <motion.li
                key={perk.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }}
                className="flex gap-3 rounded-xl border border-white/8 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent p-3.5 backdrop-blur-sm"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/15 to-violet-500/10">
                  <perk.icon className="size-4 text-blue-300" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">{perk.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{perk.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right — sign-in card */}
        <motion.div
          className="w-full max-w-sm shrink-0"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-blue-400/35 via-violet-500/20 to-ember-500/35 opacity-80 blur-sm"
              aria-hidden="true"
            />

            <div className="glass-card-hover relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-blue-500/[0.1] via-white/[0.04] to-ember-500/[0.08] shadow-[0_24px_80px_-24px_rgba(77,162,255,0.35)] backdrop-blur-xl after:pointer-events-none after:absolute after:inset-0 after:bg-card-shine">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-400 via-violet-400 to-ember-500" />

              <div className="relative p-4 sm:p-6">
                <div className="mb-5 text-center">
                  <h2 className="font-display text-xl font-semibold tracking-tight">Sign in</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Continue with Google to unlock your zkLogin wallet
                  </p>
                </div>

                {configured ? (
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      onClick={handleSignIn}
                      disabled={pending || isLoading}
                      size="lg"
                      className="btn-magnetic h-12 w-full gap-3 rounded-xl border border-white/10 bg-white text-gray-900 shadow-[0_8px_32px_-8px_rgba(255,255,255,0.25)] hover:bg-gray-100 focus-visible:ring-blue-400"
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                      <span className="font-medium">
                        {pending ? "Redirecting to Google…" : "Continue with Google"}
                      </span>
                    </Button>

                    {error && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <p className="text-center text-xs leading-relaxed text-muted-foreground">
                      Uses{" "}
                      <a
                        href="https://docs.sui.io/concepts/cryptography/zklogin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                      >
                        zkLogin
                      </a>{" "}
                      — your Google account creates a Sui address without exposing your identity on
                      chain.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/12 to-amber-500/5 p-4 text-sm text-amber-200">
                    <p className="font-medium">zkLogin not configured</p>
                    <p className="mt-1 text-xs text-amber-200/75">
                      Add{" "}
                      <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">
                        NEXT_PUBLIC_GOOGLE_CLIENT_ID
                      </code>{" "}
                      to <code className="font-mono text-[11px]">.env.local</code>.
                    </p>
                  </div>
                )}
              </div>

              <div className="relative border-t border-white/8 bg-black/20 px-4 py-3 sm:px-6">
                <p className="text-center text-xs text-muted-foreground/70">
                  Sui {networkLabel} · Application layer · No Enoki subscription
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground/60">
            By continuing you agree to use this demo on Sui {networkLabel}.
          </p>
        </motion.div>
      </div>

      <SiteFooter compact />
    </AuthSceneShell>
  );
}