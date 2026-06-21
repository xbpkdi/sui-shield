import { describe, expect, it } from "vitest";
import { deriveZkLoginSalt } from "@/lib/zklogin/salt-server";

/** Minimal JWT-shaped payload for testing (not a real signature). */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

const MASTER = "test-master-secret-at-least-32-chars!!";
const CLIENT_ID = "123.apps.googleusercontent.com";

describe("deriveZkLoginSalt", () => {
  it("returns a stable decimal salt for the same sub", () => {
    const token = fakeJwt({
      sub: "user-abc",
      aud: CLIENT_ID,
      iss: "https://accounts.google.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const a = deriveZkLoginSalt(token, MASTER, CLIENT_ID);
    const b = deriveZkLoginSalt(token, MASTER, CLIENT_ID);
    expect(a).toBe(b);
    expect(BigInt(a) < BigInt(2) ** BigInt(128)).toBe(true);
  });

  it("returns different salts for different users", () => {
    const base = {
      aud: CLIENT_ID,
      iss: "https://accounts.google.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const a = deriveZkLoginSalt(fakeJwt({ ...base, sub: "user-a" }), MASTER, CLIENT_ID);
    const b = deriveZkLoginSalt(fakeJwt({ ...base, sub: "user-b" }), MASTER, CLIENT_ID);
    expect(a).not.toBe(b);
  });

  it("rejects wrong client ID", () => {
    const token = fakeJwt({
      sub: "user",
      aud: "wrong.apps.googleusercontent.com",
      iss: "https://accounts.google.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(() => deriveZkLoginSalt(token, MASTER, CLIENT_ID)).toThrow("audience");
  });

  it("rejects expired JWT", () => {
    const token = fakeJwt({
      sub: "user",
      aud: CLIENT_ID,
      iss: "https://accounts.google.com",
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    expect(() => deriveZkLoginSalt(token, MASTER, CLIENT_ID)).toThrow("expired");
  });
});