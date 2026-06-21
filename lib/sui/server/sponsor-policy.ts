/**
 * Server-side sponsor policy enforcement (in-memory).
 * Replace with Redis/DB counters for multi-instance production.
 */
import { evaluatePolicy } from "@/features/policy/engine";
import type { SponsorshipPolicy } from "@/types";
import {
  BADGE_ACTION,
  DEFAULT_DAILY_BUDGET_SUI,
  DEFAULT_MAX_GAS_PER_TX,
  DEFAULT_WALLET_QUOTA,
  DUPLICATE_WINDOW_DEFAULT_SECONDS,
} from "@/lib/constants";

const SERVER_POLICY: SponsorshipPolicy = {
  allowedActions: [BADGE_ACTION],
  maxGasPerTx: DEFAULT_MAX_GAS_PER_TX,
  dailyBudget: Number(process.env.SPONSOR_DAILY_BUDGET_SUI ?? DEFAULT_DAILY_BUDGET_SUI),
  maxTransactionsPerWalletPerHour: Number(
    process.env.SPONSOR_WALLET_HOURLY_QUOTA ?? DEFAULT_WALLET_QUOTA
  ),
  duplicateProtection: true,
  duplicateWindowSeconds: DUPLICATE_WINDOW_DEFAULT_SECONDS,
  simulationRequired: true,
  pauseOnInstability: true,
  manualApprovalThreshold: 0.1,
};

interface WalletWindow {
  count: number;
  windowStartMs: number;
}

const walletWindows = new Map<string, WalletWindow>();
const recentIntents = new Map<string, number>();

let dailyGasUsedSui = 0;
let dailyResetKey = utcDayKey();

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function resetDailyIfNeeded(): void {
  const key = utcDayKey();
  if (key !== dailyResetKey) {
    dailyResetKey = key;
    dailyGasUsedSui = 0;
  }
}

function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

function walletTxCountLastHour(wallet: string): number {
  const now = Date.now();
  const entry = walletWindows.get(wallet);
  if (!entry || now - entry.windowStartMs > 3_600_000) {
    return 0;
  }
  return entry.count;
}

function recordWalletSuccess(wallet: string): void {
  const now = Date.now();
  const entry = walletWindows.get(wallet);
  if (!entry || now - entry.windowStartMs > 3_600_000) {
    walletWindows.set(wallet, { count: 1, windowStartMs: now });
    return;
  }
  entry.count += 1;
}

function isDuplicateIntent(wallet: string, action: string): boolean {
  const key = `${wallet}:${action}`;
  const last = recentIntents.get(key);
  const now = Date.now();
  if (last && now - last < SERVER_POLICY.duplicateWindowSeconds * 1000) {
    return true;
  }
  recentIntents.set(key, now);
  return false;
}

export function assertSponsorPolicyAllowed(input: {
  wallet: string;
  action: string;
  gasEstimateMist: number;
}): void {
  resetDailyIfNeeded();

  const gasSui = mistToSui(input.gasEstimateMist);
  const decision = evaluatePolicy({
    action: input.action,
    wallet: input.wallet,
    gasEstimate: gasSui,
    policy: SERVER_POLICY,
    dailyGasUsed: dailyGasUsedSui,
    walletTxCountLastHour: walletTxCountLastHour(input.wallet),
    isDuplicate: isDuplicateIntent(input.wallet, input.action),
    simulationPassed: true,
    currentMode: "healthy",
    rpcAvailable: true,
  });

  if (decision.type !== "approve") {
    throw Object.assign(new Error(`Sponsorship denied: ${decision.reasonCode}`), {
      isPolicyDenied: true,
      reasonCode: decision.reasonCode,
    });
  }
}

export function recordSponsorGasUsed(wallet: string, gasEstimateMist: number): void {
  resetDailyIfNeeded();
  dailyGasUsedSui += mistToSui(gasEstimateMist);
  recordWalletSuccess(wallet);
}

/** Test helpers */
export function resetSponsorPolicyState(): void {
  walletWindows.clear();
  recentIntents.clear();
  dailyGasUsedSui = 0;
  dailyResetKey = utcDayKey();
}

export function setDailyGasUsedForTests(sui: number): void {
  resetDailyIfNeeded();
  dailyGasUsedSui = sui;
}