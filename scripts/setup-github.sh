#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="xbpkdi/suishield"

if ! gh auth status &>/dev/null; then
  echo "❌ Not logged in. Run: gh auth login"
  exit 1
fi

if ! git remote get-url origin &>/dev/null; then
  if gh repo view "$REPO" &>/dev/null; then
    git remote add origin "https://github.com/${REPO}.git"
    echo "✅ Linked existing repo"
  else
    gh repo create "$REPO" --public --source=. --remote=origin \
      --description "SuiShield — application-layer gas sponsorship agent for Sui dApps (Sui Overflow 2026)"
    echo "✅ Created public repo"
  fi
fi

git add -A
git diff --cached --quiet && echo "Nothing to commit" || git commit -m "Sui Overflow 2026: judge-ready submission

- Live gasless mint (zkLogin + two-phase sponsor API) on devnet
- Judge onboarding, on-chain proof, integrate section
- Real RPC health checks, /api/status probe
- 103 unit tests, CI workflow, deploy scripts"

git push -u origin main
echo ""
echo "✅ Pushed to https://github.com/${REPO}"
echo "   Add this URL to your DeepSurge submission."