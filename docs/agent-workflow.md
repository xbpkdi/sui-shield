# Agent Workflow

## OBSERVE → REASON → ACT → RESULT

Every agent decision follows this 4-phase cycle. Each phase emits an `AgentEvent` to the store.

## Workflow Stages

```
IDLE
VALIDATING_POLICY
SIMULATING
CHECKING_DUPLICATE
CHECKING_BUDGET
SELECTING_RPC
REQUESTING_USER_SIGNATURE
REQUESTING_SPONSOR_SIGNATURE
SUBMITTING
VERIFYING
RECOVERING
SUCCEEDED | REJECTED | FAILED
```

## Recovery Behavior

The agent is goal-directed. If a recoverable error occurs, it attempts recovery before failing:

- **RPC timeout/degradation:** evaluates backup endpoints, switches if healthier
- **Network instability:** enters Protective Mode, queues intent for replay
- **No blind retries:** always checks transaction state before resubmitting

**Non-retryable errors (fail immediately):**
- Move abort
- User rejection
- Policy denial
- Unknown transaction state

## Example: RPC Failover

```
OBSERVE  Primary RPC latency exceeded threshold (2.8s > 2s).

REASON   Transaction unconfirmed. Backup RPC has 420ms latency
         and a fresher checkpoint. No digest found — safe to retry.

ACT      Switched active endpoint to Backup RPC 1.
         Rebuilt transaction. Submitted via backup endpoint.

RESULT   Sponsored transaction confirmed via Backup RPC 1.
```

## Real Mint Flow Steps (Normal Success, zkLogin or wallet)

When zkLogin is configured (or a compatible wallet is connected), the Normal Success scenario uses 9 granular steps:

```
1. policy          Validate policy
2. eligibility     Check on-chain eligibility (has badge?)
3. prepare         Build tx + dry-run on server (POST /api/sponsor/prepare)
4. dryrun          Server dry run result verified
5. sign            Waiting for wallet signature (exact bytes)
6. sponsor_sign    Sponsor signing server-side (POST /api/sponsor/execute)
7. submit          Submitting to Sui network
8. verify          Verifying badge ownership
9. success         Confirmed on-chain
```

## Wallet Compatibility Agent Events

When a real mint is attempted, the agent emits OBSERVE/REASON/ACT events for wallet compatibility:

**Slush connected:**
```
OBSERVE  Connected wallet identified as Slush.
REASON   Wallet approved for reference demo. Slush fully supports Sui sponsored transactions.
ACT      Proceeding with server-side preparation and final dry run before wallet signing.
```

**Phantom connected (flag=false):**
```
OBSERVE  Connected wallet identified as Phantom.
REASON   Phantom may preview sponsored Sui transactions as if sender pays gas, despite
         sponsor gas being present. This is a wallet preview limitation, not a tx error.
ACT      Real sponsored mint paused. Slush Wallet recommended for this demo.
```

**Phantom connected (flag=true, developer override):**
```
OBSERVE  Connected wallet identified as Phantom.
REASON   Phantom preview limitation acknowledged.
ACT      Proceeding with Phantom developer override — preview warnings acknowledged.
```

**Unknown wallet:**
```
OBSERVE  Connected wallet identified as <name>.
REASON   Wallet "<name>" compatibility with sponsored transactions is unverified.
```

## Reasoning Transparency

Agent reasoning messages are concise, deterministic, and derived from system inputs — never LLM-generated chain-of-thought. Each message explains the observed state and the policy rule that drove the decision.
