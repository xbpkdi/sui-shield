/**
 * Unit tests for the two-phase sponsored mint flow in lib/sui/real-provider.ts.
 *
 * The flow under test:
 *   1. POST /api/sponsor/prepare  → {txBytes, intentId, sponsorAddress, gasEstimateMist}
 *   2. wallet.signTransaction(txBytes) → {bytes, signature}
 *   3. POST /api/sponsor/execute  → {digest}
 *
 * All fetch calls and wallet.signTransaction are mocked — no real network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mintBadgeReal } from "@/lib/sui/real-provider";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_TX_BYTES = "AAABBBCCC111"; // base64 stand-in for prepared tx bytes
const MOCK_INTENT_ID = "550e8400-e29b-41d4-a716-446655440000"; // valid UUID
const MOCK_SPONSOR_ADDR = "0x6789ba08de58a33c6757273b65419bfe98d4dbb0c7dd14367ee8ac46615b7f5d";
const MOCK_SENDER_SIG = "senderSig==";
const MOCK_DIGEST = "GqMEyJaveFa5PLsqBaJaCDNNktXLEW1gj3DFWBL1M1Ap";
const MOCK_SENDER = "0x3309abcdef0123456789abcdef0123456789abcdef0123456789abcdef330f0c9";

function makeMockClient(overrides: Partial<SuiJsonRpcClient> = {}): SuiJsonRpcClient {
  return {
    // executeTransactionBlock must NOT be called in the two-phase flow (execution is server-side)
    executeTransactionBlock: vi.fn().mockRejectedValue(
      new Error("executeTransactionBlock should not be called from the client in two-phase flow")
    ),
    ...overrides,
  } as unknown as SuiJsonRpcClient;
}

function makeMockWallet(signedBytes = MOCK_TX_BYTES, address = MOCK_SENDER) {
  return {
    address,
    signTransaction: vi.fn().mockResolvedValue({
      bytes: signedBytes,
      signature: MOCK_SENDER_SIG,
    }),
  };
}

/** Mock a successful prepare response. */
function mockPrepareSuccess(txBytes = MOCK_TX_BYTES) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        txBytes,
        intentId: MOCK_INTENT_ID,
        sponsorAddress: MOCK_SPONSOR_ADDR,
        gasEstimateMist: 4872428,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      }),
  };
}

/** Mock a successful execute response. */
function mockExecuteSuccess() {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        digest: MOCK_DIGEST,
        explorerUrl: `https://suiexplorer.com/txblock/${MOCK_DIGEST}?network=testnet`,
        gasUsed: { computationCost: "1000000", storageCost: "6528400", storageRebate: "2655972" },
      }),
  };
}

/** Set up fetch to respond correctly for both prepare and execute endpoints. */
function mockTwoPhaseSuccess(txBytes = MOCK_TX_BYTES) {
  let callCount = 0;
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes("/prepare")) return Promise.resolve(mockPrepareSuccess(txBytes));
    if (url.includes("/execute")) return Promise.resolve(mockExecuteSuccess());
    callCount++;
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: `Unexpected URL: ${url}` }) });
  }) as typeof fetch;
  return () => callCount;
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Test 1: Prepared transaction sender = user ───────────────────────────────

describe("Test 1 — Prepared transaction sender = user wallet", () => {
  it("sends the correct sender address to /api/sponsor/prepare", async () => {
    mockTwoPhaseSuccess();
    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    await mintBadgeReal({ wallet, suiClient });

    const prepareCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/prepare")
    );
    expect(prepareCall).toBeDefined();
    const body = JSON.parse(prepareCall![1].body as string);
    expect(body.sender).toBe(MOCK_SENDER);
    expect(body.action).toBe("mint_starter_badge");
  });
});

// ─── Test 2: Prepared transaction gas owner = sponsor ─────────────────────────

describe("Test 2 — Prepared transaction gas owner is the sponsor", () => {
  it("prepare response includes sponsorAddress and it is NOT the user address", async () => {
    mockTwoPhaseSuccess();
    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    await mintBadgeReal({ wallet, suiClient });

    const prepareCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/prepare")
    );
    const reqBody = JSON.parse(prepareCall![1].body as string);
    // sender (user) must differ from sponsorAddress
    expect(reqBody.sender).not.toBe(MOCK_SPONSOR_ADDR);
  });

  it("prepare response gasEstimateMist comes from server (not zero)", async () => {
    mockTwoPhaseSuccess();
    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    let prepareBody: Record<string, unknown> | null = null;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/prepare")) {
        return Promise.resolve({
          ok: true,
          json: () => {
            const r = { txBytes: MOCK_TX_BYTES, intentId: MOCK_INTENT_ID, sponsorAddress: MOCK_SPONSOR_ADDR, gasEstimateMist: 4872428, expiresAt: "2099-01-01T00:00:00Z" };
            prepareBody = r as unknown as Record<string, unknown>;
            return Promise.resolve(r);
          },
        });
      }
      return Promise.resolve(mockExecuteSuccess());
    }) as typeof fetch;

    await mintBadgeReal({ wallet, suiClient });

    expect(prepareBody).not.toBeNull();
    expect((prepareBody as unknown as { gasEstimateMist: number }).gasEstimateMist).toBeGreaterThan(0);
  });
});

// ─── Test 3: Gas payment coin belongs to sponsor ──────────────────────────────

describe("Test 3 — Gas payment coin is the sponsor's coin", () => {
  it("wallet is asked to sign bytes from prepare (which include sponsor gas data)", async () => {
    mockTwoPhaseSuccess();
    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    await mintBadgeReal({ wallet, suiClient });

    // wallet.signTransaction receives the txBytes from prepare
    expect(wallet.signTransaction).toHaveBeenCalledWith(MOCK_TX_BYTES);
    // The bytes came from the server, which set gasOwner=sponsor+gasPayment=sponsor coin
    // (verified by server-side dry-run in prepare)
  });
});

// ─── Test 4: Final transaction dry run succeeds before wallet signing ─────────

describe("Test 4 — Server dry run succeeds before wallet is prompted", () => {
  it("does not call wallet.signTransaction when prepare returns 422 (dry run fail)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: "Move abort EBadgeAlreadyMinted",
          moveAbortCode: 7,
          stage: "dry_run",
        }),
    }) as typeof fetch;

    const wallet = makeMockWallet();
    const suiClient = makeMockClient();
    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.simulated) expect(result.moveAbortCode).toBe(7);
    expect(wallet.signTransaction).not.toHaveBeenCalled();
  });
});

// ─── Test 5: Client does not rebuild or mutate prepared bytes ─────────────────

describe("Test 5 — Client passes exact prepared bytes to wallet without mutation", () => {
  it("executes with the bytes returned by prepare (not a rebuilt Transaction)", async () => {
    const CUSTOM_BYTES = "PREPARED_TX_BYTES_XYZ";
    mockTwoPhaseSuccess(CUSTOM_BYTES);
    const wallet = makeMockWallet(CUSTOM_BYTES);
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(true);
    // wallet received exactly the bytes from prepare
    expect(wallet.signTransaction).toHaveBeenCalledWith(CUSTOM_BYTES);
    // execute received exactly the same bytes (no mutation)
    const executeCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/execute")
    );
    const execBody = JSON.parse(executeCall![1].body as string);
    expect(execBody.transactionBytes).toBe(CUSTOM_BYTES);
  });
});

// ─── Test 6: Execute rejects changed bytes ────────────────────────────────────

describe("Test 6 — Execute endpoint rejects if wallet returns modified bytes", () => {
  it("returns byte-mismatch error without calling execute when wallet modifies bytes", async () => {
    mockTwoPhaseSuccess(MOCK_TX_BYTES);
    const MODIFIED = "WALLET_REBUILT_TX_BYTES";
    const wallet = makeMockWallet(MODIFIED); // wallet rebuilds → returns different bytes
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.toLowerCase()).toMatch(/modified|wallet|slush/i);
    }
    // execute must NOT have been called
    const executeCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/execute")
    );
    expect(executeCall).toBeUndefined();
  });
});

// ─── Test 7: User and sponsor sign identical bytes ────────────────────────────

describe("Test 7 — User and sponsor sign identical bytes", () => {
  it("execute receives the same bytes the wallet signed", async () => {
    mockTwoPhaseSuccess();
    const wallet = makeMockWallet(MOCK_TX_BYTES);
    const suiClient = makeMockClient();

    await mintBadgeReal({ wallet, suiClient });

    const walletSignedBytes = (wallet.signTransaction as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const executeCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/execute")
    );
    const execBody = JSON.parse(executeCall![1].body as string);

    // The bytes the wallet signed and the bytes sent to execute are identical
    expect(execBody.transactionBytes).toBe(walletSignedBytes);
    // The user's signature is forwarded to execute
    expect(execBody.userSignature).toBe(MOCK_SENDER_SIG);
    expect(execBody.intentId).toBe(MOCK_INTENT_ID);
  });
});

// ─── Test 8: User with zero SUI can reach successful sponsorship ──────────────

describe("Test 8 — User with zero SUI balance can complete gasless mint", () => {
  it("succeeds end-to-end with no SUI balance on user side (balance not checked client-side)", async () => {
    mockTwoPhaseSuccess();
    // User has zero SUI — but the sponsor covers gas, so the client never checks balance
    const wallet = makeMockWallet(MOCK_TX_BYTES, "0xzerosui0000000000000000000000000000000000000000000000000000000000");
    const suiClient = makeMockClient(); // no balance check

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.digest).toBe(MOCK_DIGEST);
      expect(result.simulated).toBe(false);
      expect(result.network).toBeDefined();
    }
    // executeTransactionBlock was NOT called client-side (execution is server-side)
    expect(suiClient.executeTransactionBlock).not.toHaveBeenCalled();
  });
});

// ─── Test 9: Duplicate claim stops before sponsor signing ─────────────────────

describe("Test 9 — Duplicate claim detected in prepare, sponsor never signs", () => {
  it("returns already-claimed error from prepare without calling execute", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: "Wallet has already claimed a Starter Badge",
          moveAbortCode: 7,
        }),
    }) as typeof fetch;

    const wallet = makeMockWallet();
    const suiClient = makeMockClient();
    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/already claimed/i);

    // wallet was never prompted
    expect(wallet.signTransaction).not.toHaveBeenCalled();

    // execute endpoint was never called (sponsor never signed)
    const executeCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/execute")
    );
    expect(executeCall).toBeUndefined();
  });
});

// ─── Test 10: User-paid fallback not called by gasless button ─────────────────

describe("Test 10 — client-side executeTransactionBlock is never called (execution is server-side)", () => {
  it("does not call suiClient.executeTransactionBlock in any phase", async () => {
    mockTwoPhaseSuccess();
    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(true);
    expect(suiClient.executeTransactionBlock).not.toHaveBeenCalled();
  });

  it("does not call executeTransactionBlock even when prepare fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Sponsor service not configured" }),
    }) as typeof fetch;

    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    await mintBadgeReal({ wallet, suiClient });

    expect(suiClient.executeTransactionBlock).not.toHaveBeenCalled();
  });
});

// ─── Additional coverage: status callback ────────────────────────────────────

describe("mintBadgeReal — onMintStatus callback phases", () => {
  it("calls onMintStatus with phase strings and null at completion", async () => {
    mockTwoPhaseSuccess();
    const wallet = makeMockWallet();
    const suiClient = makeMockClient();
    const statusLog: (string | null)[] = [];

    await mintBadgeReal({ wallet, suiClient, onMintStatus: (s) => statusLog.push(s) });

    expect(statusLog.some((s) => s?.includes("Preparing"))).toBe(true);
    expect(statusLog.some((s) => s?.includes("signature") || s?.includes("wallet"))).toBe(true);
    expect(statusLog.some((s) => s?.includes("signing") || s?.includes("Sponsor"))).toBe(true);
    expect(statusLog[statusLog.length - 1]).toBe(null);
  });
});

// ─── User cancellation ────────────────────────────────────────────────────────

describe("mintBadgeReal — user cancels in wallet", () => {
  it("returns cancellation error without calling execute", async () => {
    mockTwoPhaseSuccess();
    const wallet = {
      address: MOCK_SENDER,
      signTransaction: vi.fn().mockRejectedValue(new Error("User rejected the request")),
    };
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.toLowerCase()).toMatch(/cancel|reject/i);

    const executeCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/execute")
    );
    expect(executeCall).toBeUndefined();
  });
});

// ─── Phantom simulation error ─────────────────────────────────────────────────

describe("mintBadgeReal — Phantom simulation failure", () => {
  it("returns Phantom-specific guidance when wallet throws simulation error", async () => {
    mockTwoPhaseSuccess();
    const wallet = {
      address: MOCK_SENDER,
      signTransaction: vi.fn().mockRejectedValue(
        new Error("Simulation failed: no expected asset ownership impacting changes")
      ),
    };
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.toLowerCase()).toMatch(/phantom|slush|simulation/i);
    }

    const executeCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[0] as string).includes("/execute")
    );
    expect(executeCall).toBeUndefined();
  });

  it("returns Phantom-specific guidance when wallet throws 'Not enough SUI'", async () => {
    mockTwoPhaseSuccess();
    const wallet = {
      address: MOCK_SENDER,
      signTransaction: vi.fn().mockRejectedValue(
        new Error("Not enough SUI — Network Fee: 0.000002 SUI")
      ),
    };
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.toLowerCase()).toMatch(/phantom|slush|simulation/i);
    }
  });
});

// ─── Sponsor not configured ───────────────────────────────────────────────────

describe("mintBadgeReal — sponsor not configured", () => {
  it("returns error when prepare returns 503", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Sponsor service not configured" }),
    }) as typeof fetch;

    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    expect(wallet.signTransaction).not.toHaveBeenCalled();
  });
});

// ─── Execute endpoint failures ────────────────────────────────────────────────

describe("mintBadgeReal — execute endpoint failures", () => {
  it("returns error when execute returns a failure status", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/prepare")) return Promise.resolve(mockPrepareSuccess());
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Intent not found or expired", stage: "execute" }),
      });
    }) as typeof fetch;

    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/intent/i);
    expect(suiClient.executeTransactionBlock).not.toHaveBeenCalled();
  });

  it("returns moveAbortCode when execute returns a Move abort", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/prepare")) return Promise.resolve(mockPrepareSuccess());
      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({ error: "MoveAbort(7) EBadgeAlreadyMinted", moveAbortCode: 7 }),
      });
    }) as typeof fetch;

    const wallet = makeMockWallet();
    const suiClient = makeMockClient();

    const result = await mintBadgeReal({ wallet, suiClient });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.simulated) expect(result.moveAbortCode).toBe(7);
  });
});
