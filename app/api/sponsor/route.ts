import { NextResponse } from "next/server";
import { isSponsorConfigured } from "@/lib/sui/server/sponsor";

export const runtime = "nodejs";

/**
 * Legacy one-phase sponsor endpoint — permanently disabled (security).
 * Use POST /api/sponsor/prepare + POST /api/sponsor/execute instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is disabled. Use the two-phase flow: /api/sponsor/prepare then /api/sponsor/execute.",
      deprecated: true,
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({ configured: isSponsorConfigured(), legacyPostDisabled: true });
}

export const PUT = () => new Response(null, { status: 405 });
export const DELETE = () => new Response(null, { status: 405 });