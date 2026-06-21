import { describe, expect, it } from "vitest";
import { deriveZkLoginSaltFromClaims } from "@/lib/zklogin/salt-server";

const MASTER = "test-master-secret-at-least-32-chars!!";
const CLIENT_ID = "123.apps.googleusercontent.com";

const baseClaims = {
  aud: CLIENT_ID,
  iss: "https://accounts.google.com",
  exp: Math.floor(Date.now() / 1000) + 3600,
} as const;

describe("deriveZkLoginSaltFromClaims", () => {
  it("returns a stable decimal salt for the same sub", () => {
    const claims = { ...baseClaims, sub: "user-abc" };
    const a = deriveZkLoginSaltFromClaims(claims, MASTER);
    const b = deriveZkLoginSaltFromClaims(claims, MASTER);
    expect(a).toBe(b);
    expect(BigInt(a) < BigInt(2) ** BigInt(128)).toBe(true);
  });

  it("returns different salts for different users", () => {
    const a = deriveZkLoginSaltFromClaims({ ...baseClaims, sub: "user-a" }, MASTER);
    const b = deriveZkLoginSaltFromClaims({ ...baseClaims, sub: "user-b" }, MASTER);
    expect(a).not.toBe(b);
  });

  it("rejects expired JWT", () => {
    expect(() =>
      deriveZkLoginSaltFromClaims(
        { ...baseClaims, sub: "user", exp: Math.floor(Date.now() / 1000) - 60 },
        MASTER
      )
    ).toThrow("expired");
  });
});