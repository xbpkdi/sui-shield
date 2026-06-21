"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
} from "@mysten/dapp-kit";

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutateAsync: connect, isPending: connecting } = useConnectWallet();
  const { mutateAsync: disconnect } = useDisconnectWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!account) {
    return (
      <button
        onClick={async () => {
          const wallet = wallets[0];
          if (!wallet) return;
          await connect({ wallet });
        }}
        disabled={connecting || wallets.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/40 bg-blue-400/10 px-3 py-1.5 text-sm font-medium text-blue-300 transition-all hover:bg-blue-400/18 hover:shadow-[0_0_16px_-4px_rgba(77,162,255,0.5)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label="Connect wallet"
      >
        <Wallet className="size-3.5" aria-hidden="true" />
        {connecting ? "Connecting…" : wallets.length === 0 ? "No wallet" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-expanded={menuOpen}
        aria-label={`Wallet: ${account.address}`}
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
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] rounded-xl border border-white/10 bg-[#0a1030]/95 p-2 shadow-2xl backdrop-blur-xl"
            >
              <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Connected · Testnet
              </div>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
                onClick={() => {
                  navigator.clipboard?.writeText(account.address);
                  setMenuOpen(false);
                }}
              >
                <span className="truncate font-mono text-xs">{account.address}</span>
              </button>
              <div className="my-1 h-px bg-white/5" />
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/8"
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
