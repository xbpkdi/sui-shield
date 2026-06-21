import { NextResponse } from "next/server";
import { getRpcHealthService } from "@/lib/rpc/health-service";

/**
 * Server-side RPC health check endpoint.
 * Runs behind an API route so private RPC credentials never reach the browser.
 */
export async function GET() {
  try {
    const results = await getRpcHealthService().checkAll();
    return NextResponse.json({ ok: true, endpoints: results, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[rpc-health] check failed:", error);
    return NextResponse.json(
      { ok: false, error: "Health check failed", endpoints: [] },
      { status: 500 }
    );
  }
}
