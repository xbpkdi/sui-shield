# SuiShield Gasless Agent

Application-layer gas sponsorship and transaction recovery for Sui dApps.

SuiShield sits between a dApp's sponsorship request and the Sui network. It evaluates policy, simulates the transaction, checks for duplicates, monitors RPC health, and makes a controlled, auditable decision — all with a deterministic policy engine and a full agent reasoning trace.

---

## Current Implementation Status

| Feature | Status |
|---|---|
| Dashboard shell (sidebar, topbar, mode banner) | ✅ Functional |
| Shared Zustand state | ✅ Functional |
| Deterministic policy engine | ✅ Functional |
| Agent workflow engine (6 scenarios) | ✅ Functional |
| Demo Lab | ✅ Functional |
| Landing page | ✅ Functional |
| Overview Dashboard | ✅ Functional |
| Gasless Policy page (live controls) | ✅ Functional |
| RPC Health page | ✅ Functional (simulated data) |
| Transaction Guardian | ✅ Functional (from shared state) |
| Incidents page | ✅ Functional (from Demo Lab events) |
| Agent Logs page | ✅ Functional (from workflow events) |
| Settings page | ✅ UI only |
| Projects page | ✅ Functional (single project) |
| Policy engine unit tests | ✅ Passing |
| Playwright E2E tests | ✅ Configured |
| Real Sui testnet integration | 🔜 Interfaces ready, mock in place |
| Wallet connection (@mysten/dapp-kit) | 🔜 Architecture prepared |
| Server-side sponsor signing | 🔜 TODO markers in place |
| Move contract (Starter Badge) | 🔜 Interface defined |

---

## What is Real vs. Simulated

**Real (fully functional):**
- Policy engine evaluation logic
- Zustand shared state (all pages derive data from one source)
- Demo Lab workflow scenarios (drive state changes consistently)
- Agent event emission (all logs come from real workflow events)
- Incident creation from Demo Lab events
- Transaction Guardian reading from shared state
- Policy controls affecting Demo Lab outcomes immediately

**Simulated (clearly labeled):**
- Sui transaction execution (mock provider, no real testnet calls)
- Transaction digests (generated randomly, labeled "Simulation")
- RPC latency data (simulated with jitter, labeled "Simulated")
- Sponsor budget deductions (derived from mock gas estimates)

---

## Architecture

```
app/
  (dashboard)/         Next.js route group — all dashboard pages
    layout.tsx         Sidebar + TopBar + ProtectiveModeBanner
    dashboard/         Overview metrics
    gasless-policy/    Live policy controls (updates Zustand)
    rpc-health/        RPC endpoint monitor
    transaction-guardian/  Transaction table with agent trace
    incidents/         Incident log from Demo Lab events
    agent-logs/        Filterable OBSERVE/REASON/ACT/RESULT stream
    demo-lab/          Interactive 6-scenario simulation
    settings/          Configuration UI
  api/
    rpc-health/        Server-side RPC health check (protects credentials)
  page.tsx             Landing page

features/
  policy/engine.ts     Deterministic policy evaluator (testable, no React)
  agent/workflow.ts    6-scenario workflow state machine

stores/
  suishield.ts         Zustand store — single source of truth

lib/
  sui/interfaces.ts    SuiTransactionProvider, SponsorService interfaces
  sui/mock-provider.ts Mock Sui provider (clearly labeled)
  rpc/health-service.ts RpcHealthService interface + mock
  schemas/             Zod schemas for all models
```

---

## Local Setup

```bash
cd suishield
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

See `.env.example` for all variables with descriptions.

**Critical:** `SPONSOR_PRIVATE_KEY` must never be set in any environment variable accessible to the browser. Use a server-side secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.).

---

## Commands

```bash
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check (no emit)
npm run format       # Prettier
npm run test         # Vitest unit tests
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright E2E tests
```

---

## Page Map

| URL | Page | Notes |
|---|---|---|
| `/` | Landing page | No auth required |
| `/dashboard` | Overview Dashboard | KPIs derived from shared state |
| `/projects` | Projects | Single project, multi-project ready |
| `/gasless-policy` | Policy Controls | Live — affects Demo Lab immediately |
| `/rpc-health` | RPC Health Monitor | Simulated endpoints |
| `/transaction-guardian` | Transaction Guardian | From shared state, with agent trace |
| `/incidents` | Incidents | Populated by Demo Lab events |
| `/agent-logs` | Agent Logs | Auto-populated, filterable |
| `/demo-lab` | Demo Lab | 6 interactive scenarios |
| `/settings` | Settings | UI only |

---

## Agent Workflow

```
OBSERVE  →  REASON  →  ACT  →  RESULT
```

Every meaningful step emits an `AgentEvent` to the Zustand store. The workflow engine (`features/agent/workflow.ts`) is the only place that drives state changes during a transaction.

The agent is goal-directed: it will attempt recovery (RPC failover, queue intent) before stopping, within strict configured limits.

**Scenario adapters:**
All 6 Demo Lab scenarios are adapters around the same `runWorkflow()` function. They share the same callback interface, emit the same event types, and produce consistent state updates.

---

## Policy Engine

The policy engine (`features/policy/engine.ts`) is a pure, deterministic function:

```ts
evaluatePolicy(input: PolicyInput): SponsorshipDecision
```

Evaluation order:
1. Network mode restrictions (Protective Mode → queue)
2. RPC availability (no RPC → switch_rpc recovery)
3. Action allowlist check
4. Duplicate protection window
5. Per-transaction gas limit
6. Manual approval threshold
7. Daily budget
8. Wallet hourly quota
9. Simulation result

Returns one of: `approve | reject | manual_review | recover`

Policy controls on the Gasless Policy page update Zustand state immediately, affecting the next Demo Lab run.

---

## Sui Integration Plan

The codebase is structured for Sui integration with minimal refactoring:

1. **Install packages:** `npm install @mysten/sui @mysten/dapp-kit`
2. **Replace mock provider** in `lib/sui/mock-provider.ts` with real `SuiClient` calls
3. **Implement sponsor service** server-side (Next.js Route Handler), reading private key from secrets manager
4. **Wire wallet connection** using `@mysten/dapp-kit`'s `ConnectButton` and `useCurrentAccount`
5. **Deploy Move contract** for Starter Badge (see `docs/sui-integration.md`)

The `SuiTransactionProvider`, `SponsorService`, and `RpcHealthService` interfaces are defined in `lib/sui/interfaces.ts`. Mock implementations exist in `lib/sui/mock-provider.ts`.

---

## Security Notes

- **No private keys in frontend code.** The sponsor service interface is designed for server-side signing only.
- **No private keys in public env vars.** All sensitive config uses `SUI_*` (no `NEXT_PUBLIC_` prefix) vars that are server-only.
- **Server-side RPC health.** The `/api/rpc-health` route protects private endpoint credentials from the browser.
- **TODO markers** exist in `lib/sui/interfaces.ts` where secure signing must be implemented before production use.
- **Mock activity is labeled.** The UI always shows "Simulation" when activity is not a real testnet transaction.

---

## Testing

```bash
# Unit tests (policy engine, utility functions)
npm run test

# Type checking
npm run typecheck

# E2E tests (requires dev server running or uses webServer config)
npm run test:e2e
```

Unit tests cover the deterministic policy engine:
- Allowed action approval
- Action not in allowlist
- Duplicate detection
- Gas over limit
- Daily budget exceeded
- Wallet quota exceeded
- Network mode restriction (Protective Mode)
- Simulation failed
- RPC unavailable

---

## Deployment

Standard Next.js deployment:

```bash
npm run build
npm run start
# or deploy to Vercel/similar
```

Required env vars for production: see `.env.example`

Security checklist before production:
- [ ] Move sponsor signing to a dedicated server-side service with HSM or secrets manager
- [ ] Remove all mock providers
- [ ] Enable production RPC endpoints (server-side only)
- [ ] Review allowedActions for your specific use case
- [ ] Set appropriate daily budget and wallet quotas
- [ ] Configure monitoring/alerting for incidents

---

## Roadmap

1. Real Sui testnet integration (wallet connection, sponsored transaction)
2. Move package deployment (Starter Badge contract)
3. Server-side sponsor signing service
4. Real RPC health monitoring (replace mock)
5. Multi-project support
6. Notification service (Slack/Discord webhook)
7. Budget refill workflows
8. Incident export (PDF post-mortem)
9. On-chain policy version reference
10. Mainnet readiness review
