import { describe, it, expect } from "vitest";
import { SponsorPrepareRequestSchema } from "@/lib/sui/server/sponsor";

describe("SponsorPrepareRequestSchema", () => {
  it("accepts a valid mint_badge request", () => {
    const result = SponsorPrepareRequestSchema.safeParse({
      wallet: "0x9a2b3c4d5e6f7890abcdef1234567890abcdef12",
      action: "mint_badge",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a full 64-hex Sui address", () => {
    const result = SponsorPrepareRequestSchema.safeParse({
      wallet: "0x" + "a".repeat(64),
      action: "mint_badge",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown action", () => {
    const result = SponsorPrepareRequestSchema.safeParse({
      wallet: "0xabc123",
      action: "transfer_coin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an address without 0x prefix", () => {
    const result = SponsorPrepareRequestSchema.safeParse({
      wallet: "9a2b3c4d5e6f7890abcdef1234567890abcdef12",
      action: "mint_badge",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing wallet", () => {
    const result = SponsorPrepareRequestSchema.safeParse({ action: "mint_badge" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing action", () => {
    const result = SponsorPrepareRequestSchema.safeParse({ wallet: "0xabc" });
    expect(result.success).toBe(false);
  });

  it("rejects empty body", () => {
    const result = SponsorPrepareRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects null body", () => {
    const result = SponsorPrepareRequestSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});
