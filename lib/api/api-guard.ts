import { NextResponse } from "next/server";

const RATE_WINDOW_MS = 60_000;

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Sliding-window rate limit keyed by client IP. */
export function checkApiRateLimit(
  req: Request,
  maxRequests: number,
  bucketKey = "default"
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${bucketKey}:${ip}`;
  const now = Date.now();

  let bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return null;
}

/**
 * Same-origin guard for sensitive API routes in production.
 * Skipped in development for local tooling.
 */
export function checkApiOrigin(req: Request): NextResponse | null {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const host = req.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowedHosts = new Set([host]);
  const extraAllowed = process.env.SPONSOR_ALLOWED_ORIGIN?.trim();
  if (extraAllowed) {
    try {
      allowedHosts.add(new URL(extraAllowed).host);
    } catch {
      // ignore malformed env
    }
  }

  for (const raw of [
    process.env.VERCEL_URL?.trim(),
    process.env.VERCEL_BRANCH_URL?.trim(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
  ]) {
    if (!raw) continue;
    try {
      const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
      allowedHosts.add(new URL(normalized).host);
    } catch {
      allowedHosts.add(raw.replace(/^https?:\/\//, "").split("/")[0]);
    }
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

export function guardPublicApi(
  req: Request,
  opts: { maxPerMin?: number; bucketKey?: string; requireOrigin?: boolean } = {}
): NextResponse | null {
  const { maxPerMin = 30, bucketKey = "public-api", requireOrigin = true } = opts;

  if (requireOrigin) {
    const originBlock = checkApiOrigin(req);
    if (originBlock) return originBlock;
  }

  return checkApiRateLimit(req, maxPerMin, bucketKey);
}