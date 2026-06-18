# Security Model

## Sponsor Key

The sponsor private key must NEVER appear in:
- Frontend code
- `NEXT_PUBLIC_*` environment variables
- Git history
- Source-controlled files
- Browser local storage
- Client-side logs

Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) to provide the key to the server-side sponsor Route Handler only.

## RPC Credentials

Private RPC endpoint URLs (with API keys) are stored in `SUI_RPC_*` env vars (no `NEXT_PUBLIC_` prefix). The `/api/rpc-health` Route Handler checks health server-side and returns sanitized results to the browser.

## Policy Enforcement

All sponsorship decisions are made by the deterministic policy engine before any signing occurs. The engine runs server-side before the sponsor key is used.

## Audit Trail

Every agent decision is logged as an `AgentEvent` with phase, category, severity, message, and metadata. These logs can be exported or forwarded to a SIEM.

## Mock / Simulation Labels

The UI always labels mock or simulated activity explicitly. Transaction digests generated during simulation are clearly marked "Simulation" and never linked as real Sui Explorer URLs without a real digest.
