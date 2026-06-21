import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchZkLoginProof } from "@/lib/zklogin/services";

export const runtime = "nodejs";

const ProveRequestSchema = z.object({
  jwt: z.string().min(1),
  extendedEphemeralPublicKey: z.string().min(1),
  maxEpoch: z.number().int().positive(),
  jwtRandomness: z.string().min(1),
  salt: z.string().min(1),
  keyClaimName: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ProveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const proof = await fetchZkLoginProof(parsed.data);
    return NextResponse.json(proof, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ZK proof failed";
    console.error("[zklogin/prove]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const GET = () => new Response(null, { status: 405 });