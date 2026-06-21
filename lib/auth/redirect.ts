export const AUTH_NEXT_KEY = "suishield_auth_next";

/** Safe internal path only — blocks open redirects. */
export function sanitizeNextPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path === "/login" || path === "/callback") return null;
  return path;
}

export function saveAuthNext(path: string) {
  if (typeof window === "undefined") return;
  const safe = sanitizeNextPath(path);
  if (safe) sessionStorage.setItem(AUTH_NEXT_KEY, safe);
}

export function peekAuthNext(): string | null {
  if (typeof window === "undefined") return null;
  return sanitizeNextPath(sessionStorage.getItem(AUTH_NEXT_KEY));
}

/** Read and clear the post-auth destination (defaults to /dashboard). */
export function consumeAuthNext(fallback = "/dashboard"): string {
  const next = peekAuthNext() ?? sanitizeNextPath(fallback) ?? "/dashboard";
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_NEXT_KEY);
  }
  return next;
}