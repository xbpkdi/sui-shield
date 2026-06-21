import { NextResponse } from "next/server";
import { z } from "zod";
import { deriveZkLoginSalt } from "@/lib/zklogin/salt-server";

export const runtime = "nodejs";

const SaltRequestSchema = z.object({
  token: z.string().min(1, "token required"),
});

export async function POST(req: Request) {
  const masterSecret = process.env.SUI_ZKLOGIN_SALT_SECRET;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!masterSecret) {
    return NextResponse.json(
      {
        error:
          "SUI_ZKLOGIN_SALT_SECRET not configured. Add a random server secret to .env.local and restart.",
      },
      { status: 503 }
    );
  }

  if (!clientId) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SaltRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const salt = deriveZkLoginSalt(parsed.data.token, masterSecret, clientId);
    return NextResponse.json({ salt }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Salt derivation failed";
    console.error("[zklogin/salt]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = () => new Response(null, { status: 405 });