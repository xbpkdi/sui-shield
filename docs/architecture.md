# SuiShield Architecture

## Core Principle

```
Deterministic policy + safety engine
    +
Agent workflow + reasoning trace
    +
Optional AI explanation/reporting layer
```

Financial and security decisions are never delegated to an LLM. They are deterministic, testable, and auditable.

## Layer Map

```
Browser (Next.js App Router)
├── Landing page           /
├── Dashboard shell        (sidebar + topbar + mode banner)
└── Dashboard pages        /dashboard, /gasless-policy, etc.
    └── Zustand store      Single source of truth for all UI state

Server (Next.js Route Handlers)
├── /api/rpc-health        Checks RPC endpoints without exposing credentials
└── /api/sponsor           TODO: Server-side gas sponsoring (secure signing)

Domain
├── Policy engine          Pure function — evaluatePolicy(input) → SponsorshipDecision
├── Workflow engine        runWorkflow(scenario, callbacks) → outcome
└── Sui interfaces         SuiTransactionProvider, SponsorService, RpcHealthService
```

## Data Flow

```
User action (Demo Lab)
  ↓
runWorkflow() — features/agent/workflow.ts
  ↓ emits callbacks
Zustand store updates (transactions, agentLogs, incidents, currentMode)
  ↓ React re-renders
All dashboard pages reflect new state automatically
```

## State Architecture

All pages read from `useSuiShieldStore`. Derived metrics (gasUsed, txSuccessRate, blockedDuplicates) are computed from the transaction collection — no contradictory hardcoded numbers.

See `stores/suishield.ts` for the full state interface.
