"use client";

import { isZkLoginConfigured } from "@/lib/sui/zklogin-config";

/**
 * Shown when zkLogin env vars are missing — explains why Google sign-in is unavailable.
 */
export function ZkLoginSetupBanner() {
  if (isZkLoginConfigured()) return null;

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/8 px-4 py-3 text-sm text-violet-200">
      <strong>zkLogin not enabled.</strong> Add{" "}
      <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to{" "}
      <code className="font-mono text-xs">.env.local</code>, then restart{" "}
      <code className="font-mono text-xs">npm run dev</code>. Create an OAuth Web client in{" "}
      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-300 underline hover:text-blue-200"
      >
        Google Cloud Console
      </a>{" "}
      with redirect URI <code className="font-mono text-xs">http://localhost:3000/callback</code>.
      Also set <code className="font-mono text-xs">SUI_ZKLOGIN_SALT_SECRET</code> in{" "}
      <code className="font-mono text-xs">.env.local</code> (
      <code className="font-mono text-xs">openssl rand -base64 32</code>). Until then, use Slush
      Wallet or simulation mode.
    </div>
  );
}