/**
 * Mock Sui transaction provider.
 * Used for development and Demo Lab simulations.
 * All results are clearly labeled as simulated — never presented as real transactions.
 */

import type {
  SuiTransactionProvider,
  BuildMintBadgeParams,
  DryRunResult,
  SponsoredTxParams,
  TxStatusResult,
} from "./interfaces";
import { randomHex } from "@/lib/utils";

const MOCK_DELAY = 400;
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const mockSuiProvider: SuiTransactionProvider = {
  async buildMintBadgeTransaction(_params: BuildMintBadgeParams): Promise<Uint8Array> {
    await delay(MOCK_DELAY);
    // Returns a fake transaction bytes buffer
    return new Uint8Array([0xde, 0xad, 0xbe, 0xef, ...Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))]);
  },

  async dryRunTransaction(_txBytes: Uint8Array): Promise<DryRunResult> {
    await delay(MOCK_DELAY);
    return {
      success: true,
      gasEstimateMist: 4_000_000, // 0.004 SUI in MIST
    };
  },

  async executeSponsoredTransaction(_params: SponsoredTxParams): Promise<TxStatusResult> {
    await delay(MOCK_DELAY * 2);
    const digest = `0x${randomHex(64)}`;
    return {
      confirmed: true,
      digest,
    };
  },

  async getTransactionStatus(digest: string): Promise<TxStatusResult> {
    await delay(MOCK_DELAY);
    return {
      confirmed: true,
      digest,
    };
  },

  async hasClaimedBadge(_wallet: string, _packageId: string): Promise<boolean> {
    await delay(MOCK_DELAY);
    return false;
  },
};

/**
 * Mock provider that simulates a Move abort (EBadgeAlreadyMinted).
 */
export const mockMoveAbortProvider: SuiTransactionProvider = {
  ...mockSuiProvider,
  async dryRunTransaction(_txBytes: Uint8Array): Promise<DryRunResult> {
    await delay(MOCK_DELAY);
    return {
      success: false,
      gasEstimateMist: 0,
      error: "MoveAbort",
      moveAbortCode: 7,
      moveAbortMessage: "EBadgeAlreadyMinted",
    };
  },
};
