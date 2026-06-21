import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("getDeploymentStatus", () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("reports live mint ready when contract env is set and demo mode is off", async () => {
    process.env.NEXT_PUBLIC_SUI_NETWORK = "devnet";
    process.env.NEXT_PUBLIC_BADGE_PACKAGE_ID = "0xabc";
    process.env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID = "0xdef";
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";

    const { getDeploymentStatus } = await import("@/lib/deployment");
    const status = getDeploymentStatus();

    expect(status.contractConfigured).toBe(true);
    expect(status.liveMintReady).toBe(true);
    expect(status.network).toBe("devnet");
    expect(status.explorerPackageUrl).toContain("0xabc");
  });

  it("reports demo mode when NEXT_PUBLIC_DEMO_MODE is not false", async () => {
    process.env.NEXT_PUBLIC_BADGE_PACKAGE_ID = "0xabc";
    process.env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID = "0xdef";
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    const { getDeploymentStatus } = await import("@/lib/deployment");
    const status = getDeploymentStatus();

    expect(status.contractConfigured).toBe(true);
    expect(status.liveMintReady).toBe(false);
    expect(status.demoMode).toBe(true);
  });
});