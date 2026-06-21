import { NextResponse } from "next/server";
import { guardSponsorRequest } from "@/lib/api/sponsor-guard";
import {
  PrepareMintRequestSchema,
  prepareMintIntent,
  checkHasBadgeOnChain,
  isSponsorConfigured,
} from "@/lib/sui/server/sponsor";

export const runtime = "nodejs";

/**
 * POST /api/sponsor/prepare
 *
 * Phase 1 of the two-phase sponsored mint:
 *   - Validates the request
 *   - Checks on-chain duplicate
 *   - Builds the final transaction (sender, gasOwner=sponsor, gasPayment=sponsor coin)
 *   - Dry-runs the exact bytes (fails fast on Move abort)
 *   - Stores the bytes server-side, keyed by intentId
 *   - Returns { txBytes, intentId, sponsorAddress, gasEstimateMist, expiresAt }
 *
 * Does NOT return a sponsor signature — the sponsor signs in Phase 2 (execute)
 * AFTER verifying the user signed the exact same bytes.
 */
export async function POST(req: Request) {
  const blocked = guardSponsorRequest(req);
  if (blocked) return blocked;

  if (!isSponsorConfigured()) {
    return NextResponse.json(
      { error: "Sponsor service not configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PrepareMintRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sender } = parsed.data;

  try {
    const alreadyClaimed = await checkHasBadgeOnChain(sender);
    if (alreadyClaimed) {
      return NextResponse.json(
        { error: "Wallet has already claimed a Starter Badge", moveAbortCode: 7 },
        { status: 409 }
      );
    }

    const result = await prepareMintIntent(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Preparation failed";
    const isDryRun =
      err instanceof Error && (err as Error & { isDryRun?: boolean }).isDryRun;
    const code =
      err instanceof Error
        ? (err as Error & { moveAbortCode?: number }).moveAbortCode
        : undefined;

    if (isDryRun) {
      return NextResponse.json(
        { error: message, moveAbortCode: code, stage: "dry_run" },
        { status: 422 }
      );
    }

    console.error("[sponsor/prepare] error:", message);
    return NextResponse.json(
      { error: "Transaction preparation failed" },
      { status: 500 }
    );
  }
}

export const GET = () => new Response(null, { status: 405 });
export const PUT = () => new Response(null, { status: 405 });
export const DELETE = () => new Response(null, { status: 405 });
