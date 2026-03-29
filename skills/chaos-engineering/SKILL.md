---
name: chaos-engineering
description: "Chaos engineering for distributed systems: design and run chaos experiments to proactively discover weaknesses before they cause outages. Use when user mentions chaos, fault injection, resilience testing, GameDays, chaos monkey,LitmusChaos, Gremlin, steady-state hypothesis, or when building信頼性 into microservices."
---

# Chaos Engineering — Proactive Resilience Discovery

## Core Philosophy

**"Break things on purpose to build unbreakable systems."**

Chaos engineering is the discipline of experimenting on a system to build confidence in its resilience. Unlike reactive debugging, it **proactively** injects faults before users notice them.

## Key Principle: Steady-State Hypothesis First

Every experiment starts with a **steady-state hypothesis** — a measurable statement about your system's behavior under normal conditions.

```
Steady State = "Normal behavior we expect to observe"
Hypothesis   = "Injecting fault X will [not change / degrade] the steady state"
```

**Never run chaos without first defining steady state.**

## Experiment Design Pattern

```
1. Define steady-state hypothesis
2. Inject the smallest possible fault
3. Monitor for deviation from steady state
4. Roll back immediately if hypothesis fails
5. Automate and repeat
```

## Common Faults to Inject

### Network Layer
| Fault | Command/Method | Impact |
|-------|---------------|--------|
| Latency | `tc qdisc add dev eth0 netem delay 100ms` | API timeouts |
| Packet loss | `tc qdisc add dev eth0 netem loss 5%` | Intermittent errors |
| DNS failure | `/etc/hosts` manipulation | Service discovery breaks |
| Partition | `iptables -A INPUT -s <ip>` | Network split |

### Resource Layer
| Fault | Method | Impact |
|-------|--------|--------|
| CPU spike | `stress-ng --cpu 1 --timeout 30s` | Throttling, slow responses |
| Memory leak | Allocate until OOM | Pod evictions |
| Disk full | `dd if=/dev/zero of=/tmp/bigfile` | Write failures |
| File descriptor exhaustion | `ulimit -n 1024` in container | Connection pooling breaks |

### Application Layer
| Fault | Method | Impact |
|-------|--------|--------|
| Kill pod | `kubectl delete pod` | Restart tolerance |
| Container restart | `docker restart` | Session/state recovery |
| Config map change | `kubectl patch` | Behavior drift |
| Secret deletion | `kubectl delete secret` | Auth failures |

### External Dependency Layer
| Fault | Method | Impact |
|-------|--------|--------|
| Downstream timeout | ` TC` delay on egress | Cascade failure |
| 5xx simulation | iptables redirect | Error budget burn |
| Dependency pod kill | `kubectl delete` | Circuit breaker validation |

## Tooling Landscape

### Kubernetes-Native
- **LitmusChaos** (CNCF, open source) — Custom Resource Definition for chaos, declarative YAML experiments
- **Chaos Mesh** (PingCAP, CNCF) — Kubernetes-native, Web UI, broad fault library
- **Kube-burner** — Load/stress focused, for high-scale experiments

### Host/VM Layer
- **Gremlin** (commercial) — Agent-based, attack categories, safety features
- **ChaoS Monkey** (Netflix) — Terminates random instances in AWS
- **Pumba** — Docker/Kubernetes chaos, container-level faults
- **toxiproxy** — Network partition/slowdown simulation for local dev

### Code/Unit Layer
- **Fault injection in tests** — Simulate errors in unit tests (see patterns below)
- **Toxiproxy-go / toxiproxy** — Programmatic network fault injection

## Experiment YAML Patterns (LitmusChaos)

### Pod Kill Experiment
```yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: pod-kill-chaos
spec:
  engineState: active
  appinfo:
    appns: production
    applabel: "app=api-gateway"
  chaosServiceAccount: litmus-admin
  experiments:
  - name: pod-delete
    spec:
      components:
        env:
        - name: TOTAL_CHAOS_DURATION
          value: '30'
        - name: CHAOS_INTERVAL
          value: '10'
        - name: FORCE
          value: 'false'
```

### Network Latency Experiment
```yaml
spec:
  components:
    env:
    - name: NETWORK_LATENCY
      value: '6000'        # 6000ms = 6s latency
    - name: TARGET_PODS
      value: 'http-api'    # pods matching label
    - name: DESTINATION_PORTS
      value: '8080'
```

## Test Integration Patterns

### Python: Simulate External API Failure
```python
import pytest
from unittest.mock import patch

@pytest.mark.parametrize("fault", ["timeout", "500", "connection_refused"])
def test_order_service_resilience(fault):
    """Order service should degrade gracefully under API faults."""
    with patch("orders.clients.payment") as mock_payment:
        if fault == "timeout":
            mock_payment.charge.side_effect = TimeoutError()
        elif fault == "500":
            mock_payment.charge.side_effect = HTTPError(500)
        else:
            mock_payment.charge.side_effect = ConnectionRefusedError()

        # System under test
        result = order_service.process_order(TEST_ORDER)

        # Assertions: graceful degradation, no crash
        assert result.status in ("pending_retry", "failed_isolated")
        assert not result.charged  # don't charge if payment uncertain
```

### Go: Chaos in Unit Tests
```go
func TestInventoryService_TimeoutResilience(t *testing.T) {
    // Simulate slow DB with context deadline
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
    defer cancel()

    svc := NewInventoryService(mockDB{latency: 5 * time.Second})

    // Should return context deadline exceeded, not panic
    _, err := svc.GetStock(ctx, "SKU-123")

    if err == nil {
        t.Fatal("expected context deadline error under slow DB")
    }
    if !strings.Contains(err.Error(), "deadline") {
        t.Errorf("wrong error type: %v", err)
    }
}
```

### Bash: Network Fault Injection
```bash
#!/bin/bash
# Inject 500ms latency on eth0 for 60 seconds, then auto-rollback
INTERFACE="${INTERFACE:-eth0}"
DELAY_MS="${DELAY_MS:-500}"

cleanup() {
    echo "[chaos] Removing netem rule..."
    tc qdisc del dev "$INTERFACE" root 2>/dev/null || true
}
trap cleanup EXIT

echo "[chaos] Injecting ${DELAY_MS}ms latency on $INTERFACE..."
tc qdisc add dev "$INTERFACE" root netem delay "${DELAY_MS}ms" limit 1000000

echo "[chaos] Running for 60s... (Ctrl+C to abort)"
sleep 60

echo "[chaos] Experiment complete."
```

## GameDay Playbook

A **GameDay** is a team-wide chaos experiment event.

```
Pre-GameDay (1 week before):
  - Define hypotheses and acceptance criteria
  - Identify blast radius — must be contained
  - Prepare rollback procedures
  - Notify on-call and stakeholders
  - Set up monitoring dashboards

GameDay:
  Step 1: Baseline measurement (10 min)
    → Capture normal metrics: latency p50/p95/p99, error rate, throughput

  Step 2: Small fault injection (20 min)
    → Start with latency injection (lowest blast radius)
    → Observe monitoring dashboards in real time
    → Document observations vs. hypothesis

  Step 3: Escalate fault scope (30 min)
    → Kill a single pod → kill 25% → kill 50%
    → Document failure cascade patterns

  Step 4: Roll back and reflect (10 min)

Post-GameDay:
  - Write formal experiment report
  - Prioritize discovered gaps by blast radius × frequency
  - Create follow-up tickets for each gap
  - Update runbooks with new failure modes
```

## Experiment Report Template

```
## Chaos Experiment Report: [Name]

### Hypothesis
[What we expected to happen]

### Steady State Baseline
- Metric A: [value] (pre-experiment)
- Metric B: [value] (pre-experiment)

### Fault Injected
- Type: [network/resource/app/external]
- Details: [specific configuration]

### Results
| Metric | Baseline | During Experiment | Deviation |
|--------|----------|-------------------|-----------|
| p99 latency | 120ms | 3400ms | +2833% |
| Error rate | 0.1% | 8.3% | +820% |

### Conclusion
✅ Hypothesis confirmed / ❌ Hypothesis disproved

### Findings
1. [Finding 1]
2. [Finding 2]

### Action Items
| Action | Severity | Owner |
|--------|----------|-------|
| Add circuit breaker | P1 | @team-backend |
| Increase replica count | P2 | @team-infra |
```

## Safety Rules (NEVER Violate)

- **Never** experiment in production without blast-radius containment
- **Always** have a rollback button —tc qdisc del, kubectl rollout undo
- **Never** run multiple experiments simultaneously on the same system
- **Always** define steady state **before** injecting faults
- **Never** increase blast radius during an active experiment
- **Always** stop the experiment immediately if customer-facing metrics degrade

## Tool Selection Guide

| Environment | Recommended Tool |
|------------|----------------|
| Kubernetes (open source) | LitmusChaos or Chaos Mesh |
| AWS (managed) | AWS Fault Injection Simulator (FIS) |
| Docker containers | Pumba |
| Local dev / testing | Toxiproxy |
| Go services | Programmatic injection in unit tests |
| Python services | unittest.mock + pytest parametrization |
| Full stack (mixed) | Gremlin (commercial) |

## When to Trigger This Skill

This skill activates when the user mentions:
- Running chaos experiments
- Fault injection testing
- GameDays or resilience testing
- LitmusChaos, Chaos Mesh, Gremlin, Pumba
- Breaking things on purpose
- Microservices reliability
- Circuit breakers, bulkheads, timeouts
- Netflix Chaos Monkey

---

*Last updated: 2026-03-28*
