#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Missing $ENV_FILE — copy from .env.example and fill secrets"
  exit 1
fi

if ! npx vercel whoami &>/dev/null; then
  echo "❌ Not logged in. Run: npx vercel login"
  exit 1
fi

echo "📦 Linking Vercel project (first run will prompt)…"
npx vercel link --yes 2>/dev/null || npx vercel link

echo "🔐 Pushing env vars from $ENV_FILE to Vercel (production)…"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" || "$line" != *"="* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  [[ "$key" == NEXT_PUBLIC_* || "$key" == SUI_* || "$key" == SPONSOR_* || "$key" == QUICKNODE_* || "$key" == CHAINSTACK_* ]] || continue
  printf '%s' "$val" | npx vercel env add "$key" production --force 2>/dev/null || true
done < "$ENV_FILE"

echo "🚀 Deploying to production…"
DEPLOY_URL=$(npx vercel deploy --prod --yes 2>&1 | tee /dev/stderr | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -1)

if [[ -n "$DEPLOY_URL" ]]; then
  echo ""
  echo "✅ Live at: $DEPLOY_URL"
  echo ""
  echo "⚡ Add to Google OAuth Authorized redirect URIs:"
  echo "   ${DEPLOY_URL}/callback"
  echo ""
  echo "⚡ Add to .env.local and redeploy:"
  echo "   NEXT_PUBLIC_APP_URL=$DEPLOY_URL"
  echo ""
  echo "⚡ Verify:"
  echo "   curl ${DEPLOY_URL}/api/status"
else
  echo "Deploy finished — check Vercel dashboard for URL"
fi