"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, X, Zap } from "lucide-react";
import { getDeploymentStatus } from "@/lib/deployment";

const DISMISS_KEY = "suishield_judge_banner_dismissed";

export function JudgeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  });

  const status = getDeploymentStatus();

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-violet-500/6 to-transparent px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Zap className="mt-0.5 size-4 shrink-0 text-blue-300" aria-hidden="true" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-foreground">
              Sui Overflow 2026 — Judge quick path
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {status.liveMintReady
                ? `Demo Lab → Normal Success → real gasless mint on Sui ${status.networkLabel}. Then check TX Guardian for the agent trace.`
                : "Demo Lab runs simulations. Set contract env vars for a live on-chain mint."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/demo-lab"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-blue-500/20"
          >
            Demo Lab
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Dismiss judge banner"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}