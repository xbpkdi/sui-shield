/**
 * Server-side in-memory store for prepared sponsored transaction intents.
 * Each intent is keyed by a UUID and consumed exactly once (prepare → execute).
 * Uses globalThis so the store survives Next.js hot module replacement in dev.
 * In production replace with Redis for multi-instance deployments.
 */

export const INTENT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface StoredIntent {
  sender: string;
  txBytes: string; // base64-encoded fully-built transaction BCS
  createdAt: number;
}

const g = globalThis as typeof globalThis & {
  _suiShieldIntentStore?: Map<string, StoredIntent>;
};
g._suiShieldIntentStore ??= new Map();
const store = g._suiShieldIntentStore;

function evictExpired(): void {
  const now = Date.now();
  for (const [id, intent] of store) {
    if (now - intent.createdAt > INTENT_TTL_MS) store.delete(id);
  }
}

export function createIntent(sender: string, txBytes: string): string {
  evictExpired();
  const id = crypto.randomUUID();
  store.set(id, { sender, txBytes, createdAt: Date.now() });
  return id;
}

/** Returns intent and removes it from the store (one-time use). */
export function consumeIntent(intentId: string): StoredIntent | null {
  const intent = store.get(intentId);
  if (!intent) return null;
  if (Date.now() - intent.createdAt > INTENT_TTL_MS) {
    store.delete(intentId);
    return null;
  }
  store.delete(intentId);
  return intent;
}

/** For tests only — exposes current store size. */
export function intentStoreSize(): number {
  return store.size;
}
