import type { RpcHealthResult, RpcHealthService } from "@/lib/sui/interfaces";
import { redactRpcUrl } from "@/lib/rpc/redact-url";
import { getActiveNetwork, getDefaultRpcUrl } from "@/lib/sui/network";

const RPC_TIMEOUT_MS = 5000;

interface EndpointConfig {
  id: string;
  name: string;
  url: string;
  role: RpcHealthResult["role"];
}

function getEndpointConfigs(): EndpointConfig[] {
  const network = getActiveNetwork();
  const primary = process.env.SUI_RPC_PRIMARY?.trim() || getDefaultRpcUrl(network);
  const backup1 = process.env.SUI_RPC_BACKUP_1?.trim();
  const backup2 = process.env.SUI_RPC_BACKUP_2?.trim();

  const endpoints: EndpointConfig[] = [
    { id: "rpc-1", name: "Primary RPC", url: primary, role: "primary" },
  ];

  if (backup1) {
    endpoints.push({ id: "rpc-2", name: "Backup RPC 1", url: backup1, role: "backup" });
  }
  if (backup2) {
    endpoints.push({ id: "rpc-3", name: "Backup RPC 2", url: backup2, role: "standby" });
  }

  if (endpoints.length === 1) {
    endpoints.push({
      id: "rpc-2",
      name: "Mysten Public RPC",
      url: getDefaultRpcUrl(network),
      role: "backup",
    });
  }

  return endpoints;
}

async function pingRpc(url: string): Promise<{
  latencyMs: number;
  latestCheckpoint: number;
  status: RpcHealthResult["status"];
}> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getLatestCheckpointSequenceNumber",
        params: [],
      }),
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;
    const body = (await res.json()) as { result?: string | number; error?: unknown };

    if (!res.ok || body.error != null) {
      return { latencyMs, latestCheckpoint: 0, status: "down" };
    }

    const checkpoint = Number(body.result);
    const status: RpcHealthResult["status"] =
      latencyMs > 2000 ? "degraded" : Number.isFinite(checkpoint) ? "healthy" : "down";

    return {
      latencyMs,
      latestCheckpoint: Number.isFinite(checkpoint) ? checkpoint : 0,
      status,
    };
  } catch {
    return { latencyMs: Date.now() - start, latestCheckpoint: 0, status: "down" };
  }
}

export const realRpcHealthService: RpcHealthService = {
  async checkAll(): Promise<RpcHealthResult[]> {
    const configs = getEndpointConfigs();
    const results = await Promise.all(
      configs.map(async (cfg) => {
        const ping = await pingRpc(cfg.url);
        return {
          id: cfg.id,
          name: cfg.name,
          url: redactRpcUrl(cfg.url),
          role: cfg.role,
          status: ping.status,
          latencyMs: ping.latencyMs,
          successRate: ping.status === "down" ? 0 : ping.status === "degraded" ? 96 : 99.5,
          latestCheckpoint: ping.latestCheckpoint,
          lastCheckedAt: new Date().toISOString(),
        } satisfies RpcHealthResult;
      })
    );
    return results;
  },

  async selectBestEndpoint(): Promise<RpcHealthResult> {
    const all = await this.checkAll();
    const healthy = all.filter((r) => r.status === "healthy" || r.status === "degraded");
    if (healthy.length === 0) {
      throw new Error("No healthy RPC endpoints available");
    }
    return healthy.sort((a, b) => a.latencyMs - b.latencyMs)[0];
  },

  async checkEndpoint(url: string) {
    return pingRpc(url);
  },
};