/**
 * RPC health service interface + mock implementation.
 * Real implementation should run server-side via /api/rpc-health.
 * Never ping private RPC endpoints from the browser.
 */

import type { RpcHealthService, RpcHealthResult } from "@/lib/sui/interfaces";

export type { RpcHealthResult };

export const mockRpcHealthService: RpcHealthService = {
  async checkAll(): Promise<RpcHealthResult[]> {
    // Simulate variable latency
    const jitter = () => Math.floor(Math.random() * 80) - 40;
    return [
      {
        id: "rpc-1",
        name: "Mysten Public RPC",
        url: "https://fullnode.testnet.sui.io:443",
        role: "primary",
        status: "healthy",
        latencyMs: 380 + jitter(),
        successRate: 99.2,
        latestCheckpoint: 10203220 + Math.floor(Math.random() * 10),
        lastCheckedAt: new Date().toISOString(),
      },
      {
        id: "rpc-2",
        name: "QuickNode RPC",
        url: "https://sui-testnet.example.com",
        role: "backup",
        status: "healthy",
        latencyMs: 420 + jitter(),
        successRate: 99.0,
        latestCheckpoint: 10203219 + Math.floor(Math.random() * 10),
        lastCheckedAt: new Date().toISOString(),
      },
      {
        id: "rpc-3",
        name: "Chainstack RPC",
        url: "https://sui-testnet-2.example.com",
        role: "standby",
        status: "healthy" as const,
        latencyMs: 510 + jitter(),
        successRate: 98.4,
        latestCheckpoint: 10203218 + Math.floor(Math.random() * 10),
        lastCheckedAt: new Date().toISOString(),
      },
    ];
  },

  async selectBestEndpoint(): Promise<RpcHealthResult> {
    const all = await this.checkAll();
    const healthy = all.filter((r) => r.status === "healthy");
    if (healthy.length === 0) {
      throw new Error("No healthy RPC endpoints available");
    }
    return healthy.sort((a, b) => a.latencyMs - b.latencyMs)[0];
  },

  async checkEndpoint(_url: string) {
    const start = Date.now();
    // In real implementation, make a JSON-RPC call (server-side only)
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 300));
    return {
      latencyMs: Date.now() - start,
      latestCheckpoint: 10203220,
      status: "healthy" as const,
    };
  },
};
