import { getActiveNetwork, getDefaultRpcUrl, getNetworkLabel, type SuiNetwork } from "@/lib/sui/network";
import { explorerObjectUrl } from "@/lib/sui/explorer";

export interface DeploymentStatus {
  network: SuiNetwork;
  networkLabel: string;
  contractConfigured: boolean;
  liveMintReady: boolean;
  packageId: string | null;
  registryId: string | null;
  demoMode: boolean;
  rpcUrl: string;
  explorerPackageUrl: string | null;
  explorerRegistryUrl: string | null;
}

export function getDeploymentStatus(): DeploymentStatus {
  const network = getActiveNetwork();
  const packageId = process.env.NEXT_PUBLIC_BADGE_PACKAGE_ID?.trim() || null;
  const registryId = process.env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID?.trim() || null;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
  const contractConfigured = !!(packageId && registryId);
  const liveMintReady = contractConfigured && !demoMode;

  return {
    network,
    networkLabel: getNetworkLabel(network),
    contractConfigured,
    liveMintReady,
    packageId,
    registryId,
    demoMode,
    rpcUrl: getDefaultRpcUrl(network),
    explorerPackageUrl: packageId ? explorerObjectUrl(packageId, network) : null,
    explorerRegistryUrl: registryId ? explorerObjectUrl(registryId, network) : null,
  };
}