/** Client-safe zkLogin configuration. Uses native zkLogin (self-hosted salt + Mysten prover). */

export function getGoogleClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return id && id.length > 0 ? id : null;
}

/** True when native zkLogin sign-in is available (Google OAuth only). */
export function isZkLoginConfigured(): boolean {
  return !!getGoogleClientId();
}

/**
 * Optional Enoki API key — only needed to register Enoki wallets in dApp Kit's
 * ConnectModal. Not required for the built-in zkLogin sign-in flow.
 */
export function getEnokiApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_ENOKI_API_KEY;
  return key && key.length > 0 ? key : null;
}

/** True when both Enoki and Google OAuth are configured (optional integration). */
export function isEnokiConfigured(): boolean {
  return !!(getEnokiApiKey() && getGoogleClientId());
}