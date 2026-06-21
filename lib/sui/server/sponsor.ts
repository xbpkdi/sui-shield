/**
 * Server-side only. Never import from any client component or public module.
 * The sponsor private key is loaded here and must never leave this module.
 */
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction, TransactionDataBuilder } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey, parseSerializedSignature } from "@mysten/sui/cryptography";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { verifyTransactionSignature } from "@mysten/sui/verify";
import { toZkLoginPublicIdentifier } from "@mysten/sui/zklogin";
import { fromBase64, toBase64 } from "@mysten/bcs";
import { z } from "zod";
import { createIntent, consumeIntent, INTENT_TTL_MS } from "./intent-store";
import { getActiveNetwork } from "../network";

// ─── Allowlist ────────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = ["mint_badge"] as const;
export type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

export const SponsorPrepareRequestSchema = z.object({
  wallet: z
    .string()
    .regex(/^0x[0-9a-fA-F]{1,64}$/, "Invalid Sui address format"),
  action: z.enum(ALLOWED_ACTIONS),
});

export type SponsorPrepareRequest = z.infer<typeof SponsorPrepareRequestSchema>;

export interface SponsorPrepareResult {
  txBytes: string;     // base64 — final transaction bytes (sponsor already signed these)
  sponsorSig: string;  // base64 — sponsor's signature over txBytes
  gasEstimateMist: number;
}

// ─── Config guard ────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing server environment variable: ${name}`);
  return v;
}

function isConfigured(): boolean {
  return !!(
    process.env.SUI_SPONSOR_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_BADGE_PACKAGE_ID &&
    process.env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID
  );
}

export { isConfigured as isSponsorConfigured };

// ─── Keypair loading ─────────────────────────────────────────────────────────

function loadSponsorKeypair(): Ed25519Keypair {
  const raw = requireEnv("SUI_SPONSOR_PRIVATE_KEY");
  if (raw.startsWith("suiprivkey")) {
    const { secretKey } = decodeSuiPrivateKey(raw);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }
  // Assume base64-encoded 32-byte secret key
  const bytes = fromBase64(raw);
  return Ed25519Keypair.fromSecretKey(bytes);
}

// ─── RPC client ──────────────────────────────────────────────────────────────

function makeSuiClient(): SuiJsonRpcClient {
  const network = getActiveNetwork();
  const url = process.env.SUI_RPC_PRIMARY || getJsonRpcFullnodeUrl(network);
  return new SuiJsonRpcClient({ url, network });
}

// ─── On-chain duplicate check ─────────────────────────────────────────────────

export async function checkHasBadgeOnChain(wallet: string): Promise<boolean> {
  const client = makeSuiClient();
  const packageId = requireEnv("NEXT_PUBLIC_BADGE_PACKAGE_ID");

  const objects = await client.getOwnedObjects({
    owner: wallet,
    filter: { StructType: `${packageId}::starter_badge::StarterBadge` },
    options: { showType: true },
  });

  return (objects.data?.length ?? 0) > 0;
}

// ─── Sponsor prepare ─────────────────────────────────────────────────────────

export async function prepareSponsoredMint(
  req: SponsorPrepareRequest
): Promise<SponsorPrepareResult> {
  const packageId = requireEnv("NEXT_PUBLIC_BADGE_PACKAGE_ID");
  const registryId = requireEnv("NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID");

  const keypair = loadSponsorKeypair();
  const sponsorAddr = keypair.toSuiAddress();
  const client = makeSuiClient();

  console.log(
    `[sponsor] prepare: sender=${req.wallet.slice(0, 10)}… ` +
    `sponsor=${sponsorAddr.slice(0, 10)}… ` +
    `pkg=${packageId.slice(0, 10)}… ` +
    `registry=${registryId.slice(0, 10)}…`
  );

  // Build the transaction
  const tx = new Transaction();
  tx.setSender(req.wallet);
  tx.setGasOwner(sponsorAddr);

  // starter_badge module + mint_badge function (matches deployed Move package)
  tx.moveCall({
    target: `${packageId}::starter_badge::mint_badge`,
    arguments: [tx.object(registryId)],
  });

  // Refresh sponsor gas coins immediately before building — avoids stale refs.
  // Sort descending by balance so we pick the coin most likely to cover gas.
  const { data: coins } = await client.getCoins({
    owner: sponsorAddr,
    coinType: "0x2::sui::SUI",
  });

  if (!coins || coins.length === 0) {
    throw new Error("Sponsor account has no SUI coins for gas payment");
  }

  const sorted = [...coins].sort(
    (a, b) => Number(BigInt(b.balance) - BigInt(a.balance))
  );
  const gasCoin = sorted[0];

  console.log(
    `[sponsor] gas coin: id=${gasCoin.coinObjectId.slice(0, 10)}… ` +
    `balance=${gasCoin.balance} MIST`
  );

  tx.setGasPayment([
    {
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    },
  ]);

  // Build (resolves all object references, estimates gas price + budget via dev-inspect)
  const txBytes = await tx.build({ client });

  // Explicit server-side dry run to catch Move aborts before sponsoring.
  // This is the authoritative validity check — if this passes, the transaction
  // is valid on-chain. Wallet-side simulation failures (Phantom) are a separate
  // concern and do not indicate a problem with the transaction.
  const dryRun = await client.dryRunTransactionBlock({
    transactionBlock: toBase64(txBytes),
  });

  const dryRunStatus = dryRun.effects.status.status;
  const gasEstimateMist = Number(dryRun.effects.gasUsed.computationCost ?? 0);

  console.log(
    `[sponsor] dry run: status=${dryRunStatus} gasEst=${gasEstimateMist} MIST ` +
    `txLen=${txBytes.length}B`
  );

  if (dryRunStatus !== "success") {
    const err = dryRun.effects.status.error ?? "Dry run failed";
    const abortMatch = err.match(/MoveAbort\([^,]+,\s*(\d+)\)/);
    const code = abortMatch ? parseInt(abortMatch[1], 10) : undefined;
    throw Object.assign(new Error(err), { moveAbortCode: code, isDryRun: true });
  }

  // Sponsor signs the final transaction bytes.
  // The user wallet will sign the same bytes; both signatures must be over
  // the identical txBytes for execution to succeed.
  const { signature: sponsorSig } = await keypair.signTransaction(txBytes);

  console.log(`[sponsor] sponsor signed: ok`);

  return {
    txBytes: toBase64(txBytes),
    sponsorSig,
    gasEstimateMist,
  };
}

// ─── Two-phase sponsored mint ────────────────────────────────────────────────

export const PrepareMintRequestSchema = z.object({
  action: z.literal("mint_starter_badge"),
  sender: z
    .string()
    .regex(/^0x[0-9a-fA-F]{1,64}$/, "Invalid Sui address format"),
});

export type PrepareMintRequest = z.infer<typeof PrepareMintRequestSchema>;

export interface PrepareMintIntentResult {
  txBytes: string;      // base64 — final transaction bytes (not yet sponsor-signed)
  intentId: string;     // UUID — server stores the bytes keyed by this ID
  sponsorAddress: string;
  gasEstimateMist: number;
  expiresAt: string;    // ISO-8601 — client can show a countdown
}

export async function prepareMintIntent(
  req: PrepareMintRequest
): Promise<PrepareMintIntentResult> {
  const packageId = requireEnv("NEXT_PUBLIC_BADGE_PACKAGE_ID");
  const registryId = requireEnv("NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID");

  const keypair = loadSponsorKeypair();
  const sponsorAddr = keypair.toSuiAddress();
  const client = makeSuiClient();

  console.log(
    `[sponsor/prepare] sender=${req.sender.slice(0, 10)}… ` +
    `sponsor=${sponsorAddr.slice(0, 10)}… ` +
    `pkg=${packageId.slice(0, 10)}…`
  );

  const tx = new Transaction();
  tx.setSender(req.sender);
  tx.setGasOwner(sponsorAddr);

  tx.moveCall({
    target: `${packageId}::starter_badge::mint_badge`,
    arguments: [tx.object(registryId)],
  });

  const { data: coins } = await client.getCoins({
    owner: sponsorAddr,
    coinType: "0x2::sui::SUI",
  });

  if (!coins || coins.length === 0) {
    throw new Error("Sponsor account has no SUI coins for gas payment");
  }

  const sorted = [...coins].sort(
    (a, b) => Number(BigInt(b.balance) - BigInt(a.balance))
  );
  const gasCoin = sorted[0];

  console.log(
    `[sponsor/prepare] gas coin: id=${gasCoin.coinObjectId.slice(0, 10)}… ` +
    `balance=${gasCoin.balance} MIST`
  );

  tx.setGasPayment([
    {
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    },
  ]);

  // Build resolves all objects, fetches gas price, computes gas budget via dev-inspect.
  const txBytes = await tx.build({ client });
  const txBytesBase64 = toBase64(txBytes);

  // Dry-run the exact final bytes. Must pass before we issue the intentId.
  console.log(`[sponsor/prepare] dry-running ${txBytes.length} bytes…`);
  const dryRun = await client.dryRunTransactionBlock({
    transactionBlock: txBytesBase64,
  });

  const dryRunStatus = dryRun.effects.status.status;
  const gasEstimateMist = Number(dryRun.effects.gasUsed.computationCost ?? 0);

  console.log(`[sponsor/prepare] dry-run status=${dryRunStatus} gasEst=${gasEstimateMist} MIST`);

  if (dryRunStatus !== "success") {
    const err = dryRun.effects.status.error ?? "Dry run failed";
    const abortMatch = err.match(/MoveAbort\([^,]+,\s*(\d+)\)/);
    const code = abortMatch ? parseInt(abortMatch[1], 10) : undefined;
    throw Object.assign(new Error(err), { moveAbortCode: code, isDryRun: true });
  }

  // Log decoded tx fields to prove gas owner = sponsor.
  const decoded = decodePreparedTx(txBytesBase64);
  console.log(
    `[sponsor/prepare] decoded: sender=${decoded.sender} ` +
    `gasOwner=${decoded.gasOwner} ` +
    `gasBudget=${decoded.gasBudget} ` +
    `gasPrice=${decoded.gasPrice} ` +
    `paymentCoins=${decoded.gasPaymentObjectIds.join(",")} ` +
    `target=${decoded.moveCallTarget} ` +
    `sharedObj=${decoded.sharedObjectId}`
  );

  const intentId = createIntent(req.sender, txBytesBase64);
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS).toISOString();

  return { txBytes: txBytesBase64, intentId, sponsorAddress: sponsorAddr, gasEstimateMist, expiresAt };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface ExecuteSponsoredMintParams {
  intentId: string;
  transactionBytes: string; // base64 — must match stored bytes exactly
  userSignature: string;    // base64 compound signature from wallet
}

export interface ExecuteSponsoredMintResult {
  digest: string;
  explorerUrl: string;
  gasUsed: {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
  };
}

export async function executeSponsoredMint(
  params: ExecuteSponsoredMintParams
): Promise<ExecuteSponsoredMintResult> {
  const storedIntent = consumeIntent(params.intentId);
  if (!storedIntent) {
    throw Object.assign(new Error("Intent not found or expired — prepare a new transaction"), {
      isIntentError: true,
    });
  }

  // ── Byte integrity: reject if wallet modified the prepared bytes ──────────
  const receivedBytes = fromBase64(params.transactionBytes);
  const storedBytes = fromBase64(storedIntent.txBytes);
  const bytesMatch =
    receivedBytes.length === storedBytes.length &&
    receivedBytes.every((b, i) => b === storedBytes[i]);

  if (!bytesMatch) {
    throw Object.assign(
      new Error(
        "Transaction bytes were modified after preparation — sponsor signature would be invalid. " +
        "Use Slush wallet, which preserves sponsored transaction bytes."
      ),
      { isBytesMismatch: true }
    );
  }

  const client = makeSuiClient();

  // ── User signature verification ───────────────────────────────────────────
  try {
    await resolveUserSignerAddress(
      storedBytes,
      params.userSignature,
      storedIntent.sender,
      client
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verification failed";
    console.error("[sponsor/execute] signature verification failed:", msg);
    throw Object.assign(new Error(`Invalid user signature: ${msg}`), {
      isSignatureError: true,
    });
  }

  // ── Sponsor signs the SAME bytes the user already signed ─────────────────
  const keypair = loadSponsorKeypair();

  console.log(
    `[sponsor/execute] signing intentId=${params.intentId.slice(0, 8)}… ` +
    `sender=${storedIntent.sender.slice(0, 10)}…`
  );

  const { signature: sponsorSig } = await keypair.signTransaction(storedBytes);

  // ── Execute with [senderSig, sponsorSig] — Sui spec: sender comes first ──
  const network = getActiveNetwork();
  console.log(`[sponsor/execute] submitting to ${network}…`);
  let result;
  try {
    result = await client.executeTransactionBlock({
      transactionBlock: storedIntent.txBytes,
      signature: [params.userSignature, sponsorSig],
      options: { showEffects: true, showEvents: true },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "RPC execution failed";
    console.error("[sponsor/execute] RPC error:", msg);
    throw new Error(`Sui ${network} rejected transaction: ${msg}`);
  }

  if (result.effects?.status.status !== "success") {
    const errMsg = result.effects?.status.error ?? "On-chain execution failed";
    const abortMatch = errMsg.match(/MoveAbort\([^,]+,\s*(\d+)\)/);
    const code = abortMatch ? parseInt(abortMatch[1], 10) : undefined;
    throw Object.assign(new Error(errMsg), { moveAbortCode: code });
  }

  console.log(`[sponsor/execute] confirmed: digest=${result.digest}`);

  const explorerBase =
    process.env.NEXT_PUBLIC_SUI_EXPLORER_BASE_URL ?? "https://suiexplorer.com";
  const explorerUrl = `${explorerBase}/txblock/${result.digest}?network=${network}`;

  return {
    digest: result.digest,
    explorerUrl,
    gasUsed: {
      computationCost: result.effects?.gasUsed?.computationCost ?? "0",
      storageCost: result.effects?.gasUsed?.storageCost ?? "0",
      storageRebate: result.effects?.gasUsed?.storageRebate ?? "0",
    },
  };
}

/**
 * Resolves the signer address from a user signature.
 * zkLogin: match addressSeed → address (skip flaky RPC pre-verify; chain validates on execute).
 * Ed25519 / wallet: full cryptographic verify via RPC.
 */
async function resolveUserSignerAddress(
  txBytes: Uint8Array,
  userSignature: string,
  expectedSender: string,
  client: SuiJsonRpcClient
): Promise<string> {
  const parsed = parseSerializedSignature(userSignature);
  const normalizedExpected = normalizeSuiAddress(expectedSender);

  if (parsed.signatureScheme === "ZkLogin" && "zkLogin" in parsed) {
    const { iss, addressSeed } = parsed.zkLogin as {
      iss: string;
      addressSeed: bigint;
    };
    const candidates = [
      toZkLoginPublicIdentifier(addressSeed, iss, { legacyAddress: false }).toSuiAddress(),
      toZkLoginPublicIdentifier(addressSeed, iss, { legacyAddress: true }).toSuiAddress(),
    ];
    const match = candidates.find((a) => normalizeSuiAddress(a) === normalizedExpected);
    if (!match) {
      throw new Error(
        `zkLogin signature does not match prepared sender (expected ${expectedSender})`
      );
    }
    console.log(`[sponsor/execute] zkLogin sender verified: ${match.slice(0, 10)}…`);
    return match;
  }

  const pubKey = await verifyTransactionSignature(txBytes, userSignature, {
    client,
    address: expectedSender,
  });
  const signerAddress = pubKey.toSuiAddress();
  if (normalizeSuiAddress(signerAddress) !== normalizedExpected) {
    throw new Error(
      `Signature signer (${signerAddress}) does not match prepared sender (${expectedSender})`
    );
  }
  return signerAddress;
}

// ─── Decoded transaction diagnostic ─────────────────────────────────────────

export interface DecodedTxInfo {
  sender: string | null;
  gasOwner: string | null;
  gasBudget: string | null;
  gasPrice: string | null;
  gasPaymentObjectIds: string[];
  moveCallTarget: string | null;
  sharedObjectId: string | null;
}

export function decodePreparedTx(txBytesBase64: string): DecodedTxInfo {
  const bytes = fromBase64(txBytesBase64);
  const data = TransactionDataBuilder.fromBytes(bytes);

  let moveCallTarget: string | null = null;
  for (const cmd of data.commands) {
    if ("MoveCall" in cmd && cmd.MoveCall) {
      const mc = cmd.MoveCall;
      moveCallTarget = `${mc.package}::${mc.module}::${mc.function}`;
      break;
    }
  }

  let sharedObjectId: string | null = null;
  for (const input of data.inputs) {
    if (
      "Object" in input &&
      input.Object &&
      typeof input.Object === "object" &&
      "SharedObject" in input.Object
    ) {
      const shared = (input.Object as { SharedObject: { objectId: string } }).SharedObject;
      sharedObjectId = shared.objectId;
      break;
    }
  }

  return {
    sender: data.sender,
    gasOwner: data.gasData.owner ?? null,
    gasBudget: data.gasData.budget !== null ? String(data.gasData.budget) : null,
    gasPrice: data.gasData.price !== null ? String(data.gasData.price) : null,
    gasPaymentObjectIds: (data.gasData.payment ?? []).map((p) => p.objectId),
    moveCallTarget,
    sharedObjectId,
  };
}

// ─── Diagnostic dry-run (no execution, no key exposure) ──────────────────────

export interface DiagnoseResult {
  configured: boolean;
  sender: string;
  sponsorAddress: string;
  packageId: string;
  registryId: string;
  gasCoinId: string;
  gasCoinBalance: string;
  txBytesLength: number;
  dryRunStatus: string;
  dryRunError?: string;
  moveAbortCode?: number;
  gasEstimateMist: number;
  alreadyClaimed: boolean;
}

export async function diagnoseSponsoredMint(
  senderWallet: string
): Promise<DiagnoseResult> {
  const packageId = requireEnv("NEXT_PUBLIC_BADGE_PACKAGE_ID");
  const registryId = requireEnv("NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID");

  const keypair = loadSponsorKeypair();
  const sponsorAddr = keypair.toSuiAddress();
  const client = makeSuiClient();

  const alreadyClaimed = await checkHasBadgeOnChain(senderWallet);

  const tx = new Transaction();
  tx.setSender(senderWallet);
  tx.setGasOwner(sponsorAddr);
  tx.moveCall({
    target: `${packageId}::starter_badge::mint_badge`,
    arguments: [tx.object(registryId)],
  });

  const { data: coins } = await client.getCoins({
    owner: sponsorAddr,
    coinType: "0x2::sui::SUI",
  });

  if (!coins || coins.length === 0) {
    return {
      configured: true,
      sender: senderWallet,
      sponsorAddress: sponsorAddr,
      packageId,
      registryId,
      gasCoinId: "(none)",
      gasCoinBalance: "0",
      txBytesLength: 0,
      dryRunStatus: "error",
      dryRunError: "Sponsor account has no SUI coins",
      gasEstimateMist: 0,
      alreadyClaimed,
    };
  }

  const sorted = [...coins].sort(
    (a, b) => Number(BigInt(b.balance) - BigInt(a.balance))
  );
  const gasCoin = sorted[0];

  tx.setGasPayment([
    {
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    },
  ]);

  const txBytes = await tx.build({ client });

  const dryRun = await client.dryRunTransactionBlock({
    transactionBlock: toBase64(txBytes),
  });

  const dryRunStatus = dryRun.effects.status.status;
  const err = dryRun.effects.status.error;
  const abortMatch = err?.match(/MoveAbort\([^,]+,\s*(\d+)\)/);
  const code = abortMatch ? parseInt(abortMatch[1], 10) : undefined;

  return {
    configured: true,
    sender: senderWallet,
    sponsorAddress: sponsorAddr,
    packageId,
    registryId,
    gasCoinId: gasCoin.coinObjectId,
    gasCoinBalance: gasCoin.balance,
    txBytesLength: txBytes.length,
    dryRunStatus,
    dryRunError: err ?? undefined,
    moveAbortCode: code,
    gasEstimateMist: Number(dryRun.effects.gasUsed.computationCost ?? 0),
    alreadyClaimed,
  };
}
