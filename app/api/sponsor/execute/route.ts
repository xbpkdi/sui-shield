import { NextResponse } from "next/server";
import { z } from "zod";
import { guardSponsorRequest } from "@/lib/api/sponsor-guard";
import { executeSponsoredMint, isSponsorConfigured } from "@/lib/sui/server/sponsor";

export const runtime = "nodejs";

const ExecuteRequestSchema = z.object({
  intentId: z.string().uuid("intentId must be a UUID"),
  transactionBytes: z.string().min(1, "transactionBytes required"),
  userSignature: z.string().min(1, "userSignature required"),
});

/**
 * POST /api/sponsor/execute
 *
 * Phase 2 of the two-phase sponsored mint:
 *   - Loads the stored intent by intentId (expires in 5 min)
 *   - Verifies transactionBytes === stored bytes (rejects if wallet modified them)
 *   - Verifies user signature corresponds to the prepared sender
 *   - Sponsor signs the SAME bytes the user signed
 *   - Executes with [userSignature, sponsorSignature]
 *   - Returns { digest, explorerUrl, gasUsed }
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

  const parsed = ExecuteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await executeSponsoredMint(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Execution failed";
    const e = err as Error & {
      isIntentError?: boolean;
      isBytesMismatch?: boolean;
      isSignatureError?: boolean;
      isDuplicateMint?: boolean;
      moveAbortCode?: number;
    };

    if (e.isIntentError) {
      return NextResponse.json({ error: message }, { status: 410 });
    }
    if (e.isBytesMismatch) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (e.isSignatureError) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (e.moveAbortCode !== undefined || e.isDuplicateMint) {
      return NextResponse.json(
        { error: message, moveAbortCode: e.moveAbortCode, stage: "execution" },
        { status: 422 }
      );
    }

    console.error("[sponsor/execute] error:", message);

    if (message.includes("max epoch") || message.includes("maxEpoch")) {
      return NextResponse.json(
        {
          error:
            "zkLogin session was created on a different Sui network (stale maxEpoch). " +
            "Sign out, sign in again with Google, then retry mint.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Transaction execution failed" }, { status: 500 });
  }
}

export const GET = () => new Response(null, { status: 405 });
export const PUT = () => new Response(null, { status: 405 });
export const DELETE = () => new Response(null, { status: 405 });
