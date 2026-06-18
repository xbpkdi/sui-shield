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

## Reasoning Transparency

Agent reasoning messages are concise, deterministic, and derived from system inputs — never LLM-generated chain-of-thought. Each message explains the observed state and the policy rule that drove the decision.
