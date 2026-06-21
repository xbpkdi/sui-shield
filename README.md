# SuiShield Gasless Agent

**Sui Overflow 2026** — Application-layer gas sponsorship and transaction recovery for Sui dApps.

SuiShield sits between your dApp and the Sui network. It evaluates policy, dry-runs transactions, checks duplicates, monitors RPC health, and makes auditable sponsor decisions — with a full **OBSERVE → REASON → ACT → RESULT** agent trace.

> **Live demo path:** Sign in with Google (zkLogin) → **Demo Lab** → run **Normal Success** for a real gasless Starter Badge mint on Sui devnet.

---

## Highlights for Judges

| Capability | Status |
|---|---|
| **Real gasless mint** (two-phase sponsor signing) | ✅ Live on Sui **devnet** |
| **zkLogin** (Google OAuth, no wallet extension) | ✅ Passwordless onboarding |
| **Move contract** (`starter_badge::mint_badge`) | ✅ Deployed + on-chain duplicate guard |
| **Policy engine** (deterministic, unit-tested) | ✅ 18 policy tests |
| **Agent workflow** (6 Demo Lab scenarios) | ✅ Drives dashboard state in real time |
| **Sponsor API hardening** (same-origin + rate limit) | ✅ Production guard on `/api/sponsor/*` |
| **Premium glass UI** | ✅ Responsive dashboard + landing |
| **Unit tests** | ✅ 99 passing |

---

## 3-Minute Demo Script

Use this flow when recording or presenting:

1. **Landing** (`/`) — show agent loop + feature grid.
2. **Sign in** (`/login`) — Continue with Google → zkLogin creates Sui address (no seed phrase).
3. **Demo Lab** (`/demo-lab`) — select **Normal Success** → watch OBSERVE/REASON/ACT/RESULT steps.
4. **Real mint** — server dry-runs, you sign prepared bytes, sponsor co-signs → badge on devnet.
5. **TX Guardian** — expand row → full agent trace + Sui Explorer link.
6. **Run RPC Failure** or **Network Instability** — show Incidents + Agent Logs populate automatically.
7. **Gasless Policy** — toggle duplicate window / budget → re-run scenario to show live policy effect.

**Note:** Repeat Google accounts may hit **409 already claimed** (Move abort 7) — expected on-chain behavior. Use a fresh Google account for a second live mint.

---

## What Is Live vs Simulated

**Live (on-chain / server):**
- zkLogin session + address derivation
- Two-phase sponsored mint (`/api/sponsor/prepare` → sign → `/api/sponsor/execute`)
- Move `mint_badge` on Sui devnet
- On-chain duplicate check before prepare
- Server-side dry-run before intent storage

**Simulated (clearly labeled in UI):**
- Demo Lab scenarios except **Normal Success** with zkLogin + env configured
- RPC Health latency charts (mock jitter; real checks via `/api/rpc-health` scaffold)
- Settings notifications panel (UI preview)

---

## Tech Stack

- **Sui** — Move contract, JSON-RPC, zkLogin, sponsored transactions
- **Next.js 15** — App Router, Route Handlers
- **TypeScript** — End-to-end typed flows
- **Zustand** — Single shared dashboard state
- **Framer Motion** — Landing + dashboard motion
- **Vitest + Playwright** — Unit + E2E tests

---

## Quick Start

```bash
git clone <your-repo-url>
cd suishield
npm install
cp .env.example .env.local
# Fill in .env.local (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Minimum env for live mint (devnet)

```env
NEXT_PUBLIC_SUI_NETWORK=devnet
SUI_RPC_PRIMARY=https://fullnode.devnet.sui.io:443

# After `sui client publish` in move/starter_badge/
NEXT_PUBLIC_BADGE_PACKAGE_ID=
NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID=

# Google OAuth — origins: http://localhost:3000, redirect: http://localhost:3000/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Server-only (never NEXT_PUBLIC_)
SUI_ZKLOGIN_SALT_SECRET=   # openssl rand -base64 32
SUI_SPONSOR_PRIVATE_KEY=   # sui keytool export — fund with devnet SUI for gas
```

Set `NEXT_PUBLIC_DEMO_MODE=false` once sponsor + contract env vars are configured.

See `.env.example` for the full list.

---

## Deploy Move Contract

```bash
cd move/starter_badge
sui client publish --gas-budget 100000000
```

Copy **Package ID** and **BadgeRegistry** shared object ID into `.env.local`.

---

## Architecture

```
Browser (Next.js)
  Landing / Login / Callback (zkLogin)
  Dashboard pages ← Zustand store (single source of truth)
  Demo Lab → runWorkflow() → policy engine → mint/simulation

Server (Route Handlers)
  POST /api/sponsor/prepare   Build tx, dry-run, store intent (5 min TTL)
  POST /api/sponsor/execute   Verify bytes + user sig, sponsor sign, submit
  POST /api/zklogin/salt      Per-user salt (server secret)
  GET  /api/rpc-health        RPC check scaffold

Move (on-chain)
  starter_badge::mint_badge   One badge per wallet (abort code 7 on duplicate)
```

Detailed specs: [`docs/sui-integration.md`](docs/sui-integration.md) · [`docs/security-model.md`](docs/security-model.md)

---

## Commands

```bash
npm run dev              # Dev server :3000
npm run build            # Production build
npm run test             # Vitest (99 tests)
npm run test:e2e         # Playwright
npm run diagnose:sponsored-mint   # CLI mint diagnostic (dev)
```

---

## Security

- `SUI_SPONSOR_PRIVATE_KEY` is **server-only** — never `NEXT_PUBLIC_`
- Sponsor signs **stored bytes** after byte-match + signature verification
- Prepare endpoint dry-runs before storing intent
- Same-origin + rate limiting on sponsor APIs in production
- Mock/simulation activity is labeled in the UI

---

## Project Structure

```
app/                  Next.js routes (landing, dashboard, API)
components/           UI shell, glass cards, auth
features/
  policy/engine.ts    Deterministic policy evaluator
  agent/workflow.ts   6-scenario workflow state machine
lib/sui/
  real-provider.ts    Client two-phase mint orchestration
  server/sponsor.ts   Server signing + intent store
move/starter_badge/   Move package
stores/suishield.ts   Zustand store
tests/                Unit + E2E
```

---

## Submission

See [`SUBMISSION.md`](SUBMISSION.md) for pitch copy, judge checklist, and deployment notes.

---

## License

MIT — built for **Sui Overflow 2026**.