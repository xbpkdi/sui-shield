import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  Activity,
  Shield,
  AlertTriangle,
  Terminal,
  FlaskConical,
  Settings as SettingsIcon,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/gasless-policy", label: "Gasless Policy", icon: ShieldCheck },
  { href: "/rpc-health", label: "RPC Health", icon: Activity },
  { href: "/transaction-guardian", label: "TX Guardian", icon: Shield },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/agent-logs", label: "Agent Logs", icon: Terminal },
  { href: "/demo-lab", label: "Demo Lab", icon: FlaskConical },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export type NavHref = (typeof navItems)[number]["href"];

export const dashboardRoutes = new Set<NavHref>(navItems.map((item) => item.href));

export function isDashboardRoute(pathname: string): boolean {
  return dashboardRoutes.has(pathname as NavHref);
}