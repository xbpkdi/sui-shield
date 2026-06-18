import { describe, it, expect } from "vitest";
import { evaluatePolicy, checkDuplicate, countWalletTxLastHour } from "@/features/policy/engine";
import type { SponsorshipPolicy, TransactionIntent } from "@/types";

const basePolicy: SponsorshipPolicy = {
  allowedActions: ["mint_badge", "claim_reward"],
  maxGasPerTx: 0.05,
  dailyBudget: 10,
  maxTransactionsPerWalletPerHour: 5,
  duplicateProtection: true,
  duplicateWindowSeconds: 30,
  simulationRequired: true,
  pauseOnInstability: true,
  manualApprovalThreshold: 0.1,
};

const baseInput = {
  action: "mint_badge",
  wallet: "0xabc",
  gasEstimate: 0.004,
  policy: basePolicy,
  dailyGasUsed: 1.0,
  walletTxCountLastHour: 0,
  isDuplicate: false,
  simulationPassed: true,
  currentMode: "healthy" as const,
  rpcAvailable: true,
};

// ─── Policy engine tests ────────────────────────────────────────────────────

describe("evaluatePolicy", () => {
  it("approves allowed action that passes all checks", () => {
    const result = evaluatePolicy(baseInput);
    expect(result.type).toBe("approve");
    expect(result.reasonCode).toBe("POLICY_PASSED");
  });

  it("rejects action not in allowlist", () => {
    const result = evaluatePolicy({ ...baseInput, action: "withdraw_funds" });
    expect(result.type).toBe("reject");
    expect(result.reasonCode).toBe("ACTION_NOT_ALLOWED");
  });

  it("rejects duplicate request when protection enabled", () => {
    const result = evaluatePolicy({ ...baseInput, isDuplicate: true });
    expect(result.type).toBe("reject");
    expect(result.reasonCode).toBe("DUPLICATE_DETECTED");
  });

  it("requires manual review when gas exceeds limit", () => {
    const result = evaluatePolicy({ ...baseInput, gasEstimate: 0.08 });
    expect(result.type).toBe("manual_review");
    expect(result.reasonCode).toBe("GAS_EXCEEDS_LIMIT");
  });

  it("rejects when daily budget would be exceeded", () => {
    const result = evaluatePolicy({ ...baseInput, dailyGasUsed: 9.998, gasEstimate: 0.004 });
    expect(result.type).toBe("reject");
    expect(result.reasonCode).toBe("DAILY_BUDGET_EXCEEDED");
  });

  it("rejects when wallet quota is exceeded", () => {
    const result = evaluatePolicy({ ...baseInput, walletTxCountLastHour: 5 });
    expect(result.type).toBe("reject");
    expect(result.reasonCode).toBe("WALLET_QUOTA_EXCEEDED");
  });

  it("queues intent in protective mode with pauseOnInstability", () => {
    const result = evaluatePolicy({ ...baseInput, currentMode: "protective" });
    expect(result.type).toBe("recover");
    if (result.type === "recover") {
      expect(result.strategy).toBe("queue");
      expect(result.reasonCode).toBe("PROTECTIVE_MODE_QUEUE");
    }
  });

  it("rejects in error mode", () => {
    const result = evaluatePolicy({ ...baseInput, currentMode: "error" });
    expect(result.type).toBe("reject");
    expect(result.reasonCode).toBe("SYSTEM_ERROR_MODE");
  });

  it("triggers rpc recovery when no rpc available", () => {
    const result = evaluatePolicy({ ...baseInput, rpcAvailable: false });
    expect(result.type).toBe("recover");
    if (result.type === "recover") {
      expect(result.strategy).toBe("switch_rpc");
    }
  });

  it("rejects failed simulation when simulation is required", () => {
    const result = evaluatePolicy({ ...baseInput, simulationPassed: false });
    expect(result.type).toBe("reject");
    expect(result.reasonCode).toBe("SIMULATION_FAILED");
  });

  it("approves even without simulation when not required", () => {
    const policy = { ...basePolicy, simulationRequired: false };
    const result = evaluatePolicy({ ...baseInput, policy, simulationPassed: false });
    expect(result.type).toBe("approve");
  });

  it("ignores duplicate when duplicate protection is disabled", () => {
    const policy = { ...basePolicy, duplicateProtection: false };
    const result = evaluatePolicy({ ...baseInput, policy, isDuplicate: true });
    expect(result.type).toBe("approve");
  });
});

// ─── Duplicate detection tests ──────────────────────────────────────────────

describe("checkDuplicate", () => {
  function makeTx(wallet: string, action: string, ageMs: number): TransactionIntent {
    return {
      id: "tx-1",
      wallet,
      action,
      status: "confirmed",
      gasEstimate: 0.004,
      risk: "low",
      decision: "approve",
      reasonCode: "POLICY_PASSED",
      reasonText: "",
      rpcId: "rpc-1",
      digest: null,
      createdAt: new Date(Date.now() - ageMs).toISOString(),
      updatedAt: new Date(Date.now() - ageMs).toISOString(),
    };
  }

  it("detects duplicate within window", () => {
    const txs = [makeTx("0xabc", "mint_badge", 10_000)]; // 10s ago
    expect(checkDuplicate(txs, "0xabc", "mint_badge", 30)).toBe(true);
  });

  it("no duplicate outside window", () => {
    const txs = [makeTx("0xabc", "mint_badge", 60_000)]; // 60s ago
    expect(checkDuplicate(txs, "0xabc", "mint_badge", 30)).toBe(false);
  });

  it("no duplicate for different wallet", () => {
    const txs = [makeTx("0xabc", "mint_badge", 10_000)];
    expect(checkDuplicate(txs, "0xdef", "mint_badge", 30)).toBe(false);
  });

  it("no duplicate for different action", () => {
    const txs = [makeTx("0xabc", "mint_badge", 10_000)];
    expect(checkDuplicate(txs, "0xabc", "claim_reward", 30)).toBe(false);
  });
});

// ─── Wallet quota tests ──────────────────────────────────────────────────────

describe("countWalletTxLastHour", () => {
  function makeTx(wallet: string, ageMs: number): TransactionIntent {
    return {
      id: `tx-${ageMs}`,
      wallet,
      action: "mint_badge",
      status: "confirmed",
      gasEstimate: 0.004,
      risk: "low",
      decision: "approve",
      reasonCode: "POLICY_PASSED",
      reasonText: "",
      rpcId: "rpc-1",
      digest: null,
      createdAt: new Date(Date.now() - ageMs).toISOString(),
      updatedAt: new Date(Date.now() - ageMs).toISOString(),
    };
  }

  it("counts recent transactions for wallet", () => {
    const txs = [
      makeTx("0xabc", 10_000),
      makeTx("0xabc", 20_000),
      makeTx("0xabc", 7_000_000), // 1h 56m ago — outside window
    ];
    expect(countWalletTxLastHour(txs, "0xabc")).toBe(2);
  });

  it("returns 0 for wallet with no recent transactions", () => {
    const txs = [makeTx("0xdef", 10_000)];
    expect(countWalletTxLastHour(txs, "0xabc")).toBe(0);
  });
});
