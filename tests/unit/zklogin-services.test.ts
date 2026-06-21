import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchZkLoginProof } from "@/lib/zklogin/services";

describe("zklogin services", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchZkLoginProof posts prove payload", async () => {
    const proof = { proofPoints: { a: [], b: [], c: [] }, issBase64Details: { value: "x", indexMod4: 0 }, headerBase64: "h" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => proof,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchZkLoginProof({
      jwt: "jwt",
      extendedEphemeralPublicKey: "pk",
      maxEpoch: 100,
      jwtRandomness: "rand",
      salt: "salt",
    });

    expect(result).toEqual(proof);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.maxEpoch).toBe("100");
    expect(body.keyClaimName).toBe("sub");
    expect(fetchMock.mock.calls[0][0]).toBe("https://prover.mystenlabs.com/v1");
  });

  it("uses dev prover on devnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUI_NETWORK", "devnet");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        proofPoints: { a: [], b: [], c: [] },
        issBase64Details: { value: "x", indexMod4: 0 },
        headerBase64: "h",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchZkLoginProof({
      jwt: "jwt",
      extendedEphemeralPublicKey: "pk",
      maxEpoch: 1,
      jwtRandomness: "rand",
      salt: "salt",
    });

    expect(fetchMock.mock.calls[0][0]).toBe("https://prover-dev.mystenlabs.com/v1");
  });
});