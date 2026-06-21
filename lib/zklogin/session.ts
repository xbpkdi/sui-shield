import type { ZkLoginSession, ZkLoginPendingState } from "./types";
import { getActiveNetwork } from "@/lib/sui/network";

/** Legacy key — cleared on boot; sessions are memory-only (no lock-in across visits). */
const SESSION_KEY = "zklogin_session_v2";

let memorySession: ZkLoginSession | null = null;

/** maxEpoch is epochAtSignIn + 2; allow slack for RPC drift and epoch advancement. */
export const MAX_EPOCH_DRIFT = 30;
const PENDING_KEY = "zklogin_pending";
const PENDING_TTL_MS = 10 * 60 * 1000;

interface StoredPending {
  state: ZkLoginPendingState;
  savedAt: number;
}

function isSessionValidForNetwork(session: ZkLoginSession): boolean {
  const expected = getActiveNetwork();
  if (!session.network || session.network !== expected) return false;
  return true;
}

/** Rejects sessions whose maxEpoch came from a different chain (e.g. testnet epoch on devnet). */
export function isSessionEpochPlausible(session: ZkLoginSession, currentEpoch: number): boolean {
  if (!Number.isFinite(currentEpoch) || currentEpoch < 0) return true;
  if (session.maxEpoch < currentEpoch) return false;
  return session.maxEpoch - currentEpoch <= MAX_EPOCH_DRIFT;
}

export function isSessionValid(
  session: ZkLoginSession,
  currentEpoch?: number
): boolean {
  if (Date.now() > session.expiresAt) return false;
  if (!session.jwt || !session.randomness) return false;
  if (!isSessionValidForNetwork(session)) return false;
  if (currentEpoch !== undefined && !isSessionEpochPlausible(session, currentEpoch)) {
    return false;
  }
  return true;
}

/** In-memory only — lost on refresh; never restored from localStorage. */
export function loadSession(): ZkLoginSession | null {
  if (!memorySession) return null;
  if (!isSessionValid(memorySession)) {
    clearSession();
    return null;
  }
  return memorySession;
}

export function saveSession(session: ZkLoginSession): void {
  memorySession = session;
}

export function clearSession(): void {
  memorySession = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

/** Wipe legacy persisted sessions from older builds. */
export function clearPersistedSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

/** localStorage survives the Google OAuth redirect (sessionStorage can be lost in Safari). */
export function savePendingState(state: ZkLoginPendingState): void {
  const stored: StoredPending = { state, savedAt: Date.now() };
  localStorage.setItem(PENDING_KEY, JSON.stringify(stored));
}

export function loadPendingState(): ZkLoginPendingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredPending;
    if (Date.now() - stored.savedAt > PENDING_TTL_MS) {
      clearPendingState();
      return null;
    }
    const expected = getActiveNetwork();
    if (!stored.state.network || stored.state.network !== expected) {
      clearPendingState();
      return null;
    }
    return stored.state;
  } catch {
    return null;
  }
}

export function clearPendingState(): void {
  localStorage.removeItem(PENDING_KEY);
}