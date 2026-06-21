import { NextResponse } from "next/server";
import {
  SponsorPrepareRequestSchema,
  prepareSponsoredMint,
  checkHasBadgeOnChain,
  isSponsorConfigured,
} from "@/lib/sui/server/sponsor";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  const parsed = SponsorPrepareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { wallet, action } = parsed.data;

  try {
    // On-chain duplicate prevention — reject before spending gas on dry run
    const alreadyClaimed = await checkHasBadgeOnChain(wallet);
    if (alreadyClaimed) {
      return NextResponse.json(
        { error: "Wallet has already claimed a Starter Badge", moveAbortCode: 7 },
        { status: 409 }
      );
    }

    const result = await prepareSponsoredMint({ wallet, action });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sponsorship failed";
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

    // Don't leak internal error details (gas coin balance, key errors, etc.)
    console.error("[sponsor] error preparing sponsored tx:", message);
    return NextResponse.json(
      { error: "Sponsorship preparation failed" },
      { status: 500 }
    );
  }
}

// Health endpoint — returns whether the sponsor service is configured
export async function GET() {
  return NextResponse.json({ configured: isSponsorConfigured() });
}

// Block unused methods explicitly
export const PUT = () => new Response(null, { status: 405 });
export const DELETE = () => new Response(null, { status: 405 });
