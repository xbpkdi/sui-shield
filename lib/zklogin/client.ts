import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  genAddressSeed,
  decodeJwt,
  jwtToAddress,
} from "@mysten/sui/zklogin";
import { fromBase64 } from "@mysten/bcs";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { ZkLoginSession, ZkLoginPendingState } from "./types";
import { savePendingState, loadPendingState, clearPendingState, saveSession } from "./session";
import { assertSessionValidForChain } from "./validate";
import { getActiveNetwork } from "@/lib/sui/network";

const MAX_EPOCH_AHEAD = 2;
const EPOCH_MS = 24 * 60 * 60 * 1000;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new Error(
      `zkLogin request failed (${url}): ${msg}. ` +
        "Check your connection and try signing in again from /login."
    );
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const error = typeof data.error === "string" ? data.error : `Request failed (${res.status})`;
    throw new Error(error);
  }
  return data as T;
}

export async function startSignIn(
  googleClientId: string,
  redirectUri: string,
  suiClient: SuiJsonRpcClient
): Promise<void> {
  const { epoch } = await suiClient.getLatestSuiSystemState();
  const epochAtSignIn = Number(epoch);
  const maxEpoch = epochAtSignIn + MAX_EPOCH_AHEAD;

  const ephemeralKeypair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(ephemeralKeypair.getPublicKey(), maxEpoch, randomness);

  const pending: ZkLoginPendingState = {
    ephemeralPrivateKey: ephemeralKeypair.getSecretKey(),
    maxEpoch,
    randomness,
    epochAtSignIn,
    network: getActiveNetwork(),
  };
  savePendingState(pending);

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: "id_token",
    scope: "openid",
    nonce,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function completeSignIn(
  idToken: string,
  _suiClient: SuiJsonRpcClient
): Promise<ZkLoginSession> {
  const pending = loadPendingState();
  if (!pending) {
    throw new Error(
      "Sign-in session expired. Please go back to /login and try again — " +
        "do not refresh this page before completing Google sign-in."
    );
  }

  const { ephemeralPrivateKey, maxEpoch, randomness, epochAtSignIn } = pending;
  const ephemeralKeypair = Ed25519Keypair.fromSecretKey(ephemeralPrivateKey);

  const claims = decodeJwt(idToken) as {
    sub: string;
    aud: string | string[];
    iss: string;
  };
  const aud = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;

  const { salt } = await postJson<{ salt: string }>("/api/zklogin/salt", {
    token: idToken,
  });

  const address = jwtToAddress(idToken, salt, false);
  const addressSeed = genAddressSeed(BigInt(salt), "sub", claims.sub, aud).toString();

  const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeypair.getPublicKey());
  const zkProof = await postJson<ZkLoginSession["zkProof"]>("/api/zklogin/prove", {
    jwt: idToken,
    extendedEphemeralPublicKey,
    maxEpoch,
    jwtRandomness: randomness,
    salt,
    keyClaimName: "sub",
  });

  const expiresAt = Date.now() + (maxEpoch - epochAtSignIn) * EPOCH_MS;

  const session: ZkLoginSession = {
    address,
    ephemeralPrivateKey,
    zkProof,
    addressSeed,
    maxEpoch,
    salt,
    jwt: idToken,
    randomness,
    network: pending.network ?? getActiveNetwork(),
    expiresAt,
  };

  saveSession(session);
  clearPendingState();
  return session;
}

export async function signWithZkLoginSession(
  session: ZkLoginSession,
  txBytesBase64: string
): Promise<{ bytes: string; signature: string }> {
  await assertSessionValidForChain(session);

  const { ephemeralPrivateKey, addressSeed, maxEpoch, salt, jwt, randomness } = session;
  const ephemeralKeypair = Ed25519Keypair.fromSecretKey(ephemeralPrivateKey);

  // Refresh proof so it matches the ephemeral key used to sign (and uses the correct network zkey).
  let zkProof = session.zkProof;
  if (jwt && randomness) {
    const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
      ephemeralKeypair.getPublicKey()
    );
    zkProof = await postJson<ZkLoginSession["zkProof"]>("/api/zklogin/prove", {
      jwt,
      extendedEphemeralPublicKey,
      maxEpoch,
      jwtRandomness: randomness,
      salt,
      keyClaimName: "sub",
    });
    saveSession({ ...session, zkProof });
  }

  const txBytes = fromBase64(txBytesBase64);

  // Must use signTransaction (TransactionData intent) — raw sign() breaks server verification.
  const { signature: serializedEphemeralSig } = await ephemeralKeypair.signTransaction(txBytes);

  const zkLoginSignature = getZkLoginSignature({
    inputs: {
      proofPoints: zkProof.proofPoints,
      issBase64Details: zkProof.issBase64Details,
      headerBase64: zkProof.headerBase64,
      addressSeed,
    },
    maxEpoch,
    userSignature: serializedEphemeralSig,
  });

  return { bytes: txBytesBase64, signature: zkLoginSignature };
}