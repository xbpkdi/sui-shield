/**
 * Self-hosted zkLogin salt — avoids Mysten's whitelisted-client-ID requirement.
 * Same user (JWT sub) always gets the same salt for a given master secret.
 *
 * @see https://docs.sui.io/sui-stack/zklogin-integration (HKDF salt option)
 */
import { hkdfSync } from "node:crypto";
import type { VerifiedGoogleClaims } from "@/lib/zklogin/verify-google-jwt";

function bytesToSaltString(bytes: Uint8Array): string {
  let value = BigInt(0);
  for (const byte of bytes) {
    value = (value << BigInt(8)) + BigInt(byte);
  }
  // zkLogin salt must be < 2^128; 16-byte HKDF output satisfies this.
  return value.toString();
}

export function deriveZkLoginSaltFromClaims(
  claims: VerifiedGoogleClaims,
  masterSecret: string
): string {
  if (!masterSecret || masterSecret.length < 16) {
    throw new Error(
      "SUI_ZKLOGIN_SALT_SECRET is missing or too short. Add a random 32+ char secret to .env.local."
    );
  }

  if (claims.exp && claims.exp * 1000 < Date.now()) {
    throw new Error("JWT expired — please sign in again");
  }

  const derived = hkdfSync(
    "sha256",
    masterSecret,
    `${claims.iss}${claims.aud}`,
    claims.sub,
    16
  );

  return bytesToSaltString(new Uint8Array(derived));
}