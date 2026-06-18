import type {
  SponsorshipPolicy,
  AppMode,
  SponsorshipDecision,
  TransactionIntent,
} from "@/types";

export interface PolicyInput {
  action: string;
  wallet: string;
  gasEstimate: number;
  policy: SponsorshipPolicy;
  dailyGasUsed: number;
  walletTxCountLastHour: number;
  isDuplicate: boolean;
  simulationPassed: boolean | null;
  currentMode: AppMode;
  rpcAvailable: boolean;
}

/**
 * Deterministic policy engine.
 * All financial and security decisions are made here — never in an LLM.
 * Returns a typed SponsorshipDecision with a reason code.
 */
export function evaluatePolicy(input: PolicyInput): SponsorshipDecision {
  const {
    action,
    gasEstimate,
    policy,
    dailyGasUsed,
    walletTxCountLastHour,
    isDuplicate,
    simulationPassed,
    currentMode,
    rpcAvailable,
  } = input;

  // 1. Network mode restrictions
  if (currentMode === "protective" && policy.pauseOnInstability) {
    return { type: "recover", strategy: "queue", reasonCode: "PROTECTIVE_MODE_QUEUE" };
  }
  if (currentMode === "error") {
    return { type: "reject", reasonCode: "SYSTEM_ERROR_MODE" };
  }

  // 2. RPC availability
  if (!rpcAvailable) {
    return { type: "recover", strategy: "switch_rpc", reasonCode: "NO_RPC_AVAILABLE" };
  }

  // 3. Action allowlist
  if (!policy.allowedActions.includes(action)) {
    return { type: "reject", reasonCode: "ACTION_NOT_ALLOWED" };
  }

  // 4. Duplicate protection
  if (policy.duplicateProtection && isDuplicate) {
    return { type: "reject", reasonCode: "DUPLICATE_DETECTED" };
  }

  // 5. Gas limit per transaction
  if (gasEstimate > policy.maxGasPerTx) {
    return { type: "manual_review", reasonCode: "GAS_EXCEEDS_LIMIT" };
  }

  // 6. Manual approval threshold
  if (gasEstimate >= policy.manualApprovalThreshold) {
    return { type: "manual_review", reasonCode: "MANUAL_APPROVAL_THRESHOLD" };
  }

  // 7. Daily budget
  if (dailyGasUsed + gasEstimate > policy.dailyBudget) {
    return { type: "reject", reasonCode: "DAILY_BUDGET_EXCEEDED" };
  }

  // 8. Wallet hourly quota
  if (walletTxCountLastHour >= policy.maxTransactionsPerWalletPerHour) {
    return { type: "reject", reasonCode: "WALLET_QUOTA_EXCEEDED" };
  }

  // 9. Simulation requirement
  if (policy.simulationRequired && simulationPassed === false) {
    return { type: "reject", reasonCode: "SIMULATION_FAILED" };
  }

  // All checks passed
  return { type: "approve", reasonCode: "POLICY_PASSED" };
}

export const REASON_CODE_MESSAGES: Record<string, string> = {
  POLICY_PASSED: "All policy checks passed. Action whitelisted, simulation succeeded.",
  ACTION_NOT_ALLOWED: "This action is not included in the sponsorship allowlist.",
  DUPLICATE_DETECTED:
    "Identical intent from the same wallet detected within the duplicate protection window.",
  GAS_EXCEEDS_LIMIT: "Estimated gas exceeds the configured per-transaction limit.",
  MANUAL_APPROVAL_THRESHOLD: "Gas cost exceeds manual approval threshold. Requires sign-off.",
  DAILY_BUDGET_EXCEEDED: "Sponsoring this transaction would exceed today's daily budget.",
  WALLET_QUOTA_EXCEEDED: "This wallet has reached the maximum transactions per hour.",
  SIMULATION_FAILED: "Transaction simulation returned an error. Sponsorship denied.",
  PROTECTIVE_MODE_QUEUE:
    "System is in Protective Mode. Intent queued for replay when network stabilizes.",
  SYSTEM_ERROR_MODE: "System is in Error mode. All sponsorship is suspended.",
  NO_RPC_AVAILABLE: "No healthy RPC endpoint available. Attempting failover.",
};

/**
 * Count recent transactions from a given wallet in the last hour.
 */
export function countWalletTxLastHour(transactions: TransactionIntent[], wallet: string): number {
  const oneHourAgo = Date.now() - 3_600_000;
  return transactions.filter(
    (t) => t.wallet === wallet && new Date(t.createdAt).getTime() > oneHourAgo
  ).length;
}

/**
 * Check if a duplicate intent exists within the configured window.
 */
export function checkDuplicate(
  transactions: TransactionIntent[],
  wallet: string,
  action: string,
  windowSeconds: number
): boolean {
  const windowMs = windowSeconds * 1000;
  const cutoff = Date.now() - windowMs;
  return transactions.some(
    (t) =>
      t.wallet === wallet &&
      t.action === action &&
      new Date(t.createdAt).getTime() > cutoff &&
      t.status !== "rejected"
  );
}
