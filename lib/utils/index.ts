import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSui(amount: number, decimals = 4): string {
  return `${amount.toFixed(decimals)} SUI`;
}

export function formatAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export function generateId(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return prefix ? `${prefix}-${rand}` : rand;
}

export function randomHex(length = 8): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export function buildIntentKey(
  projectId: string,
  wallet: string,
  action: string,
  resourceId = ""
): string {
  return `${projectId}:${wallet}:${action}:${resourceId}`;
}
