const BASE = "https://suiexplorer.com";

export function explorerTxUrl(digest: string, network = "testnet"): string {
  return `${BASE}/txblock/${encodeURIComponent(digest)}?network=${network}`;
}

export function explorerAddressUrl(address: string, network = "testnet"): string {
  return `${BASE}/address/${encodeURIComponent(address)}?network=${network}`;
}

export function explorerObjectUrl(objectId: string, network = "testnet"): string {
  return `${BASE}/object/${encodeURIComponent(objectId)}?network=${network}`;
}

/** Returns true only when the digest looks like a real Sui transaction digest (base58, ~44 chars). */
export function isRealDigest(digest: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(digest);
}
