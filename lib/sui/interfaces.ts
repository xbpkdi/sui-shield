/**
 * Sui integration interfaces.
 * Start with mock implementations — replace with @mysten/sui SDK when ready.
 *
 * All sponsor signing is a server-side operation.
 * Never pass private keys to these interfaces from client code.
 */

export interface BuildMintBadgeParams {
  wallet: string;
  packageId: string;
  moduleName: string;
  functionName: string;
}

export interface DryRunResult {
  success: boolean;
  gasEstimateMist: number;
  error?: string;
  moveAbortCode?: number;
  moveAbortMessage?: string;
}

export interface SponsoredTxParams {
  txBytes: Uint8Array;
  sponsorSignature: string;
  userSignature: string;
}

export interface TxStatusResult {
  confirmed: boolean;
  digest: string | null;
  error?: string;
}

export interface SuiTransactionProvider {
  buildMintBadgeTransaction(params: BuildMintBadgeParams): Promise<Uint8Array>;
  dryRunTransaction(txBytes: Uint8Array): Promise<DryRunResult>;
  executeSponsoredTransaction(params: SponsoredTxParams): Promise<TxStatusResult>;
  getTransactionStatus(digest: string): Promise<TxStatusResult>;
  hasClaimedBadge(wallet: string, packageId: string): Promise<boolean>;
}

export interface BudgetInfo {
  totalSui: number;
  usedSui: number;
  remainingSui: number;
}

export interface GasReservation {
  reservationId: string;
  amountMist: number;
  expiresAt: string;
}

export interface SponsorService {
  getBudget(): Promise<BudgetInfo>;
  /** TODO: Implement server-side signing. Never expose private key to client. */
  reserveGas(txBytes: Uint8Array): Promise<GasReservation>;
  /** TODO: Implement server-side sponsor signature via secure key management. */
  sponsorTransaction(reservationId: string): Promise<{ sponsorSignature: string }>;
}

export interface RpcHealthResult {
  id: string;
  name: string;
  url: string;
  role: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  successRate: number;
  latestCheckpoint: number;
  lastCheckedAt: string;
}

export interface RpcHealthService {
  checkAll(): Promise<RpcHealthResult[]>;
  selectBestEndpoint(): Promise<RpcHealthResult>;
  checkEndpoint(url: string): Promise<Pick<RpcHealthResult, "latencyMs" | "latestCheckpoint" | "status">>;
}
