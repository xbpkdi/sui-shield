# Sui Integration

## Status

Live on Sui **devnet** (default for hackathon demo). Two-phase sponsored mint implemented and verified.

Contract IDs are set via `NEXT_PUBLIC_BADGE_PACKAGE_ID` and `NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID` in `.env.local`.

**Testnet deployment (reference):**
- Package: `0xc9d007fec4abfd2a59992815e5b9a288fa33957f36ba5069d281a740999d95a2`
- BadgeRegistry (shared): `0x63bed274c025a8a0c87281ca7ac94125f871338bdf9f0c14bec3b799fc76d152`

Move function: `starter_badge::starter_badge::mint_badge`

## Two-Phase Sponsored Mint Flow

```
Browser                         Server
  │                               │
  │  POST /api/sponsor/prepare    │
  │  { action, sender }   ────►   │ Build tx (setSender=user, setGasOwner=sponsor)
  │                               │ Dry-run on Sui RPC
  │                               │ Store intent (TTL 5 min, one-time use)
  │  ◄────  { txBytes,            │
  │           intentId,           │
  │           sponsorAddress,     │
  │           gasEstimateMist }   │
  │                               │
  │  wallet.signTransaction       │  ← exact bytes, no rebuild
  │  → { bytes, signature }       │
  │                               │
  │  POST /api/sponsor/execute    │
  │  { intentId,          ────►   │ consumeIntent(intentId)
  │    transactionBytes,          │ Byte comparison (exact match)
  │    userSignature }            │ verifyTransactionSignature(storedBytes, sig)
  │                               │ keypair.signTransaction(storedBytes)
  │                               │ executeTransactionBlock([userSig, sponsorSig])
  │  ◄────  { digest,             │
  │           explorerUrl }       │
```

### Security Properties

| Property | How it's enforced |
|---|---|
| User always sees prepared bytes | `signedBytes === txBytesBase64` check in client |
| Server signs same bytes user signed | `consumeIntent` returns stored bytes; sponsor signs those |
| Sponsor key never sent to browser | `SUI_SPONSOR_PRIVATE_KEY` is server-only (no `NEXT_PUBLIC_` prefix) |
| No double-spend on sponsor gas | Intent consumed on first use (one-time read) |
| Invalid transactions rejected before signing | Dry run runs before intent is stored |
| Byte substitution attack prevented | Both byte comparison AND `verifyTransactionSignature` |

## Wallet Compatibility

### Slush (Recommended)

Slush correctly implements `sui:signTransaction` and returns the exact bytes it was given.
The demo works end-to-end with Slush.

### Phantom (Preview Limitation)

Phantom cannot correctly simulate sponsored Sui transactions where `gasOwner ≠ sender`.
It shows "Not enough SUI" or "Simulation failed" in the wallet preview — this is a Phantom
preview display bug, not a transaction error. The transaction bytes are provably valid
(server-side dry run passes, `gasOwner` decoded as sponsor address).

**Proof from diagnostic output:**
```
sender:         0x1234...abcdef   ← user wallet   ✅
gasOwner:       0x6789ba08...     ← sponsor        ✅
gasPaymentCoin: 0xda57700c...     ← sponsor's coin ✅
gasBudget:      6,850,548 MIST
Dry Run Status: success ✅
Net gas cost:   4,872,428 MIST
```

**Feature flag:** `NEXT_PUBLIC_ALLOW_PHANTOM_SPONSORED_TX=false` (default) blocks Phantom for real mints. Set to `true` to show a developer override modal. Simulation scenarios always work.

## API Routes

### POST /api/sponsor/prepare

**Request:**
```json
{ "action": "mint_starter_badge", "sender": "0x..." }
```

**Response 200:**
```json
{
  "txBytes": "<base64 BCS>",
  "intentId": "<uuid>",
  "sponsorAddress": "0x6789ba08...",
  "gasEstimateMist": 4872428,
  "expiresAt": "2026-06-18T22:30:00.000Z"
}
```

**Errors:**
- `409` — badge already claimed on-chain
- `422` — dry run failed (Move abort, insufficient objects, etc.)
- `503` — sponsor not configured

### POST /api/sponsor/execute

**Request:**
```json
{
  "intentId": "<uuid>",
  "transactionBytes": "<base64 — must match prepare bytes exactly>",
  "userSignature": "<base64 compound sig>"
}
```

**Response 200:**
```json
{ "digest": "...", "explorerUrl": "https://...", "gasUsed": { "computationCost": "...", ... } }
```

**Errors:**
- `410` — intent expired or already consumed
- `400` — bytes mismatch or signature invalid
- `422` — Move abort (deterministic error, no retry)

## Intent Store

Server-side in-memory store (`lib/sui/server/intent-store.ts`).

- Keyed by UUID (returned as `intentId`)
- TTL: 5 minutes
- One-time use: consumed on read (prevents replay)
- Survives Next.js hot-module replacement via `globalThis`

## Move Contract

```
move/starter_badge/sources/starter_badge.move

module starter_badge::starter_badge {
    public struct StarterBadge has key { ... }
    public struct BadgeRegistry has key { ... }

    public fun mint_badge(registry: &mut BadgeRegistry, ctx: &mut TxContext)
}
```

Deploy: `sui client publish move/starter_badge --network testnet`

## Environment Variables

```
# Server-side only — never NEXT_PUBLIC_
SUI_SPONSOR_PRIVATE_KEY=suiprivkey1...

# Browser-safe package IDs
NEXT_PUBLIC_BADGE_PACKAGE_ID=0xc9d007...
NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID=0x63bed2...
NEXT_PUBLIC_SUI_NETWORK=testnet

# Feature flag — controls Phantom warning modal
NEXT_PUBLIC_ALLOW_PHANTOM_SPONSORED_TX=false
```

## Diagnostic Script

`scripts/diagnose-mint.mjs` — verifies the sponsored transaction end-to-end from
the command line, decodes the prepared transaction bytes, and prints a formatted
proof that `sender=user`, `gasOwner=sponsor`, and the dry run succeeds.

```bash
node scripts/diagnose-mint.mjs <wallet-address>
```
