# Sui Integration Plan

## Current Status

Mock provider in place. All Sui calls go through `SuiTransactionProvider` and `SponsorService` interfaces. Replacing mock with real implementation requires no UI changes.

## Step 1: Install Packages

```bash
npm install @mysten/sui @mysten/dapp-kit
```

## Step 2: Real Transaction Provider

Replace `lib/sui/mock-provider.ts` with a `SuiClient`-backed implementation:

```ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });
```

## Step 3: Wallet Connection

Add `@mysten/dapp-kit` to the layout:

```tsx
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { ConnectButton } from "@mysten/dapp-kit";
```

## Step 4: Sponsor Service (Server-Side ONLY)

Create a Next.js Route Handler at `/api/sponsor`:

```ts
// NEVER expose private key to client
// TODO: read from secrets manager (AWS Secrets Manager, Vault, etc.)
const sponsorKeypair = Ed25519Keypair.fromSecretKey(process.env.SPONSOR_PRIVATE_KEY!);
```

## Step 5: Move Contract (Starter Badge)

Minimum contract:

```move
module suishield::starter_badge {
    public struct StarterBadge has key { id: UID }
    
    public fun mint_one(ctx: &mut TxContext) {
        // one per wallet — check ownership first in UI layer
        transfer::transfer(StarterBadge { id: object::new(ctx) }, tx_context::sender(ctx));
    }
}
```

Deploy with `sui client publish`.

## Security Checklist

- [ ] Private key never in NEXT_PUBLIC_* env vars
- [ ] Sponsor signing happens in Route Handler only
- [ ] dry_run_transaction_block called before sponsoring
- [ ] Move abort codes mapped to user-friendly messages
- [ ] Duplicate check includes on-chain badge ownership query
