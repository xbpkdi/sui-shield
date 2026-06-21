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
├── Login / Callback       zkLogin (Google OAuth)
├── Dashboard shell        (sidebar + topbar + mode banner)
└── Dashboard pages        /dashboard, /gasless-policy, etc.
    └── Zustand store      Single source of truth for all UI state

Server (Next.js Route Handlers)
├── /api/sponsor/prepare   Build tx, dry-run, store intent
├── /api/sponsor/execute   Verify + sponsor sign + submit
├── /api/zklogin/salt      Per-user salt derivation
└── /api/rpc-health        RPC health check scaffold

Domain
├── Policy engine          Pure function — evaluatePolicy(input) → SponsorshipDecision
├── Workflow engine        runWorkflow(scenario, callbacks) → outcome
└── Sui integration        real-provider.ts (client) + server/sponsor.ts (signing)
```

## Data Flow

```
User action (Demo Lab)
  ↓
runWorkflow() — features/agent/workflow.ts
  ↓ emits callbacks
Zustand store updates (transactions, logs, incidents, RPC state)
  ↓
Dashboard pages re-render from shared state
```

Real mint path (Normal Success + zkLogin):

```
Demo Lab → mintBadgeReal() → POST /api/sponsor/prepare
  → zkLogin signTransaction(bytes) → POST /api/sponsor/execute → devnet digest
```