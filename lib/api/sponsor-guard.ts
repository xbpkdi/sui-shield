import { checkApiOrigin, checkApiRateLimit } from "@/lib/api/api-guard";

const MAX_SPONSOR_REQUESTS_PER_MIN = 12;

/** @deprecated Use checkApiOrigin from api-guard */
export const checkSponsorOrigin = checkApiOrigin;

/** Sponsor endpoints: stricter rate limit than general public APIs. */
export function checkSponsorRateLimit(req: Request) {
  return checkApiRateLimit(req, MAX_SPONSOR_REQUESTS_PER_MIN, "sponsor");
}

export function guardSponsorRequest(req: Request) {
  const originBlock = checkApiOrigin(req);
  if (originBlock) return originBlock;
  return checkSponsorRateLimit(req);
}