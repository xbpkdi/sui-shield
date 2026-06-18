import { z } from "zod";

export const AppModeSchema = z.enum(["healthy", "degraded", "protective", "recovering", "error"]);

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(64),
  network: z.enum(["testnet", "mainnet", "devnet"]),
  mode: AppModeSchema,
  createdAt: z.string().datetime(),
});

export const SponsorshipPolicySchema = z.object({
  allowedActions: z.array(z.string()),
  maxGasPerTx: z.number().positive(),
  dailyBudget: z.number().positive(),
  maxTransactionsPerWalletPerHour: z.number().int().positive(),
  duplicateProtection: z.boolean(),
  duplicateWindowSeconds: z.number().int().positive(),
  simulationRequired: z.boolean(),
  pauseOnInstability: z.boolean(),
  manualApprovalThreshold: z.number().positive(),
});

export const RpcEndpointSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  role: z.enum(["primary", "backup", "standby"]),
  status: z.enum(["healthy", "degraded", "down", "standby"]),
  latencyMs: z.number().nonnegative(),
  successRate: z.number().min(0).max(100),
  latestCheckpoint: z.number().int().nonnegative(),
  lastCheckedAt: z.string(),
});

export const TransactionIntentSchema = z.object({
  id: z.string(),
  wallet: z.string(),
  action: z.string(),
  status: z.enum([
    "pending",
    "approved",
    "rejected",
    "simulating",
    "submitting",
    "confirmed",
    "failed",
    "queued",
  ]),
  gasEstimate: z.number().nonnegative(),
  risk: z.enum(["low", "medium", "high"]),
  decision: z.enum(["approve", "reject", "manual_review", "recover"]).nullable(),
  reasonCode: z.string(),
  reasonText: z.string(),
  rpcId: z.string().nullable(),
  digest: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AgentEventSchema = z.object({
  id: z.string(),
  transactionIntentId: z.string().nullable(),
  phase: z.enum(["OBSERVE", "REASON", "ACT", "RESULT"]),
  category: z.string(),
  severity: z.enum(["info", "warn", "danger", "success"]),
  message: z.string(),
  metadata: z.record(z.unknown()),
  timestamp: z.string(),
});

export const IncidentSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  status: z.enum(["active", "resolved"]),
  startedAt: z.string(),
  resolvedAt: z.string().nullable(),
  affectedTransactions: z.array(z.string()),
  actions: z.array(z.string()),
  summary: z.string(),
  timeline: z.array(z.object({ time: z.string(), text: z.string() })),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
export type SponsorshipPolicyInput = z.infer<typeof SponsorshipPolicySchema>;
export type RpcEndpointInput = z.infer<typeof RpcEndpointSchema>;
export type TransactionIntentInput = z.infer<typeof TransactionIntentSchema>;
export type AgentEventInput = z.infer<typeof AgentEventSchema>;
export type IncidentInput = z.infer<typeof IncidentSchema>;
