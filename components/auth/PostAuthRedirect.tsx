"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useZkLogin } from "@/contexts/ZkLoginContext";

export const LANDING_REDIRECT_KEY = "suishield_landing_redirected";

/** Call before navigating to "/" so signed-in users stay on the marketing page. */
export function markLandingVisit() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(LANDING_REDIRECT_KEY, "1");
  }
}

/**
 * Auto-redirect signed-in users to dashboard on first landing visit only.
 * Logo / brand links call markLandingVisit() so explicit home navigation always works.
 */
export function PostAuthRedirect() {
  const { session } = useZkLogin();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(LANDING_REDIRECT_KEY)) return;
    sessionStorage.setItem(LANDING_REDIRECT_KEY, "1");
    router.replace("/dashboard");
  }, [session, router]);

  return null;
}