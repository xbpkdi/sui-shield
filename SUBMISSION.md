# SuiShield — Sui Overflow 2026 Submission

## One-liner

**SuiShield** is an application-layer gas sponsorship agent for Sui dApps — policy-controlled, auditable, and production-shaped — with live **zkLogin + gasless mint** on devnet.

---

## Problem

dApps want gasless UX, but sponsoring gas safely is hard:

- Users reject txs they don't understand
- Sponsor keys must never touch the browser
- Duplicate intents drain sponsor budgets
- RPC outages break mint flows mid-flight
- Operators need an audit trail, not black-box retries

## Solution

SuiShield wraps sponsorship in a **deterministic policy engine** and **4-phase agent workflow**:

1. **Policy** — allowlist, gas caps, duplicate window, budget, Protective Mode
2. **Prepare** — server builds tx, dry-runs, stores intent (no sponsor sig yet)
3. **Sign** — user signs exact bytes (zkLogin or wallet)
4. **Execute** — server verifies bytes + signature, sponsor co-signs, submits

Every step emits **OBSERVE → REASON → ACT → RESULT** events to a live dashboard.

---

## What to Click (Judge Path)

| Step | URL | What happens |
|---|---|---|
| 1 | `/` | Landing — features + agent loop |
| 2 | `/login` | Google zkLogin → Sui address |
| 3 | `/demo-lab` | **Normal Success** → real gasless mint |
| 4 | `/transaction-guardian` | Tx row + agent trace + Explorer link |
| 5 | `/demo-lab` | **RPC Failure** → incident + logs |
| 6 | `/gasless-policy` | Change policy → affects next run |

---

## Technical Proof Points

- **Move:** `starter_badge::mint_badge` — shared `BadgeRegistry`, abort `7` on duplicate
- **Two-phase sponsor:** intent store, byte integrity, `verifyTransactionSignature`
- **zkLogin:** local salt derivation (`SUI_ZKLOGIN_SALT_SECRET`) — no Enoki subscription required on devnet
- **Tests:** 99 unit tests including policy engine + sponsored-tx flow mocks
- **API guard:** same-origin check + 12 req/min/IP on sponsor endpoints (production)

---

## Deployed Network

Default configuration targets **Sui devnet** (zkLogin-friendly with custom Google OAuth client).

Contract IDs are set via env — see `.env.example`. Deploy your own with:

```bash
cd move/starter_badge && sui client publish
```

---

## Video / Live URL Checklist

Before submitting:

- [ ] `npm run build` passes
- [ ] `npm run test` passes (99/99)
- [ ] Google OAuth redirect URI matches deployed URL (`/callback`)
- [ ] Sponsor wallet funded on devnet
- [ ] Demo: fresh Google account for first mint
- [ ] Show simulation scenarios if mint already claimed (409)

---

## Repo Links

- **GitHub:** Update `GITHUB_URL` in `lib/constants/index.ts`
- **Docs:** `docs/sui-integration.md`, `docs/security-model.md`, `docs/agent-workflow.md`

---

## Team

Built by [@xbpkdi](https://github.com/xbpkdi) for Sui Overflow 2026.