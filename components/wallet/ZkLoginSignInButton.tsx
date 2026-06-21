"use client";

import { useConnectWallet } from "@mysten/dapp-kit";
import { Loader2 } from "lucide-react";
import { useZkLoginWallet } from "@/features/wallet/useZkLoginWallet";

interface ZkLoginSignInButtonProps {
  className?: string;
  size?: "sm" | "md";
  onError?: (message: string) => void;
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
} as const;

/**
 * One-click Google zkLogin — no browser extension required.
 */
export function ZkLoginSignInButton({
  className = "",
  size = "sm",
  onError,
}: ZkLoginSignInButtonProps) {
  const { configured, googleWallet, ready } = useZkLoginWallet();
  const { mutateAsync: connect, isPending } = useConnectWallet();

  if (!configured) return null;

  async function handleSignIn() {
    if (!googleWallet) {
      onError?.(
        "Google sign-in is loading. Wait a moment and try again, or refresh the page."
      );
      return;
    }
    try {
      await connect({ wallet: googleWallet });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={!ready || isPending}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] font-medium text-foreground transition-all hover:border-white/25 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${sizeClasses[size]} ${className}`}
      aria-label="Sign in with Google using zkLogin"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjMyIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHdpZHRoPSIzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMzIgMGgtMzJ2MzJoMzJ6IiBmaWxsPSIjZmZmIi8+PGcgY2xpcC1ydWxlPSJldmVub2RkIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Im0yMy44Mjk5IDE2LjE4MThjMC0uNTY3Mi0uMDUwOS0xLjExMjctLjE0NTQtMS42MzYzaC03LjUzNDZ2My4wOTQ1aDQuMzA1NWMtLjE4NTUgMS0uNzQ5MSAxLjg0NzMtMS41OTY0IDIuNDE0NnYyLjAwNzNoMi41ODU1YzEuNTEyNy0xLjM5MjggMi4zODU0LTMuNDQzNyAyLjM4NTQtNS44ODA2eiIgZmlsbD0iIzQyODVGNCIvPjxwYXRoIGQ9Im0xNiAzLjE2NDA2YzEuNDQxOCAwIDIuNzI0NCAuMjQ5NDcgMy45NTQ1NS42NzM4MmwzLjA5NDU1LTMuMDk0NTVjLTIuNTYxODItMi4zNTQ5NC02LjI4NjM3LTMuNzkyNzEtMTAuMDQ5MS0zLjc5MjcxLTguMTgyNzggMC0xNC44MzY2IDYuNjUzODMtMTQuODM2NiAxNC44MjI5IDAgMS42MjE4LjI2NDM4IDMuMTgyOC43MzY4MiA0LjczODI4bDIuODUzLTIuODUzMDJjLTEuMDAyMi0uNzQ4MzgtMi4wMTg0NS0xLjMwODU4LTMuMDkyNzktMS43ODUyMyIgZmlsbD0iI0ZCQkMwNSIvPjxwYXRoIGQ9Im0zLjE2NDA2IDE5LjgzNjZjMC0xLjQ0MTggLjI0OTQ3LTIuNzI0NCAuNjczODItMy45NTQ1NWwtMy4wOTQ1NS0zLjA5NDU1Yy0yLjM1NDk0IDIuNTYxODItMy43OTI3MSA2LjI4NjM3LTMuNzkyNzEgMTAuMDQ5MSAwIDguMTgyNzggNi42NTM4MyAxNC44MzY2IDE0LjgyMjkgMCAxLjYyMTgtLjI2NDM4IDMuMTgyOC0uNzM2ODIgNC43MzgyOGwyLjg1MyAyLjg1MzAyYy43NDgzOC0xLjAwMjIgMS4zMDg1OC0yLjAxODQ1IDEuNzg1MjMtMy4wOTI3OSIgZmlsbD0iIzM0QTg1MyIvPjxwYXRoIGQ9Im0xNiAzMC41NzgyYy00LjYxMDUgMC04LjQ5NzI5LTIuNTM0MDctMTAuNjI5Ny02LjI0MDgzbDIuODUzMDItMi44NTMwMmMxLjQ0MTggMi45MjI5IDQuNDY0NyA0Ljk1NDU1IDcuNzc2NjggNC45NTQ1NSAyLjI5MDcgMCA0LjM5NTg3LS45NDI5IDUuODg3Ny0yLjU1MzgzbDIuODUzMDIgMi44NTMwMmMtMi4yMTg3NSAyLjkwODg3LTUuNjc4NzUgNC43Mzk4OC05LjY0MDcyIDQuNzM5ODgiIGZpbGw9IiNFQTQzMzUiLz48L2c+PC9zdmc+"
          alt=""
          className="size-4"
          aria-hidden="true"
        />
      )}
      {isPending ? "Signing in…" : "Sign in with Google"}
    </button>
  );
}