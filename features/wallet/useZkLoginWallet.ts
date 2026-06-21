"use client";

import { useWallets } from "@mysten/dapp-kit";
import { isGoogleWallet } from "@mysten/enoki";
import { isEnokiConfigured } from "@/lib/sui/zklogin-config";

/**
 * Returns the Enoki "Sign in with Google" wallet when Enoki integration is configured.
 */
export function useZkLoginWallet() {
  const wallets = useWallets();
  const configured = isEnokiConfigured();
  const googleWallet = configured ? wallets.find(isGoogleWallet) : undefined;

  return {
    configured,
    googleWallet,
    ready: configured && !!googleWallet,
  };
}