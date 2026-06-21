/**
 * Client-side real Sui integration — two-phase sponsored mint.
 *
 * Phase 1: POST /api/sponsor/prepare  → {txBytes, intentId}
 * Phase 2: wallet signs txBytes (user wallet, no rebuild)
 * Phase 3: POST /api/sponsor/execute  → {digest, explorerUrl}
 *
 * The sponsor private key never leaves the server. Execution happens
 * server-side after the server verifies byte integrity and the user signature.
 */
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { SponsoredMintResult } from "./interfaces";
import { getActiveNetwork, type SuiNetwork } from "./network";

export interface WalletSigner {
  /** Sign a base64 transaction via the connected wallet. Returns base64 bytes + signature. */
  signTransaction(txBytesBase64: string): Promise<{ bytes: string; signature: string }>;
  address: string;
}

/** Safe diagnostic info returned by the prepare endpoint after a successful dry run. */
export interface DryRunInfo {
  passed: boolean;
  gasEstimateMist: number;
  sponsorAddress: string;
  network: SuiNetwork;
}

export interface MintBadgeRealParams {
  wallet: WalletSigner;
  /** Kept for hasClaimedBadgeOnChain; execution is now server-side. */
  suiClient: SuiJsonRpcClient;
  /**
   * Fired at each phase so the UI can show a meaningful status string.
   * Called with null when the flow completes (success or failure).
   */
  onMintStatus?: (status: string | null) => void;
  /**
   * Fired after the prepare endpoint returns successfully with the dry-run result.
   * Use this to display the server dry-run status before prompting the wallet.
   */
  onDryRunComplete?: (info: DryRunInfo) => void;
}

export async function mintBadgeReal(
  params: MintBadgeRealParams
): Promise<SponsoredMintResult> {
  const { wallet, onMintStatus, onDryRunComplete } = params;

  // ── Phase 1: Server builds + dry-runs, stores intent, returns bytes ───────
  onMintStatus?.("Preparing sponsored transaction…");

  const prepRes = await fetch("/api/sponsor/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "mint_starter_badge", sender: wallet.address }),
  });

  if (!prepRes.ok) {
    onMintStatus?.(null);
    const body = await prepRes.json().catch(() => ({})) as Record<string, unknown>;
    const error = typeof body.error === "string" ? body.error : "Sponsorship preparation failed";
    const moveAbortCode =
      typeof body.moveAbortCode === "number" ? body.moveAbortCode : undefined;
    return { ok: false, error, moveAbortCode, simulated: false };
  }

  const prep = (await prepRes.json()) as {
    txBytes: string;
    intentId: string;
    sponsorAddress: string;
    gasEstimateMist: number;
  };

  const { txBytes: txBytesBase64, intentId } = prep;

  // Notify UI of prepare success so it can display the dry-run result.
  onDryRunComplete?.({
    passed: true,
    gasEstimateMist: prep.gasEstimateMist,
    sponsorAddress: prep.sponsorAddress,
    network: getActiveNetwork(),
  });

  // ── Phase 2: Wallet signs the exact bytes returned by prepare ─────────────
  // CRITICAL: Both the user and the sponsor must sign the IDENTICAL bytes.
  // The wallet must not rebuild the transaction (use sui:signTransaction v2 path).
  onMintStatus?.("Waiting for wallet signature…");

  let senderSig: string;
  let signedBytes: string;
  try {
    const signed = await wallet.signTransaction(txBytesBase64);
    senderSig = signed.signature;
    signedBytes = signed.bytes;
  } catch (err: unknown) {
    onMintStatus?.(null);
    const msg = err instanceof Error ? err.message : "Wallet signing failed";
    const msgLower = msg.toLowerCase();

    if (
      msgLower.includes("reject") ||
      msgLower.includes("cancel") ||
      msgLower.includes("denied") ||
      msgLower.includes("user refused")
    ) {
      return { ok: false, error: "Transaction signing cancelled by user", simulated: false };
    }

    // Phantom fails to simulate sponsored transactions (gasOwner ≠ sender).
    if (
      msgLower.includes("simulation") ||
      msgLower.includes("no expected asset") ||
      msgLower.includes("failed to simulate") ||
      msgLower.includes("not enough sui") ||
      msgLower.includes("insufficient")
    ) {
      return {
        ok: false,
        error:
          "Wallet cannot simulate this sponsored (gasless) transaction. " +
          "Phantom has limited support for Sui sponsored transactions where gas is paid by a third party. " +
          "Please use Slush wallet, which fully supports Sui gasless minting.",
        simulated: false,
      };
    }

    return { ok: false, error: msg, simulated: false };
  }

  // ── Byte integrity guard ──────────────────────────────────────────────────
  // If the wallet rebuilt the transaction (legacy signTransactionBlock path),
  // the bytes will differ and the server will reject in execute. Catch early.
  if (signedBytes !== txBytesBase64) {
    onMintStatus?.(null);
    return {
      ok: false,
      error:
        "Wallet returned modified transaction bytes — server will reject this signature. " +
        "Please use Slush wallet, which preserves sponsored transaction bytes exactly.",
      simulated: false,
    };
  }

  // ── Phase 3: Server verifies signature, sponsor-signs, executes ──────────
  onMintStatus?.("Sponsor signing…");

  const execRes = await fetch("/api/sponsor/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intentId,
      transactionBytes: signedBytes,
      userSignature: senderSig,
    }),
  });

  onMintStatus?.(null);

  if (!execRes.ok) {
    const body = await execRes.json().catch(() => ({})) as Record<string, unknown>;
    const error = typeof body.error === "string" ? body.error : "Transaction execution failed";
    const moveAbortCode =
      typeof body.moveAbortCode === "number" ? body.moveAbortCode : undefined;
    return { ok: false, error, moveAbortCode, simulated: false };
  }

  const exec = (await execRes.json()) as { digest: string };

  return {
    ok: true,
    digest: exec.digest,
    network: getActiveNetwork(),
    simulated: false,
  };
}

/** Check on-chain whether a wallet already holds a Starter Badge. */
export async function hasClaimedBadgeOnChain(
  suiClient: SuiJsonRpcClient,
  wallet: string
): Promise<boolean> {
  const packageId = process.env.NEXT_PUBLIC_BADGE_PACKAGE_ID;
  if (!packageId) return false;

  try {
    const objects = await suiClient.getOwnedObjects({
      owner: wallet,
      filter: { StructType: `${packageId}::starter_badge::StarterBadge` },
      options: { showType: true },
    });
    return (objects.data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
