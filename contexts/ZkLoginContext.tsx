"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import type { ZkLoginSession } from "@/lib/zklogin/types";
import { loadSession, clearSession } from "@/lib/zklogin/session";
import { startSignIn, completeSignIn } from "@/lib/zklogin/client";
import { STALE_SESSION_MESSAGE, staleSessionReason } from "@/lib/zklogin/validate";
import { getGoogleClientId } from "@/lib/sui/zklogin-config";

interface ZkLoginContextValue {
  session: ZkLoginSession | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  /** Called from /callback to finalise the Google OAuth flow. */
  handleCallback: (idToken: string) => Promise<void>;
}

const ZkLoginContext = createContext<ZkLoginContextValue | null>(null);

export function ZkLoginProvider({ children }: { children: ReactNode }) {
  const suiClient = useSuiClient();
  const [session, setSession] = useState<ZkLoginSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage; drop entries from another network or stale maxEpoch.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const saved = loadSession();
      if (!saved) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const { epoch } = await suiClient.getLatestSuiSystemState();
        const reason = staleSessionReason(saved, Number(epoch));
        if (reason) {
          clearSession();
          if (!cancelled) {
            setSession(null);
            setError(STALE_SESSION_MESSAGE);
          }
        } else if (!cancelled) {
          setSession(saved);
        }
      } catch {
        if (!cancelled) setSession(saved);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [suiClient]);

  const signIn = useCallback(async () => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      setError("Google Client ID not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local.");
      return;
    }
    setError(null);
    const redirectUri = `${window.location.origin}/callback`;
    // startSignIn redirects the page — no need for loading state
    await startSignIn(clientId, redirectUri, suiClient as unknown as import("@mysten/sui/jsonRpc").SuiJsonRpcClient);
  }, [suiClient]);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
    setError(null);
  }, []);

  const handleCallback = useCallback(
    async (idToken: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const newSession = await completeSignIn(idToken, suiClient as unknown as import("@mysten/sui/jsonRpc").SuiJsonRpcClient);
        setSession(newSession);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [suiClient]
  );

  const value = useMemo(
    () => ({ session, isLoading, error, signIn, signOut, handleCallback }),
    [session, isLoading, error, signIn, signOut, handleCallback]
  );

  return <ZkLoginContext.Provider value={value}>{children}</ZkLoginContext.Provider>;
}

export function useZkLogin(): ZkLoginContextValue {
  const ctx = useContext(ZkLoginContext);
  if (!ctx) throw new Error("useZkLogin must be used inside ZkLoginProvider");
  return ctx;
}
