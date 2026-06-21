import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("realRpcHealthService", () => {
  const env = { ...process.env };
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...env,
      NEXT_PUBLIC_SUI_NETWORK: "devnet",
      SUI_RPC_PRIMARY: "https://fullnode.devnet.sui.io:443",
    };
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env = env;
    vi.restoreAllMocks();
  });

  it("marks endpoint healthy when JSON-RPC returns a checkpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ result: "12345" }),
    });

    const { realRpcHealthService } = await import("@/lib/rpc/real-health-service");
    const results = await realRpcHealthService.checkAll();

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].status).toBe("healthy");
    expect(results[0].latestCheckpoint).toBe(12345);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("marks endpoint down when JSON-RPC errors", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "fail" } }),
    });

    const { realRpcHealthService } = await import("@/lib/rpc/real-health-service");
    const results = await realRpcHealthService.checkAll();

    expect(results[0].status).toBe("down");
    expect(results[0].latestCheckpoint).toBe(0);
  });
});