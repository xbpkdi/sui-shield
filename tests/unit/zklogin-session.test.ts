import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  isSessionEpochPlausible,
  isSessionValid,
  MAX_EPOCH_DRIFT,
} from "@/lib/zklogin/session";
import type { ZkLoginSession } from "@/lib/zklogin/types";

function makeSession(overrides: Partial<ZkLoginSession> = {}): ZkLoginSession {
  return {
    address: "0xabc",
    ephemeralPrivateKey: "suiprivkey1qqtest",
    zkProof: {
      proofPoints: { a: [], b: [], c: [] },
      issBase64Details: { value: "", indexMod4: 0 },
      headerBase64: "",
    },
    addressSeed: "1",
    maxEpoch: 127,
    salt: "1",
    jwt: "jwt",
    randomness: "1",
    network: "devnet",
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

describe("zkLogin session validation", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUI_NETWORK", "devnet");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts plausible devnet maxEpoch near current epoch", () => {
    expect(isSessionEpochPlausible(makeSession({ maxEpoch: 127 }), 125)).toBe(true);
  });

  it("rejects testnet maxEpoch used on devnet", () => {
    expect(isSessionEpochPlausible(makeSession({ maxEpoch: 1139 }), 125)).toBe(false);
  });

  it("rejects expired maxEpoch", () => {
    expect(isSessionEpochPlausible(makeSession({ maxEpoch: 120 }), 125)).toBe(false);
  });

  it("allows drift up to MAX_EPOCH_DRIFT", () => {
    const current = 100;
    expect(
      isSessionEpochPlausible(makeSession({ maxEpoch: current + MAX_EPOCH_DRIFT }), current)
    ).toBe(true);
    expect(
      isSessionEpochPlausible(makeSession({ maxEpoch: current + MAX_EPOCH_DRIFT + 1 }), current)
    ).toBe(false);
  });

  it("isSessionValid checks network and epoch together", () => {
    const session = makeSession({ network: "testnet", maxEpoch: 1139 });
    expect(isSessionValid(session, 125)).toBe(false);
    expect(isSessionValid(makeSession(), 125)).toBe(true);
  });
});