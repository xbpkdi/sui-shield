import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface VerifiedGoogleClaims {
  sub: string;
  aud: string;
  iss: string;
  exp?: number;
}

export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId: string
): Promise<VerifiedGoogleClaims> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: expectedClientId,
  });

  return normalizeClaims(payload, expectedClientId);
}

export function normalizeClaims(
  payload: JWTPayload,
  expectedClientId: string
): VerifiedGoogleClaims {
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("Invalid JWT: missing sub claim");
  }

  const aud = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
  if (!aud || typeof aud !== "string" || aud !== expectedClientId) {
    throw new Error("Invalid JWT audience — Client ID mismatch");
  }

  const iss = payload.iss;
  if (!iss || typeof iss !== "string" || !GOOGLE_ISSUERS.includes(iss)) {
    throw new Error("Invalid JWT issuer — expected Google OAuth");
  }

  return {
    sub,
    aud,
    iss,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  };
}