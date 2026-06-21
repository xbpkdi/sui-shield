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
    <div className="border-b border-subtle bg-gradient-to-r from-blue-400/8 via-surface-card to-ember-500/6 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Zap className="mt-0.5 size-4 shrink-0 text-ember-300" aria-hidden="true" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-foreground">HCAI demo — transparent agent, you sign every tx</p>
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
            className="nav-cta btn-magnetic inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            Demo Lab
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="grid size-7 place-items-center rounded-md border border-subtle bg-surface-muted text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Dismiss judge banner"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}