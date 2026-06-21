"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { isZkLoginConfigured } from "@/lib/sui/zklogin-config";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";
import { ZkLoginSignInButton } from "./ZkLoginSignInButton";

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Primary auth control for the dashboard.
 *
 * When zkLogin is configured: "Sign in with Google" is the main action (no extension).
 * Slush and other wallets remain available via "Other wallets".
 */
export function WalletConnectButton() {
  const account = useCurrentAccount();
  const { mutateAsync: disconnect } = useDisconnectWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const zkLoginReady = isZkLoginConfigured();
  const networkLabel = getNetworkLabel(getActiveNetwork());

  if (!account) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {zkLoginReady ? (
          <div className="flex items-center gap-2">
            <ZkLoginSignInButton />
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Connect other Sui wallets"
            >
              <Wallet className="size-3" aria-hidden="true" />
              Other wallets
            </button>
          </div>
        ) : (
          <ConnectModal
            trigger={
              <button
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-400/40 bg-blue-400/10 px-3 py-1.5 text-sm font-medium text-blue-300 transition-all hover:bg-blue-400/18 hover:shadow-[0_0_16px_-4px_rgba(77,162,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Connect Sui wallet"
              >
                <Wallet className="size-3.5" aria-hidden="true" />
                Connect Wallet
              </button>
            }
            open={modalOpen}
            onOpenChange={setModalOpen}
          />
        )}
        <span className="text-[10px] text-emerald-400/70">
          {zkLoginReady
            ? "Recommended: Sign in with Google (gasless, no extension)"
            : "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local, or use Slush Wallet"}
        </span>
        {zkLoginReady && (
          <ConnectModal open={modalOpen} onOpenChange={setModalOpen} trigger={<span />} />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Wallet connected: ${account.address}`}
      >
        <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" />
        <span className="font-mono">{formatAddress(account.address)}</span>
        <ChevronDown
          className={`size-3 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] rounded-xl border border-white/10 bg-[#0a1030]/95 p-2 shadow-2xl backdrop-blur-xl"
            >
              <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Connected · {networkLabel}
              </div>
              <button
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
                onClick={() => {
                  navigator.clipboard?.writeText(account.address);
                  setMenuOpen(false);
                }}
                aria-label="Copy address"
              >
                <span className="truncate font-mono text-xs">{account.address}</span>
              </button>
              <div className="my-1 h-px bg-white/5" />
              <button
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/8"
                onClick={async () => {
                  await disconnect();
                  setMenuOpen(false);
                }}
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Disconnect
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}