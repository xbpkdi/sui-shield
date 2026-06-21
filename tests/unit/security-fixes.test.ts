import { describe, it, expect, beforeEach } from "vitest";
import { POST as legacySponsorPost } from "@/app/api/sponsor/route";
import { redactRpcUrl } from "@/lib/rpc/redact-url";
import {
  assertSponsorPolicyAllowed,
  resetSponsorPolicyState,
  setDailyGasUsedForTests,
} from "@/lib/sui/server/sponsor-policy";

describe("security fixes", () => {
  beforeEach(() => {
    resetSponsorPolicyState();
  });

  it("disables legacy POST /api/sponsor with 410", async () => {
    const res = await legacySponsorPost();
    expect(res.status).toBe(410);
    const body = (await res.json()) as { deprecated?: boolean };
    expect(body.deprecated).toBe(true);
  });

  it("redacts RPC URLs with path segments (API keys)", () => {
    const redacted = redactRpcUrl("https://example.quiknode.pro/SECRET_KEY/");
    expect(redacted).toBe("https://example.quiknode.pro");
    expect(redacted).not.toContain("SECRET_KEY");
  });

  it("enforces server-side duplicate window in sponsor policy", () => {
    assertSponsorPolicyAllowed({
      wallet: "0xabc",
      action: "mint_badge",
      gasEstimateMist: 1_000_000,
    });

    expect(() =>
      assertSponsorPolicyAllowed({
        wallet: "0xabc",
        action: "mint_badge",
        gasEstimateMist: 1_000_000,
      })
    ).toThrow("DUPLICATE_DETECTED");
  });

  it("rejects when daily budget would be exceeded", () => {
    setDailyGasUsedForTests(9.98);
    expect(() =>
      assertSponsorPolicyAllowed({
        wallet: "0xwallet1",
        action: "mint_badge",
        gasEstimateMist: 40_000_000,
      })
    ).toThrow("DAILY_BUDGET_EXCEEDED");
  });
});