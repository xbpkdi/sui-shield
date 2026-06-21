export const APP_VERSION = "0.1.0";
export const APP_NAME = "SuiShield";
export const APP_SUBTITLE = "Gasless Agent";

export const GITHUB_HANDLE = "xbpkdi";
export const GITHUB_URL = `https://github.com/${GITHUB_HANDLE}`;

export const MAX_RETRY_ATTEMPTS = 3;
export const RPC_TIMEOUT_MS = 5000;
export const DUPLICATE_WINDOW_DEFAULT_SECONDS = 30;
export const DEFAULT_DAILY_BUDGET_SUI = 10;
export const DEFAULT_MAX_GAS_PER_TX = 0.05;
export const DEFAULT_WALLET_QUOTA = 10;

export const RETRYABLE_ERROR_CLASSES = [
  "rpc_timeout",
  "rpc_unavailable",
  "network_degraded",
] as const;

export const NON_RETRYABLE_ERROR_CLASSES = [
  "move_abort",
  "user_rejection",
  "policy_denied",
  "budget_exceeded",
  "duplicate_detected",
  "unknown_transaction_state",
] as const;

export const BADGE_ACTION = "mint_badge";

export const MODE_LABELS: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  protective: "Protective Mode",
  recovering: "Recovering",
  error: "Error",
};

export const PHASE_LABELS = {
  OBSERVE: "OBSERVE",
  REASON: "REASON",
  ACT: "ACT",
  RESULT: "RESULT",
} as const;
