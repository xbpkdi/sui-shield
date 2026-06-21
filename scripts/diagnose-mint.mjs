#!/usr/bin/env node
/**
 * Diagnostic script for the sponsored mint flow.
 * Builds and dry-runs the transaction without executing it or exposing secrets.
 *
 * Usage:
 *   npm run diagnose:sponsored-mint -- --sender 0x<your-wallet-address>
 *
 * Reads .env.local automatically.
 * Prints a formatted report to stdout.
 * Exit code 0 = dry run succeeded, 1 = failure.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadDotEnv(resolve(root, ".env.local"));
loadDotEnv(resolve(root, ".env"));

// ─── Parse CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let sender = null;
for (let i = 0; i < args.length; i++) {
  if ((args[i] === "--sender" || args[i] === "-s") && args[i + 1]) {
    sender = args[i + 1];
    i++;
  }
}

if (!sender) {
  console.error("Usage: npm run diagnose:sponsored-mint -- --sender 0x<address>");
  process.exit(1);
}

if (!/^0x[0-9a-fA-F]{1,64}$/.test(sender)) {
  console.error(`Invalid address: ${sender}`);
  process.exit(1);
}

// ─── Check required env vars ─────────────────────────────────────────────────

const required = [
  "SUI_SPONSOR_PRIVATE_KEY",
  "NEXT_PUBLIC_BADGE_PACKAGE_ID",
  "NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing environment variables:");
  for (const k of missing) console.error(`  ${k}`);
  console.error("\nAdd them to .env.local and retry.");
  process.exit(1);
}

// ─── Dynamic SDK imports ─────────────────────────────────────────────────────

const { SuiJsonRpcClient, getJsonRpcFullnodeUrl } = await import(
  "@mysten/sui/jsonRpc"
);
const { Transaction, TransactionDataBuilder } = await import("@mysten/sui/transactions");
const { Ed25519Keypair } = await import("@mysten/sui/keypairs/ed25519");
const { decodeSuiPrivateKey } = await import("@mysten/sui/cryptography");
const { fromBase64, toBase64 } = await import("@mysten/bcs");

// ─── Build and dry-run ───────────────────────────────────────────────────────

const packageId = process.env.NEXT_PUBLIC_BADGE_PACKAGE_ID;
const registryId = process.env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID;
const rpcUrl =
  process.env.SUI_RPC_PRIMARY || getJsonRpcFullnodeUrl("testnet");

console.log("\n═══════════════════════════════════════════════");
console.log("  SuiShield — Sponsored Mint Diagnostic");
console.log("═══════════════════════════════════════════════\n");

console.log(`Sender:   ${sender}`);
console.log(`Package:  ${packageId}`);
console.log(`Registry: ${registryId}`);
console.log(`RPC:      ${rpcUrl}\n`);

const raw = process.env.SUI_SPONSOR_PRIVATE_KEY;
let keypair;
try {
  if (raw.startsWith("suiprivkey")) {
    const { secretKey } = decodeSuiPrivateKey(raw);
    keypair = Ed25519Keypair.fromSecretKey(secretKey);
  } else {
    keypair = Ed25519Keypair.fromSecretKey(fromBase64(raw));
  }
} catch (e) {
  console.error("Failed to load sponsor keypair:", e.message);
  process.exit(1);
}

const sponsorAddr = keypair.toSuiAddress();
console.log(`Sponsor:  ${sponsorAddr}\n`);

const client = new SuiJsonRpcClient({ url: rpcUrl, network: "testnet" });

// On-chain duplicate check
console.log("Checking on-chain duplicate…");
let alreadyClaimed = false;
try {
  const objs = await client.getOwnedObjects({
    owner: sender,
    filter: { StructType: `${packageId}::starter_badge::StarterBadge` },
    options: { showType: true },
  });
  alreadyClaimed = (objs.data?.length ?? 0) > 0;
} catch (e) {
  console.warn("  Could not check on-chain state:", e.message);
}
console.log(`  Already claimed: ${alreadyClaimed}\n`);

// Fetch sponsor gas coins
console.log("Fetching sponsor gas coins…");
let coins = [];
try {
  const res = await client.getCoins({
    owner: sponsorAddr,
    coinType: "0x2::sui::SUI",
  });
  coins = res.data ?? [];
} catch (e) {
  console.error("  Failed to fetch coins:", e.message);
  process.exit(1);
}
if (!coins.length) {
  console.error("  Sponsor has no SUI coins! Fund the sponsor wallet.");
  process.exit(1);
}
const sorted = [...coins].sort(
  (a, b) => Number(BigInt(b.balance) - BigInt(a.balance))
);
const gasCoin = sorted[0];
console.log(`  Selected coin: ${gasCoin.coinObjectId}`);
console.log(`  Balance:       ${gasCoin.balance} MIST (${(Number(gasCoin.balance) / 1e9).toFixed(6)} SUI)\n`);

// Build transaction
console.log("Building transaction…");
const tx = new Transaction();
tx.setSender(sender);
tx.setGasOwner(sponsorAddr);
tx.moveCall({
  target: `${packageId}::starter_badge::mint_badge`,
  arguments: [tx.object(registryId)],
});
tx.setGasPayment([
  {
    objectId: gasCoin.coinObjectId,
    version: gasCoin.version,
    digest: gasCoin.digest,
  },
]);

let txBytes;
try {
  txBytes = await tx.build({ client });
} catch (e) {
  console.error("  Transaction build failed:", e.message);
  process.exit(1);
}
console.log(`  Transaction bytes: ${txBytes.length} bytes\n`);

// Decode transaction bytes to verify gas owner / sender
console.log("Decoding prepared transaction bytes…");
try {
  const txData = TransactionDataBuilder.fromBytes(txBytes);

  let moveCallTarget = null;
  for (const cmd of txData.commands) {
    if (cmd.MoveCall) {
      moveCallTarget = `${cmd.MoveCall.package}::${cmd.MoveCall.module}::${cmd.MoveCall.function}`;
      break;
    }
  }

  let sharedObjectId = null;
  for (const input of txData.inputs) {
    if (input.Object && input.Object.SharedObject) {
      sharedObjectId = input.Object.SharedObject.objectId;
      break;
    }
  }

  const gasPaymentIds = (txData.gasData.payment ?? []).map((p) => p.objectId);

  console.log(`\n─── Decoded Transaction ────────────────────────`);
  console.log(`  sender:          ${txData.sender}`);
  console.log(`  gasOwner:        ${txData.gasData.owner}`);
  console.log(`  gasBudget:       ${txData.gasData.budget} MIST`);
  console.log(`  gasPrice:        ${txData.gasData.price} MIST`);
  console.log(`  gasPaymentCoin:  ${gasPaymentIds.join(", ")}`);
  console.log(`  moveCallTarget:  ${moveCallTarget}`);
  console.log(`  sharedRegistry:  ${sharedObjectId}`);

  const senderOk = txData.sender?.toLowerCase() === sender.toLowerCase();
  const gasOwnerOk = txData.gasData.owner?.toLowerCase() === sponsorAddr.toLowerCase();
  const paymentOk = gasPaymentIds.length > 0 && gasPaymentIds[0].toLowerCase() === gasCoin.coinObjectId.toLowerCase();

  console.log(`\n─── Verification ───────────────────────────────`);
  console.log(`  sender = user wallet:    ${senderOk ? "✅" : "❌"}`);
  console.log(`  gasOwner = sponsor:      ${gasOwnerOk ? "✅" : "❌"}`);
  console.log(`  gasPayment = sponsor coin: ${paymentOk ? "✅" : "❌"}`);
} catch (e) {
  console.warn("  Could not decode transaction bytes:", e.message);
}

// Dry run
console.log("\nRunning server-side dry run against testnet…");
let dryRun;
try {
  dryRun = await client.dryRunTransactionBlock({
    transactionBlock: toBase64(txBytes),
  });
} catch (e) {
  console.error("  Dry run RPC call failed:", e.message);
  process.exit(1);
}

const status = dryRun.effects.status.status;
const error = dryRun.effects.status.error;
const gasComp = dryRun.effects.gasUsed.computationCost;
const gasStor = dryRun.effects.gasUsed.storageCost;
const gasRebate = dryRun.effects.gasUsed.storageRebate;

console.log(`\n─── Dry Run Results ────────────────────────────`);
console.log(`  Status:           ${status}`);
if (error) {
  console.log(`  Error:            ${error}`);
  const abortMatch = error.match(/MoveAbort\([^,]+,\s*(\d+)\)/);
  if (abortMatch) {
    const code = parseInt(abortMatch[1], 10);
    console.log(`  Move abort code:  ${code}${code === 7 ? " (EBadgeAlreadyMinted)" : ""}`);
  }
}
console.log(`  Gas computation:  ${gasComp} MIST`);
console.log(`  Gas storage:      ${gasStor} MIST`);
console.log(`  Gas rebate:       ${gasRebate} MIST`);
console.log(`  Net gas cost:     ${Number(gasComp ?? 0) + Number(gasStor ?? 0) - Number(gasRebate ?? 0)} MIST`);

console.log(`\n─── Summary ────────────────────────────────────`);
if (status === "success") {
  console.log("  ✅ Dry run PASSED — transaction is valid on-chain");
  console.log("  The sponsored transaction bytes are correctly formed.");
  console.log("  gasOwner = sponsor (see Decoded Transaction above).");
  console.log("  If Phantom shows 'Simulation failed' or 'Not enough SUI',");
  console.log("  that is a Phantom wallet limitation — Phantom cannot simulate");
  console.log("  sponsored transactions where gasOwner ≠ sender.");
  console.log("  The transaction itself is VALID. Use Slush wallet instead.");
} else {
  console.log("  ❌ Dry run FAILED — transaction is invalid");
  if (alreadyClaimed) {
    console.log("  Note: This wallet has already claimed a badge (abort code 7).");
  }
}
console.log("════════════════════════════════════════════════\n");

process.exit(status === "success" ? 0 : 1);
