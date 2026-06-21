"use client";

import { useEffect } from "react";
import { registerEnokiWallets } from "@mysten/enoki";
import { useSuiClient } from "@mysten/dapp-kit";
import { isEnokiConfigured, getEnokiApiKey, getGoogleClientId } from "@/lib/sui/zklogin-config";

/**
 * Optional: registers Enoki zkLogin wallets (Google) with the Wallet Standard registry
 * so they appear in dApp Kit's ConnectModal. Requires NEXT_PUBLIC_ENOKI_API_KEY.
 */
export function EnokiWalletsRegistrar() {
  const suiClient = useSuiClient();

  useEffect(() => {
    if (!isEnokiConfigured()) return;

    const apiKey = getEnokiApiKey()!;
    const clientId = getGoogleClientId()!;

    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    const { unregister } = registerEnokiWallets({
      apiKey,
      client: suiClient,
      network: "testnet",
      providers: {
        google: {
          clientId,
          redirectUrl: origin,
        },
      },
    });

    return () => unregister();
  }, [suiClient]);

  return null;
}