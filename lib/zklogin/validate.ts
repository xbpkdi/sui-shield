import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import type { ZkLoginSession } from "./types";
import { isSessionValid } from "./session";
import { getActiveNetwork, getNetworkLabel } from "@/lib/sui/network";

export const STALE_SESSION_MESSAGE =
  "Your zkLogin session was created on a different Sui network. Sign out, sign in with Google again, then retry mint.";

export async function fetchCurrentEpoch(
  suiClient?: Pick<SuiJsonRpcClient, "getLatestSuiSystemState">
): Promise<number> {
  if (suiClient) {
    const { epoch } = await suiClient.getLatestSuiSystemState();
    return Number(epoch);
  }

  const network = getActiveNetwork();
  const client = new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl(network),
    network,
  });
  const { epoch } = await client.getLatestSuiSystemState();
  return Number(epoch);
}

export function staleSessionReason(
  session: ZkLoginSession,
  currentEpoch: number
): string | null {
  if (isSessionValid(session, currentEpoch)) return null;

  const label = getNetworkLabel(getActiveNetwork());
  return (
    `zkLogin session is not valid for Sui ${label} (maxEpoch ${session.maxEpoch}, ` +
    `chain epoch ${currentEpoch}). ${STALE_SESSION_MESSAGE}`
  );
}

export async function assertSessionValidForChain(
  session: ZkLoginSession,
  suiClient?: Pick<SuiJsonRpcClient, "getLatestSuiSystemState">
): Promise<void> {
  const currentEpoch = await fetchCurrentEpoch(suiClient);
  const reason = staleSessionReason(session, currentEpoch);
  if (reason) throw new Error(reason);
}