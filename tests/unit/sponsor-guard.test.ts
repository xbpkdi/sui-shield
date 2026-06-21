import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkSponsorOrigin,
  checkSponsorRateLimit,
  guardSponsorRequest,
} from "@/lib/api/sponsor-guard";

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/sponsor/prepare", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...headers,
    },
  });
}

describe("sponsor-guard", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv ?? "test");
  });

  it("allows same-origin requests in production", () => {
    const result = checkSponsorOrigin(makeRequest());
    expect(result).toBeNull();
  });

  it("blocks cross-origin requests in production", () => {
    const result = checkSponsorOrigin(
      makeRequest({ origin: "https://evil.example", host: "localhost:3000" })
    );
    expect(result?.status).toBe(403);
  });

  it("skips origin check in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = checkSponsorOrigin(makeRequest({ origin: "https://evil.example" }));
    expect(result).toBeNull();
  });

  it("returns 429 after exceeding the rate limit", () => {
    let last: ReturnType<typeof checkSponsorRateLimit> = null;
    for (let i = 0; i < 13; i++) {
      last = checkSponsorRateLimit(makeRequest({ "x-forwarded-for": "10.0.0.1" }));
    }
    expect(last?.status).toBe(429);
  });

  it("guardSponsorRequest chains origin then rate limit", () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = guardSponsorRequest(makeRequest());
    expect(result).toBeNull();
  });
});