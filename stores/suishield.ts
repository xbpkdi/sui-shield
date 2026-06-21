import { create } from "zustand";
import type {
  AppMode,
  Project,
  SponsorshipPolicy,
  RpcEndpoint,
  TransactionIntent,
  AgentEvent,
  Incident,
} from "@/types";
import { generateId, nowIso, nowTime, randomHex } from "@/lib/utils";
import { getActiveNetwork, getDefaultRpcUrl } from "@/lib/sui/network";

// ─── Derived metric helpers ────────────────────────────────────────────────

function deriveSuccessRate(txs: TransactionIntent[]): number {
  const done = txs.filter((t) => t.status === "confirmed" || t.status === "rejected");
  if (done.length === 0) return 100;
  const ok = done.filter((t) => t.status === "confirmed").length;
  return Math.round((ok / done.length) * 1000) / 10;
}

function deriveGasUsed(txs: TransactionIntent[]): number {
  return txs
    .filter((t) => t.status === "confirmed")
    .reduce((sum, t) => sum + t.gasEstimate, 0);
}

function deriveBlockedDuplicates(txs: TransactionIntent[]): number {
  return txs.filter((t) => t.reasonCode === "DUPLICATE_DETECTED").length;
}

// ─── Initial state ──────────────────────────────────────────────────────────

const activeNetwork = getActiveNetwork();

const initialProject: Project = {
  id: "proj-demo",
  name: "Demo Sui dApp",
  network: activeNetwork,
  mode: "healthy",
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const initialPolicy: SponsorshipPolicy = {
  allowedActions: ["mint_badge", "claim_reward", "register_profile"],
  maxGasPerTx: 0.05,
  dailyBudget: 10,
  maxTransactionsPerWalletPerHour: 10,
  duplicateProtection: true,
  duplicateWindowSeconds: 30,
  simulationRequired: true,
  pauseOnInstability: true,
  manualApprovalThreshold: 0.1,
};

const initialRpcEndpoints: RpcEndpoint[] = [
  {
    id: "rpc-1",
    name: "Mysten Public RPC",
    url: getDefaultRpcUrl(activeNetwork),
    role: "primary",
    status: "healthy",
    latencyMs: 380,
    successRate: 99.2,
    latestCheckpoint: 10203220,
    lastCheckedAt: new Date(Date.now() - 12_000).toISOString(),
  },
  {
    id: "rpc-2",
    name: "QuickNode RPC",
    url: "https://sui-testnet.example.com",
    role: "backup",
    status: "healthy",
    latencyMs: 420,
    successRate: 99.0,
    latestCheckpoint: 10203219,
    lastCheckedAt: new Date(Date.now() - 15_000).toISOString(),
  },
  {
    id: "rpc-3",
    name: "Chainstack RPC",
    url: "https://sui-testnet-2.example.com",
    role: "standby",
    status: "standby",
    latencyMs: 510,
    successRate: 98.4,
    latestCheckpoint: 10203218,
    lastCheckedAt: new Date(Date.now() - 20_000).toISOString(),
  },
];

const initialTransactions: TransactionIntent[] = [
  {
    id: "tx-001",
    wallet: "0x9a2b3c4d5e6f7890abcdef1234567890abcdef12",
    action: "mint_badge",
    status: "confirmed",
    gasEstimate: 0.004,
    risk: "low",
    decision: "approve",
    reasonCode: "POLICY_PASSED",
    reasonText: "Action whitelisted, simulation succeeded, no duplicate within window.",
    rpcId: "rpc-1",
    digest: `0x${randomHex(6)}...${randomHex(3)}`,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000 + 3000).toISOString(),
  },
  {
    id: "tx-002",
    wallet: "0x1111222233334444555566667777888899990000",
    action: "mint_badge",
    status: "rejected",
    gasEstimate: 0.004,
    risk: "high",
    decision: "reject",
    reasonCode: "DUPLICATE_DETECTED",
    reasonText: "Identical intent from same wallet detected within the 30-second duplicate window.",
    rpcId: null,
    digest: null,
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 1000 + 800).toISOString(),
  },
  {
    id: "tx-003",
    wallet: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555",
    action: "claim_reward",
    status: "confirmed",
    gasEstimate: 0.006,
    risk: "low",
    decision: "approve",
    reasonCode: "POLICY_PASSED",
    reasonText: "Action whitelisted, simulation succeeded.",
    rpcId: "rpc-2",
    digest: `0x${randomHex(6)}...${randomHex(3)}`,
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 1000 + 2800).toISOString(),
  },
];

const initialAgentEvents: AgentEvent[] = [
  {
    id: "evt-001",
    transactionIntentId: "tx-001",
    phase: "OBSERVE",
    category: "RPC",
    severity: "info",
    message: "Primary RPC latency 380ms — within threshold.",
    metadata: { latencyMs: 380, endpoint: "rpc-1" },
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-002",
    transactionIntentId: "tx-001",
    phase: "REASON",
    category: "Policy",
    severity: "info",
    message: "Action mint_badge is whitelisted. Gas estimate 0.004 SUI is below 0.05 SUI limit.",
    metadata: { action: "mint_badge", gasEstimate: 0.004 },
    timestamp: new Date(Date.now() - 8 * 60 * 1000 + 400).toISOString(),
  },
  {
    id: "evt-003",
    transactionIntentId: "tx-001",
    phase: "ACT",
    category: "Gasless",
    severity: "info",
    message: "Sponsored gas for tx-001 via Primary RPC.",
    metadata: { rpcId: "rpc-1" },
    timestamp: new Date(Date.now() - 8 * 60 * 1000 + 2000).toISOString(),
  },
  {
    id: "evt-004",
    transactionIntentId: "tx-001",
    phase: "RESULT",
    category: "Gasless",
    severity: "success",
    message: "Mint Badge sponsored transaction confirmed.",
    metadata: { status: "confirmed" },
    timestamp: new Date(Date.now() - 8 * 60 * 1000 + 3000).toISOString(),
  },
  {
    id: "evt-005",
    transactionIntentId: "tx-002",
    phase: "OBSERVE",
    category: "Transaction",
    severity: "warn",
    message: "Identical Mint Badge intent from wallet 0x1111...0000 observed 12 seconds ago.",
    metadata: { wallet: "0x1111222233334444555566667777888899990000" },
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-006",
    transactionIntentId: "tx-002",
    phase: "REASON",
    category: "Policy",
    severity: "warn",
    message: "Duplicate intent detected within 30-second window. Policy: block sponsorship.",
    metadata: { duplicateWindowSeconds: 30 },
    timestamp: new Date(Date.now() - 6 * 60 * 1000 + 300).toISOString(),
  },
  {
    id: "evt-007",
    transactionIntentId: "tx-002",
    phase: "ACT",
    category: "Gasless",
    severity: "warn",
    message: "Sponsorship blocked. User notified of duplicate intent.",
    metadata: {},
    timestamp: new Date(Date.now() - 6 * 60 * 1000 + 800).toISOString(),
  },
  {
    id: "evt-008",
    transactionIntentId: "tx-002",
    phase: "RESULT",
    category: "Gasless",
    severity: "warn",
    message: "Transaction rejected — duplicate detected. Gas saved.",
    metadata: { reasonCode: "DUPLICATE_DETECTED" },
    timestamp: new Date(Date.now() - 6 * 60 * 1000 + 900).toISOString(),
  },
];

const initialIncidents: Incident[] = [
  {
    id: "INC-204",
    type: "RPC Outage",
    title: "Primary RPC Failure",
    status: "resolved",
    startedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 86 * 60 * 1000).toISOString(),
    affectedTransactions: ["tx-003"],
    actions: ["Detected high latency on primary RPC", "Switched to backup RPC", "Retried transaction", "Confirmed on backup RPC"],
    summary: "Primary RPC endpoint experienced elevated latency exceeding the configured threshold. The agent automatically switched to the backup RPC and completed the sponsored transaction successfully.",
    timeline: [
      { time: new Date(Date.now() - 90 * 60 * 1000).toLocaleTimeString("en-US", { hour12: false }), text: "Primary RPC latency exceeded threshold (2.8s > 2s)" },
      { time: new Date(Date.now() - 90 * 60 * 1000 + 2000).toLocaleTimeString("en-US", { hour12: false }), text: "Switched active endpoint to Backup RPC 1" },
      { time: new Date(Date.now() - 90 * 60 * 1000 + 15000).toLocaleTimeString("en-US", { hour12: false }), text: "Transaction sponsored and submitted via backup RPC" },
      { time: new Date(Date.now() - 86 * 60 * 1000).toLocaleTimeString("en-US", { hour12: false }), text: "Primary RPC recovered — latency normal" },
    ],
  },
];

// ─── Store interface ────────────────────────────────────────────────────────

export interface SuiShieldState {
  project: Project;
  policy: SponsorshipPolicy;
  sponsorBudget: number;
  rpcEndpoints: RpcEndpoint[];
  transactions: TransactionIntent[];
  agentLogs: AgentEvent[];
  incidents: Incident[];
  queuedIntents: string[];
  currentMode: AppMode;
  activeRpcId: string;

  // Derived (computed from state collections)
  gasUsed: number;
  txSuccessRate: number;
  blockedDuplicates: number;

  // Actions
  setMode: (mode: AppMode) => void;
  updatePolicy: (patch: Partial<SponsorshipPolicy>) => void;
  setRpcStatus: (id: string, patch: Partial<RpcEndpoint>) => void;
  setActiveRpc: (id: string) => void;
  addTransaction: (tx: TransactionIntent) => void;
  updateTransaction: (id: string, patch: Partial<TransactionIntent>) => void;
  pushAgentEvent: (event: Omit<AgentEvent, "id" | "timestamp">) => void;
  addIncident: (incident: Omit<Incident, "id">) => void;
  resolveIncident: (id: string, resolvedAt?: string) => void;
  queueIntent: (id: string) => void;
  drainQueue: () => void;
  reset: () => void;
}

// ─── Store implementation ──────────────────────────────────────────────────

export const useSuiShieldStore = create<SuiShieldState>((set) => ({
  project: initialProject,
  policy: initialPolicy,
  sponsorBudget: 10,
  rpcEndpoints: initialRpcEndpoints,
  transactions: initialTransactions,
  agentLogs: initialAgentEvents,
  incidents: initialIncidents,
  queuedIntents: [],
  currentMode: "healthy",
  activeRpcId: "rpc-1",

  // Derived from collections
  gasUsed: deriveGasUsed(initialTransactions),
  txSuccessRate: deriveSuccessRate(initialTransactions),
  blockedDuplicates: deriveBlockedDuplicates(initialTransactions),

  setMode: (mode) => set({ currentMode: mode }),

  updatePolicy: (patch) => set((s) => ({ policy: { ...s.policy, ...patch } })),

  setRpcStatus: (id, patch) =>
    set((s) => ({
      rpcEndpoints: s.rpcEndpoints.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  setActiveRpc: (id) => set({ activeRpcId: id }),

  addTransaction: (tx) =>
    set((s) => {
      const txs = [tx, ...s.transactions];
      return {
        transactions: txs,
        gasUsed: deriveGasUsed(txs),
        txSuccessRate: deriveSuccessRate(txs),
        blockedDuplicates: deriveBlockedDuplicates(txs),
      };
    }),

  updateTransaction: (id, patch) =>
    set((s) => {
      const txs = s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t));
      return {
        transactions: txs,
        gasUsed: deriveGasUsed(txs),
        txSuccessRate: deriveSuccessRate(txs),
        blockedDuplicates: deriveBlockedDuplicates(txs),
      };
    }),

  pushAgentEvent: (event) =>
    set((s) => ({
      agentLogs: [
        ...s.agentLogs,
        {
          ...event,
          id: generateId("evt"),
          timestamp: nowIso(),
          metadata: event.metadata ?? {},
        },
      ].slice(-500),
    })),

  addIncident: (incident) =>
    set((s) => ({
      incidents: [
        {
          ...incident,
          id: `INC-${205 + s.incidents.length}`,
        },
        ...s.incidents,
      ],
    })),

  resolveIncident: (id, resolvedAt) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, status: "resolved", resolvedAt: resolvedAt ?? nowIso() } : i
      ),
    })),

  queueIntent: (id) => set((s) => ({ queuedIntents: [...s.queuedIntents, id] })),

  drainQueue: () => set({ queuedIntents: [] }),

  reset: () =>
    set({
      currentMode: "healthy",
      rpcEndpoints: initialRpcEndpoints,
      transactions: initialTransactions,
      agentLogs: initialAgentEvents,
      incidents: initialIncidents,
      queuedIntents: [],
      activeRpcId: "rpc-1",
      gasUsed: deriveGasUsed(initialTransactions),
      txSuccessRate: deriveSuccessRate(initialTransactions),
      blockedDuplicates: deriveBlockedDuplicates(initialTransactions),
    }),
}));

// ─── Selector helpers ──────────────────────────────────────────────────────

export function selectActiveRpc(state: SuiShieldState): RpcEndpoint | undefined {
  return state.rpcEndpoints.find((r) => r.id === state.activeRpcId);
}

/** Use with `useShallow` — `.filter()` returns a new array reference each call. */
export function selectActiveIncidents(state: SuiShieldState): Incident[] {
  return state.incidents.filter((i) => i.status === "active");
}

export function selectRecentAgentLogs(state: SuiShieldState, n = 10): AgentEvent[] {
  return [...state.agentLogs].reverse().slice(0, n);
}

export function selectSponsorBudgetPct(state: SuiShieldState): number {
  return Math.min(100, (state.gasUsed / state.sponsorBudget) * 100);
}

// Re-export nowTime for use in workflow
export { nowTime };
