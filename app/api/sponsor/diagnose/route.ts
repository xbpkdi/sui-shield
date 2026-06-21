import { NextResponse } from "next/server";
import {
  isSponsorConfigured,
  diagnoseSponsoredMint,
} from "@/lib/sui/server/sponsor";

export const runtime = "nodejs";

/**
 * Development-only diagnostic endpoint.
 * Builds and dry-runs a sponsored mint transaction without executing it
 * or exposing any private key material.
 *
 * Usage:
 *   GET /api/sponsor/diagnose?sender=0x...
 *
 * Returns:
 *   { configured, sender, sponsorAddress, packageId, registryId,
 *     gasCoinId, gasCoinBalance, txBytesLength, dryRunStatus,
 *     dryRunError?, moveAbortCode?, gasEstimateMist, alreadyClaimed }
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Diagnostic endpoint disabled in production" },
      { status: 403 }
    );
  }

  if (!isSponsorConfigured()) {
    return NextResponse.json(
      { configured: false, error: "Sponsor service not configured" },
      { status: 200 }
    );
  }

  const { searchParams } = new URL(req.url);
  const sender = searchParams.get("sender");

  if (!sender || !/^0x[0-9a-fA-F]{1,64}$/.test(sender)) {
    return NextResponse.json(
      { error: "Missing or invalid ?sender=0x... parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await diagnoseSponsoredMint(sender);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Diagnosis failed";
    return NextResponse.json(
      { configured: true, error: message },
      { status: 500 }
    );
  }
}

export const POST = () => new Response(null, { status: 405 });
export const PUT = () => new Response(null, { status: 405 });
export const DELETE = () => new Response(null, { status: 405 });
