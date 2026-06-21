import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeNextPath,
  saveAuthNext,
  peekAuthNext,
  consumeAuthNext,
  AUTH_NEXT_KEY,
} from "@/lib/auth/redirect";

describe("auth redirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("sanitizes safe internal paths", () => {
    expect(sanitizeNextPath("/demo-lab")).toBe("/demo-lab");
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
  });

  it("rejects open redirects and auth routes", () => {
    expect(sanitizeNextPath("//evil.com")).toBeNull();
    expect(sanitizeNextPath("https://evil.com")).toBeNull();
    expect(sanitizeNextPath("/login")).toBeNull();
    expect(sanitizeNextPath("/callback")).toBeNull();
  });

  it("persists and consumes next path", () => {
    saveAuthNext("/demo-lab");
    expect(peekAuthNext()).toBe("/demo-lab");
    expect(consumeAuthNext()).toBe("/demo-lab");
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBeNull();
  });
});