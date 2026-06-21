"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { isPhantomAllowed } from "@/features/wallet/compatibility";

export interface ModalDryRunInfo {
  passed: boolean;
  gasEstimateMist: number;
  sponsorAddress: string;
}

interface PhantomWarningModalProps {
  open: boolean;
  dryRunInfo?: ModalDryRunInfo | null;
  onUseSlush: () => void;
  onCancel: () => void;
  /** Only invoked when NEXT_PUBLIC_ALLOW_PHANTOM_SPONSORED_TX=true. */
  onContinue: () => void;
}

/**
 * Modal shown when Phantom is connected and the user attempts a real sponsored mint.
 *
 * Phantom cannot correctly simulate sponsored Sui transactions where gasOwner ≠ sender.
 * This modal explains the limitation, shows the server dry-run result, and lets the user
 * switch to Slush or (if the feature flag is enabled) override and continue.
 *
 * Never uses the phrase "Confirm unsafe". Never implies the transaction is guaranteed
 * to succeed through Phantom.
 */
export function PhantomWarningModal({
  open,
  dryRunInfo,
  onUseSlush,
  onCancel,
  onContinue,
}: PhantomWarningModalProps) {
  const allowContinue = isPhantomAllowed();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Dialog — flex centering so motion transform does not fight Tailwind translate */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="phantom-warning-title"
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#0a0f25] p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-lg bg-amber-500/12 p-2">
                <AlertTriangle className="size-5 text-amber-400" aria-hidden="true" />
              </div>
              <div>
                <h2 id="phantom-warning-title" className="text-sm font-semibold text-amber-300">
                  Phantom Preview Limitation
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  Phantom may incorrectly show{" "}
                  <span className="rounded bg-white/5 px-1 font-mono text-xs text-amber-300">
                    &ldquo;Not enough SUI&rdquo;
                  </span>{" "}
                  or{" "}
                  <span className="rounded bg-white/5 px-1 font-mono text-xs text-amber-300">
                    &ldquo;Simulation failed&rdquo;
                  </span>{" "}
                  for sponsored Sui transactions, even when the sponsor gas is correctly
                  configured and the server-side dry run succeeds.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  For the most reliable gasless testnet experience, use{" "}
                  <strong className="text-foreground">Slush Wallet</strong>.
                </p>
              </div>
            </div>

            {/* Server dry-run status */}
            <div className="mt-4 rounded-xl border border-white/8 bg-black/30 p-3 text-xs">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Server Dry Run (authoritative check)
              </div>
              {dryRunInfo ? (
                <>
                  <div className="flex items-center gap-2">
                    {dryRunInfo.passed ? (
                      <CheckCircle2
                        className="size-3.5 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertTriangle
                        className="size-3.5 shrink-0 text-red-400"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={dryRunInfo.passed ? "text-emerald-400" : "text-red-400"}
                    >
                      {dryRunInfo.passed
                        ? "Passed — transaction is valid on-chain"
                        : "Failed — transaction would be rejected"}
                    </span>
                  </div>
                  {dryRunInfo.passed && (
                    <div className="mt-2 space-y-1 text-muted-foreground">
                      <div>
                        Gas estimate:{" "}
                        <span className="font-mono text-foreground/70">
                          {dryRunInfo.gasEstimateMist.toLocaleString()} MIST
                        </span>
                      </div>
                      <div>
                        Gas owner:{" "}
                        <span className="font-mono text-foreground/70">
                          {dryRunInfo.sponsorAddress.slice(0, 10)}…
                          {dryRunInfo.sponsorAddress.slice(-6)}
                        </span>{" "}
                        <span className="text-emerald-400/70">(sponsor, not your wallet)</span>
                      </div>
                      <div>
                        Network:{" "}
                        <span className="font-mono text-foreground/70">Testnet</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  Dry run is performed automatically when you click Mint Badge Gasless.
                </span>
              )}
            </div>

            {/* Override warning (only shown when flag is true) */}
            {allowContinue && (
              <div className="mt-3 rounded-lg border border-amber-500/15 bg-amber-500/4 px-3 py-2 text-xs text-amber-300/80">
                <strong className="text-amber-300">Developer override enabled.</strong>{" "}
                Proceeding with Phantom may result in a wallet preview that does not accurately
                reflect the sponsored transaction. The transaction is not guaranteed to succeed
                through Phantom&apos;s signing flow. This option is for development testing only.
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={onUseSlush}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-[#050816] transition-shadow hover:shadow-[0_0_20px_-4px_rgba(77,162,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Use Slush Wallet
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Cancel
                </button>
                {allowContinue && (
                  <button
                    onClick={onContinue}
                    className="flex-1 rounded-xl border border-amber-500/25 bg-amber-500/6 px-4 py-2 text-sm text-amber-300 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    Continue with Phantom
                  </button>
                )}
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
