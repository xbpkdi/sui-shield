import type { ZkLoginSession } from "@/lib/zklogin/types";
import { signWithZkLoginSession } from "@/lib/zklogin/client";

/**
 * Signs server-prepared sponsored transaction bytes with the user's zkLogin session.
 * Returns { bytes, signature } compatible with WalletSigner and the /api/sponsor/execute endpoint.
 */
export async function signPreparedBytesWithZkLogin(
  session: ZkLoginSession,
  txBytesBase64: string
): Promise<{ bytes: string; signature: string }> {
  return signWithZkLoginSession(session, txBytesBase64);
}
