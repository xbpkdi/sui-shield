#!/usr/bin/env node
/**
 * Pre-submission validator for Sui Overflow 2026.
 * Run: node scripts/submit-ready.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

function run(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv();
const checks = [];

function add(name, ok, detail, urgent = false) {
  checks.push({ name, ok, detail, urgent });
}

add(".env.local exists", existsSync(envPath), envPath);
add(
  "Google OAuth client ID",
  !!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID — add production redirect URI in Google Console"
);
add(
  "Move package ID",
  !!env.NEXT_PUBLIC_BADGE_PACKAGE_ID,
  env.NEXT_PUBLIC_BADGE_PACKAGE_ID || "missing"
);
add(
  "Badge registry ID",
  !!env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID,
  env.NEXT_PUBLIC_STARTER_BADGE_REGISTRY_ID || "missing"
);
add(
  "Sponsor private key (server)",
  !!env.SUI_SPONSOR_PRIVATE_KEY,
  env.SUI_SPONSOR_PRIVATE_KEY ? "set (hidden)" : "missing — fund wallet on devnet"
);
add(
  "zkLogin salt secret",
  !!env.SUI_ZKLOGIN_SALT_SECRET,
  env.SUI_ZKLOGIN_SALT_SECRET ? "set (hidden)" : "missing"
);
add(
  "Live mint enabled",
  env.NEXT_PUBLIC_DEMO_MODE === "false",
  env.NEXT_PUBLIC_DEMO_MODE === "false" ? "NEXT_PUBLIC_DEMO_MODE=false" : "set NEXT_PUBLIC_DEMO_MODE=false"
);
add(
  "Production app URL set",
  !!env.NEXT_PUBLIC_APP_URL,
  env.NEXT_PUBLIC_APP_URL || "set NEXT_PUBLIC_APP_URL after Vercel deploy",
  !env.NEXT_PUBLIC_APP_URL
);
add("Unit tests pass", run("npm run test"), "npm run test");
add("Production build", run("npm run build"), "npm run build");

let gitRemoteOk = false;
try {
  execSync("git remote get-url origin", { cwd: root, stdio: "pipe" });
  gitRemoteOk = true;
} catch {
  gitRemoteOk = false;
}
add(
  "Git remote configured",
  gitRemoteOk,
  gitRemoteOk ? "origin remote set" : "run: bash scripts/setup-github.sh (after gh auth login)",
  !gitRemoteOk
);

const ghOk = run("gh auth status");
add("GitHub CLI logged in", ghOk, ghOk ? "ready to push" : "run: gh auth login", !ghOk);

let vercelOk = false;
try {
  execSync("npx vercel whoami", { cwd: root, stdio: "pipe" });
  vercelOk = true;
} catch {
  vercelOk = false;
}
add("Vercel CLI logged in", vercelOk, vercelOk ? "ready to deploy" : "run: npx vercel login", !vercelOk);

const passed = checks.filter((c) => c.ok).length;
const urgent = checks.filter((c) => !c.ok && c.urgent);

console.log("\n═══ SuiShield Submission Readiness ═══\n");
for (const c of checks) {
  console.log(`${c.ok ? "✅" : "❌"} ${c.name}`);
  console.log(`   ${c.detail}\n`);
}
console.log(`Score: ${passed}/${checks.length} checks passed\n`);

if (urgent.length) {
  console.log("⚡ URGENT — do these now:\n");
  if (!ghOk) {
    console.log("  1. gh auth login");
    console.log("  2. bash scripts/setup-github.sh\n");
  }
  if (!vercelOk) {
    console.log("  1. npx vercel login");
    console.log("  2. bash scripts/deploy-vercel.sh\n");
  }
}

if (env.NEXT_PUBLIC_APP_URL) {
  console.log("📋 Google OAuth redirect URI (production):");
  console.log(`   ${env.NEXT_PUBLIC_APP_URL}/callback\n`);
} else {
  console.log("📋 After deploy: set NEXT_PUBLIC_APP_URL in .env.local, redeploy, then add:");
  console.log("   https://<your-vercel-url>/callback to Google OAuth\n");
}
console.log("📋 Google OAuth redirect URI (local): http://localhost:3000/callback");
console.log("🎬 Demo video script: scripts/demo-video-script.txt");
console.log("📡 Verify deploy: curl https://<url>/api/status → liveMintReady: true");
console.log("📡 Verify security: curl -X POST https://<url>/api/sponsor → HTTP 410\n");

process.exit(passed === checks.length ? 0 : 1);