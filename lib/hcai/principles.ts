/** Human-Centered AI (HCAI) copy — aligned with Microsoft HAX + deterministic agent design. */

export const HCAI_TAGLINE =
  "Deterministic policy engine — not a black-box LLM. You sign every transaction; the agent explains every step.";

export const hcaiPillars = [
  {
    id: "transparent",
    title: "Transparent reasoning",
    desc: "Every decision shows OBSERVE → REASON → ACT → RESULT with plain-language reasons.",
  },
  {
    id: "human-control",
    title: "Human in the loop",
    desc: "You review prepared bytes and sign. Sponsor gas never moves without your explicit approval.",
  },
  {
    id: "calibrated-trust",
    title: "Calibrated trust",
    desc: "Live on-chain mints and simulations are clearly labeled. No hidden autonomy on your wallet.",
  },
  {
    id: "recoverable",
    title: "Graceful recovery",
    desc: "RPC failover, Protective Mode, and policy toggles let operators pause and recover safely.",
  },
] as const;

export const humanControls = [
  { label: "You sign", detail: "Exact transaction bytes after server dry-run" },
  { label: "You approve", detail: "Google zkLogin or wallet — no auto-spend" },
  { label: "You configure", detail: "Gas caps, allowlists, duplicate window in Gasless Policy" },
  { label: "You audit", detail: "Full trace in TX Guardian and Agent Logs" },
] as const;

export const agentScope = [
  { label: "Agent evaluates", detail: "Deterministic policy checks (< 5ms)" },
  { label: "Agent prepares", detail: "Build tx, dry-run, store intent server-side" },
  { label: "Agent co-signs", detail: "Sponsor signature only after byte + sig verification" },
  { label: "Agent never", detail: "Hold your seed phrase, rebuild txs after you sign, or use an LLM for money decisions" },
] as const;