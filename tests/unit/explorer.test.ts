import { describe, it, expect } from "vitest";
import { explorerTxUrl, explorerAddressUrl, explorerObjectUrl, isRealDigest } from "@/lib/sui/explorer";

describe("explorerTxUrl", () => {
  it("builds a testnet tx URL", () => {
    const url = explorerTxUrl("ABC123");
    expect(url).toContain("suiexplorer.com/txblock/ABC123");
    expect(url).toContain("network=testnet");
  });

  it("URL-encodes the digest", () => {
    const url = explorerTxUrl("a b+c");
    expect(url).toContain("a%20b%2Bc");
  });
});

describe("explorerAddressUrl", () => {
  it("builds a testnet address URL", () => {
    const url = explorerAddressUrl("0xABCDEF");
    expect(url).toContain("suiexplorer.com/address/0xABCDEF");
    expect(url).toContain("network=testnet");
  });
});

describe("explorerObjectUrl", () => {
  it("builds a testnet object URL", () => {
    const url = explorerObjectUrl("0x123");
    expect(url).toContain("suiexplorer.com/object/0x123");
  });
});

describe("isRealDigest", () => {
  it("accepts a valid base58 Sui digest (44 chars)", () => {
    // A realistic Sui digest: base58 characters, 44 chars long
    expect(isRealDigest("GqMEyJaveFa5PLsqBaJaCDNNktXLEW1gj3DFWBL1M1Ap")).toBe(true);
  });

  it("rejects short digests", () => {
    expect(isRealDigest("0xabc123")).toBe(false);
  });

  it("rejects mock digests with ellipsis", () => {
    expect(isRealDigest("0xabcdef…xyz")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isRealDigest("")).toBe(false);
  });
});
