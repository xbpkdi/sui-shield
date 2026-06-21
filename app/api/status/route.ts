import { NextResponse } from "next/server";
import { getDeploymentStatus } from "@/lib/deployment";

/** Public readiness probe for judges and CI. No secrets exposed. */
export async function GET() {
  const deployment = getDeploymentStatus();

  return NextResponse.json({
    ok: true,
    app: "SuiShield",
    hackathon: "Sui Overflow 2026",
    network: deployment.network,
    liveMintReady: deployment.liveMintReady,
    contractConfigured: deployment.contractConfigured,
    demoMode: deployment.demoMode,
    packageId: deployment.packageId,
    registryId: deployment.registryId,
    judgePath: ["/login", "/demo-lab", "/transaction-guardian"],
    checkedAt: new Date().toISOString(),
  });
}