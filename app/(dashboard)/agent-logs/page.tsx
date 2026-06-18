import type { Metadata } from "next";
import { AgentLogsClient } from "./AgentLogsClient";

export const metadata: Metadata = { title: "Agent Logs" };

export default function AgentLogsPage() {
  return <AgentLogsClient />;
}
