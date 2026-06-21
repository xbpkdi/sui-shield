/** Strip path/query from RPC URLs so API keys in premium endpoints are not leaked. */
export function redactRpcUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "[redacted-rpc]";
  }
}