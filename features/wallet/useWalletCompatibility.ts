"use client";

import { useCurrentWallet } from "@mysten/dapp-kit";
import { isEnokiWallet } from "@mysten/enoki";
import {
  getWalletCompatibility,
  canRunRealMintWithWallet,
  type WalletCompatibility,
} from "./compatibility";

export interface WalletCompatibilityInfo {
  /** Wallet display name, empty string when disconnected. */
  walletName: string;
  /** Data URI for the wallet's icon, null when not available. */
  walletIcon: string | null;
  /** Compatibility result, null when no wallet connected. */
  compatibility: WalletCompatibility | null;
  /** True only for wallets that can complete the real sponsored mint. */
  allowRealMint: boolean;
  /** True when connected via Enoki zkLogin (Google, etc.). */
  isZkLogin: boolean;
  isConnected: boolean;
}

/**
 * Returns the connected wallet's compatibility with the sponsored mint demo.
 * Uses dApp Kit's useCurrentWallet() internally.
 */
export function useWalletCompatibility(): WalletCompatibilityInfo {
  const { currentWallet, isConnected } = useCurrentWallet();

  if (!isConnected || !currentWallet) {
    return {
      walletName: "",
      walletIcon: null,
      compatibility: null,
      allowRealMint: false,
      isZkLogin: false,
      isConnected: false,
    };
  }

  const walletName = currentWallet.name;
  const isZkLogin = isEnokiWallet(currentWallet);
  // wallet-standard Wallet.icon is a data URI string
  const walletIcon = (currentWallet.icon as string | undefined) ?? null;
  const compatibility = getWalletCompatibility(walletName);
  const allowRealMint = canRunRealMintWithWallet(walletName);

  return {
    walletName,
    walletIcon,
    compatibility,
    allowRealMint,
    isZkLogin,
    isConnected: true,
  };
}
