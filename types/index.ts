export type AppMode = "healthy" | "degraded" | "protective" | "recovering" | "error";

export type RpcRole = "primary" | "backup" | "standby";
export type RpcStatus = "healthy" | "degraded" | "down" | "standby";

export type TransactionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "simulating"
  | "submitting"
  | "confirmed"
  | "failed"
  | "queued";

export type RiskLevel = "low" | "medium" | "high";
export type DecisionType = "approve" | "reject" | "manual_review" | "recover";
export type AgentPhase = "OBSERVE" | "REASON" | "ACT" | "RESULT";
export type Severity = "info" | "warn" | "danger" | "success";
export type IncidentStatus = "active" | "resolved";

export interface Project {
  id: string;
  name: string;
  network: "testnet" | "mainnet" | "devnet";
  mode: AppMode;
  createdAt: string;
}

export interface SponsorshipPolicy {
  allowedActions: string[];
  maxGasPerTx: number;
  dailyBudget: number;
  maxTransactionsPerWalletPerHour: number;
  duplicateProtection: boolean;
  duplicateWindowSeconds: number;
  simulationRequired: boolean;
  pauseOnInstability: boolean;
  manualApprovalThreshold: number;
}

export interface RpcEndpoint {
  id: string;
  name: string;
  url: string;
  role: RpcRole;
  status: RpcStatus;
  latencyMs: number;
  successRate: number;
  latestCheckpoint: number;
  lastCheckedAt: string;
}

export interface TransactionIntent {
  id: string;
  wallet: string;
  action: string;
  status: TransactionStatus;
  gasEstimate: number;
  risk: RiskLevel;
  decision: DecisionType | null;
  reasonCode: string;
  reasonText: string;
  rpcId: string | null;
  digest: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentEvent {
  id: string;
  transactionIntentId: string | null;
  phase: AgentPhase;
  category: string;
  severity: Severity;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface Incident {
  id: string;
  type: string;
  title: string;
  status: IncidentStatus;
  startedAt: string;
  resolvedAt: string | null;
  affectedTransactions: string[];
  actions: string[];
  summary: string;
  timeline: Array<{ time: string; text: string }>;
}

export type RecoveryStrategy = "switch_rpc" | "retry" | "queue" | "manual_review";

export type SponsorshipDecision =
  | { type: "approve"; reasonCode: string }
  | { type: "reject"; reasonCode: string }
  | { type: "manual_review"; reasonCode: string }
  | { type: "recover"; strategy: RecoveryStrategy; reasonCode: string };

export type WorkflowStage =
  | "idle"
  | "validating_policy"
  | "simulating"
  | "checking_duplicate"
  | "checking_budget"
  | "selecting_rpc"
  | "requesting_user_signature"
  | "requesting_sponsor_signature"
  | "submitting"
  | "verifying"
  | "recovering"
  | "succeeded"
  | "rejected"
  | "failed";
