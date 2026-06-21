import { afterEach, describe, expect, it, vi } from "vitest";

describe("zklogin-config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isZkLoginConfigured is true with only Google Client ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "123.apps.googleusercontent.com");
    const { isZkLoginConfigured } = await import("@/lib/sui/zklogin-config");
    expect(isZkLoginConfigured()).toBe(true);
  });

  it("isZkLoginConfigured is false without Google Client ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    const { isZkLoginConfigured } = await import("@/lib/sui/zklogin-config");
    expect(isZkLoginConfigured()).toBe(false);
  });

  it("isZkLoginConfigured does not require Enoki API key", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "123.apps.googleusercontent.com");
    vi.stubEnv("NEXT_PUBLIC_ENOKI_API_KEY", "");
    const { isZkLoginConfigured } = await import("@/lib/sui/zklogin-config");
    expect(isZkLoginConfigured()).toBe(true);
  });

  it("isEnokiConfigured requires both Enoki key and Google Client ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "123.apps.googleusercontent.com");
    vi.stubEnv("NEXT_PUBLIC_ENOKI_API_KEY", "enoki_test");
    const { isEnokiConfigured } = await import("@/lib/sui/zklogin-config");
    expect(isEnokiConfigured()).toBe(true);
  });

  it("isEnokiConfigured is false with only Google Client ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "123.apps.googleusercontent.com");
    vi.stubEnv("NEXT_PUBLIC_ENOKI_API_KEY", "");
    const { isEnokiConfigured } = await import("@/lib/sui/zklogin-config");
    expect(isEnokiConfigured()).toBe(false);
  });
});