import type { AppMode } from "@/types";

export function getModeTone(mode: AppMode): "success" | "warning" | "danger" | "info" | "violet" | "muted" {
  switch (mode) {
    case "healthy": return "success";
    case "degraded": return "warning";
    case "protective": return "danger";
    case "recovering": return "info";
    case "error": return "danger";
    default: return "muted";
  }
}

export function getModeLabel(mode: AppMode): string {
  switch (mode) {
    case "healthy": return "Healthy";
    case "degraded": return "Degraded";
    case "protective": return "Protective Mode";
    case "recovering": return "Recovering";
    case "error": return "Error";
    default: return mode;
  }
}
