import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

export type SuiNetwork = "testnet" | "devnet" | "mainnet";

const NETWORKS = new Set<SuiNetwork>(["testnet", "devnet", "mainnet"]);

/** Active network from env (client + server). Defaults to testnet. */
export function getActiveNetwork(): SuiNetwork {
  const raw =
    process.env.NEXT_PUBLIC_SUI_NETWORK ?? process.env.SUI_NETWORK ?? "testnet";
  return NETWORKS.has(raw as SuiNetwork) ? (raw as SuiNetwork) : "testnet";
}

export function getNetworkLabel(network: SuiNetwork = getActiveNetwork()): string {
  return network.charAt(0).toUpperCase() + network.slice(1);
}

/** Default public fullnode URL for the active network (UI display). */
export function getDefaultRpcUrl(network: SuiNetwork = getActiveNetwork()): string {
  return getJsonRpcFullnodeUrl(network);
}