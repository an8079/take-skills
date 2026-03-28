---
name: observability
description: "Observability engineering: distributed tracing, structured logging, and metrics with OpenTelemetry. Use when implementing observability in microservices, debugging production with traces, writing SLIs/SLOs/SLAs, or setting up the three pillars (logs, metrics, traces). Covers OpenTelemetry SDK, Jaeger, Prometheus, Grafana, Honeycomb, and Datadog."
---

# Observability — See Inside Your Systems

## The Three Pillars

```
┌─────────────────────────────────────────────────────────┐
│                    OBSERVABILITY                        │
│                                                         │
│   📊 Metrics        📝 Logs          🔍 Traces           │
│   (what happened)  (what happened)  (why it happened)    │
│                                                         │
│   Prometheus       Loki/ELK        Jaeger/Honeycomb      │
│   Datadog          Fluentd         OpenTelemetry        │
└─────────────────────────────────────────────────────────┘
```

## Structured Logging (The Foundation)

### Golden Rules
```
✅ Always use structured JSON: {"level": "info", "msg": "...", "trace_id": "..."}
✅ Include correlation IDs in every log line
✅ Use log levels correctly: ERROR for failures, WARN for degradation, INFO for milestones
✅ Never log PII, passwords, or tokens
```

### Python: Structlog
```python
import structlog
from datetime import datetime

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger()

log.info("order_created",
    order_id="ord-abc123",
    user_id="usr-456",
    sku_count=3,
    total=149.99,
    trace_id="abc123",      # always include trace ID
    span_id="span-def456",  # for correlation
)
```

### Go: Zap
```go
import "go.uber.org/zap"

logger, _ := zap.NewProduction()
defer logger.Sync()

logger.Info("order processed",
    zap.String("order_id", "ord-abc123"),
    zap.String("user_id", "usr-456"),
    zap.Int("sku_count", 3),
    zap.Float64("total", 149.99),
    zap.String("trace_id", traceID),
)
```

### Log Correlation Pattern
```python
# Always inject trace context from request headers
def process_order(request):
    trace_id = request.headers.get("X-Trace-ID", generate_trace_id())
    log = structlog.get_logger().bind(trace_id=trace_id)

    log.info("processing_order", order_id=request.body.order_id)

    try:
        result = order_service.create(request.body)
        log.info("order_created", order_id=result.id)
        return result
    except PaymentError as e:
        log.error("payment_failed",
            error=str(e),
            error_code=e.code,
            order_id=request.body.order_id,
            exc_info=True,  # include stack trace in structured form
        )
        raise
```

---

## Distributed Tracing (OpenTelemetry)

### The Tracing Data Model
```
Span: A unit of work
  - name: "HTTP POST /orders"
  - start_time / end_time
  - attributes: {http.method, http.url, http.status_code}
  - events: sub-annotations within the span
  - span_id: unique ID within a trace
  - trace_id: shared across all spans in one request

Trace: End-to-end request path
  [HTTP span] → [auth span] → [db span] → [payment span] → [response span]
       ↓              ↓             ↓              ↓              ↓
  trace_id: abc... (same across all spans)
```

### Python OpenTelemetry Setup
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# Initialize tracer
provider = TracerProvider()
processor = BatchSpanProcessor(ConsoleSpanExporter())  # dev mode
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

# Instrument Flask automatically
FlaskInstrumentor().instrument_app(app)

# Manual span wrapping
def create_order(order_data):
    with tracer.start_as_current_span("order.create") as span:
        span.set_attribute("order.cart_id", order_data.cart_id)
        span.set_attribute("order.item_count", len(order_data.items))

        try:
            result = order_service.create(order_data)
            span.set_attribute("order.id", result.id)
            span.set_attribute("order.total", result.total)
            span.set_status(trace.Status(trace.StatusCode.OK))
            return result
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            raise
```

### Go OpenTelemetry Setup
```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
    "go.opentelemetry.io/otel/sdk/trace"
)

func initTracer() (*trace.TracerProvider, error) {
    exporter, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
    if err != nil {
        return nil, err
    }

    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(
            resource.NewWithAttributes(
                semconv.ServiceName("order-service"),
                semconv.ServiceVersion("1.4.2"),
            ),
        ),
    )

    otel.SetTracerProvider(tp)
    return tp, nil
}

// In HTTP handler
func createOrder(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tracer := otel.Tracer("order-service")

    _, span := tracer.Start(ctx, "http.create_order")
    defer span.End()

    span.SetAttributes(
        attribute.String("http.method", "POST"),
        attribute.String("http.url", r.URL.Path),
    )

    if err := processOrder(ctx, r.Body); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        http.Error(w, err.Error(), 500)
        return
    }
    span.SetStatus(codes.Ok, "")
}
```

### Auto-Instrumentation (Zero-Code)
```bash
# Python: auto-instrument all libraries
OTEL_SERVICE_NAME=order-service \
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 \
opentelemetry-instrument \
  --service-name order-service \
  python app.py

# Node.js: auto-instrument
node --require @opentelemetry/auto-instrumentations-node/register app.js
```

---

## Metrics — RED and USE Methods

### RED Method (Request-Tracking Services)
```
Rate:     requests per second
Errors:   error rate (errors / total)
Duration: latency distribution (p50, p95, p99)
```

### USE Method (Resource-Tracking Services)
```
Utilization: % busy
Saturation:  queue depth / backlog
Errors:      error count
```

### Prometheus Metrics Pattern
```python
from prometheus_client import Counter, Histogram, Gauge

# Request metrics (RED)
order_requests = Counter(
    'order_requests_total',
    'Total order requests',
    ['method', 'endpoint', 'status']
)
order_latency = Histogram(
    'order_request_duration_seconds',
    'Order request latency',
    ['method', 'endpoint'],
    buckets=[.005, .01, .025, .05, .1, .25, .5, 1.0]
)

# Business metrics (custom)
orders_created = Counter('orders_created_total', 'Orders created')
active_orders = Gauge('active_orders', 'Orders currently being processed')

# In code:
@order_latency.labels(method='POST', endpoint='/orders').time()
def create_order():
    orders_created.inc()
    return order_service.create()
```

### Alerting Rules (Prometheus)
```yaml
# prometheus/alerts.yml
groups:
  - name: order-service
    rules:
      - alert: HighOrderLatency
        expr: histogram_quantile(0.95,
            sum(rate(order_request_duration_seconds_bucket[5m])) by (le)
        ) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Order service p95 latency > 500ms"
          runbook: "https://wiki.internal/runbooks/high-latency"

      - alert: OrderServiceDown
        expr: up{job="order-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Order service is down"
          dashboard: "https://grafana.internal/d/order-service"
```

---

## SLIs, SLOs, and Error Budgets

### Defining SLIs (Service Level Indicators)
```
Good SLIs are:
✅ Specific: "p95 latency of HTTP GET /orders"
✅ Measurable: always computable from metrics
✅ Aligned with user experience

Bad SLIs are:
❌ "user satisfaction" (vague, delayed feedback)
❌ "availability" without specifying what "available" means
```

### SLO Template
```
Service:         Order API
SLI:             Request success rate (2xx responses / total)
SLO:             99.5% success rate over 30-day window
Current:         99.7% (error budget: 0.3% remaining)
Error budget:    0.5% × 30 days × 86,400 s/day × 1000 rps = 129,600 allowed errors

Alert thresholds:
  - Warning (budget 50% used): < 99.75% success rate
  - Critical (budget 90% used): < 99.55% success rate
```

### Error Budget Burn Rate Alert
```yaml
# 1h burn rate: if 6x faster than SLO, alert in 10 minutes
- alert: OrderAPIErrorBudgetBurning
  expr: |
    sum(rate(http_requests_total{job="order-api",status=~"5.."}[1h]))
    / sum(rate(http_requests_total{job="order-api"}[1h]))
    > (1 - 0.995) * 6
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Order API error budget burning fast"
    budget_remaining: "{{ $value | humanizePercentage }}"
```

---

## Grafana Dashboard Patterns

### Essential Dashboard Panels
```
1. Request Rate (requests/sec by endpoint)
2. Error Rate (5xx rate, by service)
3. Latency (p50/p95/p99 overlay)
4. Saturation (CPU, memory, connections)
5. SLO gauge (current vs. target)
6. Error budget remaining
7. Top 10 slow endpoints
8. Trace sample links (clickable → Jaeger)
```

### Grafana JSON Dashboard Snippet
```json
{
  "title": "Order Service Overview",
  "panels": [
    {
      "title": "Request Rate (req/s)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{service=\"order\"}[5m])) by (route)",
          "legendFormat": "{{route}}"
        }
      ]
    },
    {
      "title": "p99 Latency (ms)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service=\"order\"}[5m])) by (le)) * 1000",
          "legendFormat": "p99"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "ms",
          "thresholds": {
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 200},
              {"color": "red", "value": 500}
            ]
          }
        }
      }
    }
  ]
}
```

---

## Debugging with Traces

### Jaeger Trace Analysis
```
Common patterns to identify in traces:

1. CASCADE: One slow service → all downstream services appear slow
   → Find the root cause span (longest self-time)

2. SERIAL: Spans stacked vertically, all must wait for previous
   → Look for parallelization opportunities

3. NOISE: One trace has huge latency, others fine
   → Check for GC pauses, network blips, or cold cache

4. CONFLICT: Two services disagree on state
   → Database lock contention, cache incoherence
```

### Trace → Log Correlation
```python
# Extract trace_id from span and inject into log context
from opentelemetry import trace

def log_from_span(span, message, **kwargs):
    trace_id = format(span.get_span_context().trace_id, '032x')
    kwargs['trace_id'] = trace_id
    structlog.get_logger().info(message, **kwargs)

with tracer.start_as_current_span("db.query") as span:
    trace_id = format(span.get_span_context().trace_id, '032x')
    log.info("executing query",
        trace_id=trace_id,
        query=sql,
        params=params,
    )
    result = db.execute(sql, params)
    log.info("query complete",
        trace_id=trace_id,
        rows=len(result),
        duration_ms=duration,
    )
```

---

## When to Trigger This Skill

- Setting up observability in a new service
- Distributed tracing with OpenTelemetry
- Writing SLIs, SLOs, or error budgets
- Debugging a production incident using traces
- Prometheus/Grafana dashboards
- Structured logging in Python, Go, TypeScript, or Java
- Auto-instrumentation for Flask, FastAPI, Django, Express
- Correlating logs, traces, and metrics

---

*Last updated: 2026-03-28*
