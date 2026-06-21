/**
 * Wallet compatibility model for the SuiShield sponsored transaction demo.
 *
 * zkLogin (Google) is the recommended passwordless path — no extension
 * required, and signing uses the exact server-prepared bytes.
 *
 * Slush is also recommended for extension-based wallets.
 *
 * Phantom has a known limitation: it cannot correctly simulate sponsored
 * transactions where gasOwner ≠ sender.
 *
 * The feature flag NEXT_PUBLIC_ALLOW_PHANTOM_SPONSORED_TX (default: false)
 * controls whether Phantom users can proceed past the compatibility warning.
 */

export type WalletCompatibility =
  | {
      level: "recommended";
      walletName: "zkLogin";
      sponsoredTransactions: true;
      message: string;
    }
  | {
      level: "recommended";
      walletName: "Slush";
      sponsoredTransactions: true;
      message: string;
    }
  | {
      level: "warning";
      walletName: "Phantom";
      sponsoredTransactions: "preview-limited";
      message: string;
    }
  | {
      level: "unknown";
      walletName: string;
      sponsoredTransactions: "untested";
      message: string;
    };

export const WALLET_NAMES = {
  ZKLOGIN_GOOGLE: "Sign in with Google",
  SLUSH: "Slush",
  PHANTOM: "Phantom",
} as const;

/** Error codes surfaced in agent logs and UI for wallet-related failures. */
export const WALLET_ERROR_CODES = {
  UNSUPPORTED_WALLET_PREVIEW: "UNSUPPORTED_WALLET_PREVIEW",
  WALLET_COMPATIBILITY_UNVERIFIED: "WALLET_COMPATIBILITY_UNVERIFIED",
  USER_CANCELLED_WALLET_SWITCH: "USER_CANCELLED_WALLET_SWITCH",
  SERVER_DRY_RUN_FAILED: "SERVER_DRY_RUN_FAILED",
  USER_SIGNATURE_REJECTED: "USER_SIGNATURE_REJECTED",
  SPONSORED_EXECUTION_FAILED: "SPONSORED_EXECUTION_FAILED",
} as const;

export type WalletErrorCode = keyof typeof WALLET_ERROR_CODES;

export function isZkLoginWallet(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("sign in with google") ||
    lower.includes("sign in with facebook") ||
    lower.includes("sign in with twitch")
  );
}

export function isSlushWallet(name: string): boolean {
  return name.toLowerCase().includes("slush");
}

export function isPhantomWallet(name: string): boolean {
  return name.toLowerCase().includes("phantom");
}

export function getWalletCompatibility(walletName: string): WalletCompatibility {
  if (!walletName) {
    return {
      level: "unknown",
      walletName: "",
      sponsoredTransactions: "untested",
      message:
        "No wallet connected. Sign in with Google (zkLogin) or connect Slush Wallet for the live gasless mint.",
    };
  }

  if (isZkLoginWallet(walletName)) {
    return {
      level: "recommended",
      walletName: "zkLogin",
      sponsoredTransactions: true,
      message:
        "zkLogin session active. No browser extension required — the server-prepared " +
        "transaction bytes are signed directly for gasless sponsorship.",
    };
  }

  if (isSlushWallet(walletName)) {
    return {
      level: "recommended",
      walletName: "Slush",
      sponsoredTransactions: true,
      message:
        "Slush fully supports Sui sponsored transactions. " +
        "The server-side dry run will be checked before requesting your signature.",
    };
  }

  if (isPhantomWallet(walletName)) {
    return {
      level: "warning",
      walletName: "Phantom",
      sponsoredTransactions: "preview-limited",
      message:
        "Phantom may incorrectly show “Not enough SUI” or “Simulation failed” for " +
        "sponsored Sui transactions, even when the sponsor gas is correctly configured " +
        "and the server-side dry run succeeds. For the most reliable gasless testnet " +
        "experience, use Slush Wallet.",
    };
  }

  return {
    level: "unknown",
    walletName,
    sponsoredTransactions: "untested",
    message:
      `Wallet “${walletName}” has not been tested with this sponsored transaction demo. ` +
      "Use simulation mode or switch to Slush Wallet for the live testnet demo.",
  };
}

/**
 * Returns true when Phantom users are allowed to proceed past the
 * compatibility warning. Default is false (Phantom blocked for safety).
 *
 * Set NEXT_PUBLIC_ALLOW_PHANTOM_SPONSORED_TX=true to enable the override
 * path (shows a warning modal with an explicit opt-in).
 */
export function isPhantomAllowed(): boolean {
  return (
    process.env.NEXT_PUBLIC_ALLOW_PHANTOM_SPONSORED_TX?.toLowerCase() === "true"
  );
}

/**
 * Returns true if this wallet can run the real sponsored mint.
 * zkLogin / Slush → always allowed.
 * Phantom → only when feature flag is true.
 * Unknown → never allowed (use simulation).
 */
export function canRunRealMintWithWallet(walletName: string): boolean {
  const compat = getWalletCompatibility(walletName);
  if (compat.level === "recommended") return true;
  if (compat.level === "warning") return isPhantomAllowed();
  return false;
}

/**
 * Returns the display label for the compatibility badge.
 * Used in Demo Lab wallet panel and TopBar.
 */
export function compatibilityBadgeLabel(compat: WalletCompatibility): string {
  switch (compat.level) {
    case "recommended":
      return compat.walletName === "zkLogin" ? "zkLogin · Gasless ready" : "Recommended";
    case "warning":
      return "Preview limitation";
    case "unknown":
      return compat.walletName ? "Compatibility unverified" : "Not connected";
  }
}
