import { NextResponse } from "next/server";

const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateBucket>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Sliding-window rate limit keyed by client IP. */
export function checkSponsorRateLimit(req: Request): NextResponse | null {
  const ip = getClientIp(req);
  const now = Date.now();

  let bucket = ipBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    ipBuckets.set(ip, bucket);
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  return null;
}

/**
 * Ensures sponsor endpoints are only called from the same host (browser same-origin).
 * Skipped in development to allow local tooling and diagnose scripts.
 */
export function checkSponsorOrigin(req: Request): NextResponse | null {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const host = req.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const extraAllowed = process.env.SPONSOR_ALLOWED_ORIGIN?.trim();
  const allowedHosts = new Set([host]);
  if (extraAllowed) {
    try {
      allowedHosts.add(new URL(extraAllowed).host);
    } catch {
      // ignore malformed env
    }
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    allowedHosts.add(vercelHost);
  }

  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sourceHost = new URL(source).host;
    if (!allowedHosts.has(sourceHost)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export function guardSponsorRequest(req: Request): NextResponse | null {
  const originBlock = checkSponsorOrigin(req);
  if (originBlock) return originBlock;
  return checkSponsorRateLimit(req);
}