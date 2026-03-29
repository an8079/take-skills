---
name: api-contract-testing
description: "API contract testing: verify that API providers and consumers honor agreed-upon interfaces without running full integration. Use when building microservices, running Consumer-Driven Contract (CDC) tests, testing REST/GraphQL/Protobuf contracts, or ensuring frontend-backend API compatibility. Covers Pact, OpenAPI validation, GraphQL schema testing, and end-to-end contract suites."
---

# API Contract Testing — Verify Interfaces, Ship Faster

## The Problem Contract Testing Solves

```
Traditional:  Consumer ←→ Provider (full integration required)
              ↑___________full stack deployment needed___________↑
                         ~40 min CI, all teams blocked

Contract:     Consumer ←→ Contract ←→ Provider
              ↑___________mock + contract________↑
                         ~3 min CI, teams unblocked
```

Contract testing proves that **two services can communicate** without deploying both or running a full integration environment.

## Two Types of Contract Tests

### Consumer-Driven Contract (CDC)
```
Consumer writes: "I expect Provider to respond with {status: 200, body: {id: string}}"
Consumer validates against a MOCK that implements this contract
Consumer publishes contract to a broker (PactFlow, Pact Broker)
Provider pulls contract and verifies: "I can satisfy this contract"
```

### Provider-Side Contract
```
Provider defines: OpenAPI spec (Swagger/YAML) or GraphQL schema or Proto files
Consumer validates: Generated client code + runtime responses match schema
Tools: Dredd, OpenAPI Validator, Spectral
```

## Tool Landscape

| Type | Tool | Best For |
|------|------|---------|
| CDC (HTTP/JSON) | **Pact** | REST microservices, consumer teams |
| CDC (Broker) | **PactFlow** | Enterprise, shared contracts, versioning |
| Provider (OpenAPI) | **Dredd** | Validating API against Swagger/OpenAPI spec |
| Provider (OpenAPI) | **Spectral** | Linting + validating YAML/JSON against rulesets |
| GraphQL | **GraphQL Inspector** | Schema diffs, breaking change detection |
| GraphQL | **Envelop** | Runtime schema validation |
| Proto/GRPC | **grpcurl + buf** | Protobuf contract testing |
| E2E contract | **Postman/Newman** | Full HTTP contract suites |
| Multi-format | **RestAssured** (JVM) | Java REST API testing |

---

## Pact (Consumer + Provider)

### Consumer Test
```python
# tests/consumer/test_order_client.py
import pytest
from pact import Consumer, Provider, Like, Term

@pytest.fixture
def pact():
    consumer = Consumer('OrderFrontend')
    provider = Provider('OrderService')
    return consumer


def test_create_order_returns_201(pact):
    """Consumer: I expect creating an order returns 201 with an order ID."""
    (
        pact.given('a valid cart with items')
        .upon_receiving('a request to create an order')
        .with_request(
            method='POST',
            path='/api/v1/orders',
            headers={'Content-Type': 'application/json', 'Authorization': 'Bearer valid_token'},
            body={
                'cart_id': 'cart-abc-123',
                'items': [
                    {'sku': 'WIDGET-001', 'quantity': 2},
                    {'sku': 'GADGET-002', 'quantity': 1},
                ],
                'shipping_address': {
                    'street': Like('123 Main St'),
                    'city': Term('[A-Za-z\\s]+'),
                    'postal_code': Like('10001'),
                }
            },
        )
        .will_respond_with(
            status=201,
            headers={'Content-Type': 'application/json'},
            body={
                'order_id': Like('ord-xxxxxxxx-xxxx'),
                'status': 'confirmed',
                'total': 149.99,
                'created_at': Term('\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z'),
                'items': [
                    {'sku': 'WIDGET-001', 'quantity': 2, 'price': 49.99},
                    {'sku': 'GADGET-002', 'quantity': 1, 'price': 50.00},
                ],
            },
        )
    )

    with pact:
        result = order_client.create_order(
            cart_id='cart-abc-123',
            items=[{'sku': 'WIDGET-001', 'qty': 2}, {'sku': 'GADGET-002', 'qty': 1}],
            token='valid_token',
        )
        assert result['status'] == 'confirmed'
        assert 'order_id' in result
```

### Provider Verification (CI/CD)
```python
# tests/provider/test_order_service_contract.py
from pact import Verifier
import pytest

@pytest.fixture(scope='module')
def pact_verifier():
    verifier = Verifier(
        provider='OrderService',
        provider_base_url='http://localhost:8080',
    )
    return verifier

def test_order_service_honors_contract(pact_verifier):
    """Provider: Verify we satisfy all registered consumer contracts."""
    results = pact_verifier.verify_with_broker(
        provider_url='https://pactflow.example.com',
        broker_token='${PACT_BROKER_TOKEN}',
        provider_version='1.4.2',
        publish_verification_results=True,
        enable_pending=False,
    )
    assert results['summary']['hasErrors'] is False
```

### Publishing Contract (Consumer CI)
```bash
# In consumer CI after tests pass
pact-broker publish \
  ./pacts \
  --broker-base-url="https://pactflow.example.com" \
  --broker-token="${PACT_BROKER_TOKEN}" \
  --consumer-app-version="${GIT_SHA}"
```

---

## OpenAPI Contract Validation (Dredd)

### Setup
```bash
npm install -g dredd
dredd init
```

### Configuration (dredd.yml)
```yaml
dry-run: null
 hookfiles: "./test-hooks.js"
sandbox: false
server: node ./server.js
server-wait: 3
api-blueprint: ./api-description.apib
endpoint: http://127.0.0.1:8080
header: 'Accept: application/json'
header: "Authorization: Token ${API_TOKEN}"
timestamp: true
verbose: false
level: info
silent: false
only: []
custom: {}
names: false
output: []
format: html
summary: true
details: false
doc: false
config: ./dredd.yml
```

### Test Hooks (Pre/Post Processing)
```javascript
// test-hooks.js
var hooks = require('hooks');

hooks.before('/orders > POST', (transaction, done) => {
    // Inject valid auth token before every POST to /orders
    transaction.request.headers['Authorization'] = 'Bearer test-token-abc123';
    done();
});

hooks.after('/orders > 201 > Response', (transaction) => {
    // Validate response time SLA
    const ms = parseInt(transaction.real.headers['x-response-time'], 10);
    if (ms > 500) {
        throw new Error(`Response time ${ms}ms exceeds 500ms SLA`);
    }
});
```

### CI Integration
```yaml
# .github/workflows/contract.yml
- name: Run Dredd Contract Tests
  run: |
    dredd \
      --config ./dredd.yml \
      --level info
  env:
    API_TOKEN: ${{ secrets.API_TEST_TOKEN }}
```

---

## GraphQL Contract Testing

### Schema Validation (Breaking Change Detection)
```typescript
// graphql-contract.ts
import { diff } from '@graphql-inspector/core';
import { readFileSync } from 'fs';

const currentSchema = readFileSync('./schema.graphql', 'utf-8');
const proposedSchema = readFileSync('./schema-new.graphql', 'utf-8');

const changes = diff(currentSchema, proposedSchema);

const breakingChanges = changes.filter(c => c.criticality === 'BREAKING');

if (breakingChanges.length > 0) {
  console.error('❌ Breaking changes detected:');
  breakingChanges.forEach(c => {
    console.error(`  ${c.criticality}: ${c.message}`);
  });
  process.exit(1);  // fail CI — breaking changes require consumer coordination
} else {
  console.log('✅ No breaking changes — safe to deploy');
}
```

### Runtime Schema Validation (Envelop)
```typescript
// validate-queries.ts — validate incoming queries against schema
import { useSchema } from '@envelop/schema';
import { createYoga, createSchema } from 'graphql-yoga';

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      orders(status: OrderStatus, limit: Int = 20): [Order!]!
    }
    enum OrderStatus { PENDING CONFIRMED SHIPPED DELIVERED CANCELLED }
  `,
});

// Reject queries not in schema (introspection disabled in prod)
const yoga = createYoga({
  schema,
  plugins: [
    useSchema(schema),
    {
      async onValidate({ args }) {
        // Reject unknown fields early
        if (args.schemaAST) {
          validateDocument(args.schema, args.schemaAST);
        }
      }
    }
  ]
});
```

### Consumer Contract (Mocking with GraphQL)
```typescript
// consumer-contract.test.ts
import { execute, buildSchema } from 'graphql';
import { mockSchema } from '@graphql-constraint';

const schema = buildSchema(`
  type Query {
    orders(limit: Int): [Order!]!
  }
  type Order { id: ID!, total: Float! }
`);

const mockedSchema = mockSchema(schema, {
  orders: [
    { id: 'ord-1', total: 99.99 },
    { id: 'ord-2', total: 149.50 },
  ],
});

test('consumer expects orders query', async () => {
  const result = await execute({
    schema: mockedSchema,
    document: parse(`query GetOrders { orders(limit: 10) { id total } }`),
  });

  expect(result.data?.orders).toHaveLength(2);
  expect(result.errors).toBeUndefined();
});
```

---

## Protobuf / gRPC Contract Testing

### Contract Definition
```protobuf
// contracts/order.proto
syntax = "proto3";
package orders.v1;

service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
  rpc GetOrder(GetOrderRequest) returns (Order);
}

message CreateOrderRequest {
  string cart_id = 1;
  repeated OrderItem items = 2;
  Address shipping_address = 3;
}

message OrderItem {
  string sku = 1;
  int32 quantity = 2;
}

message Order {
  string order_id = 1;
  OrderStatus status = 2;
  double total = 3;
  repeated OrderItem items = 4;
}

enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;
  ORDER_STATUS_CONFIRMED = 1;
  ORDER_STATUS_SHIPPED = 2;
  ORDER_STATUS_DELIVERED = 3;
}
```

### Contract Testing with buf + grpcurl
```bash
# Validate proto breaking changes
buf breaking --against '.git#ref=HEAD' --exclude-prefix=google,buf

# Run gRPC contract tests
grpcurl -plaintext \
  -d '{"cart_id": "cart-abc", "items": [{"sku": "WIDGET", "quantity": 1}]}' \
  localhost:50051 orders.v1.OrderService/CreateOrder

# Validate response shape
grpcurl -plaintext \
  -rpc-header "x-contract-version: 1.0" \
  localhost:50051 \
  describe orders.v1.OrderService
```

---

## CI/CD Pipeline Design

```
Consumer CI:
  1. Run unit tests (with mocks)
  2. Run Pact consumer tests → generates contract file
  3. Publish contract to Pact Broker (with version tag)
  4. Register pacts as "pending" for provider

Provider CI:
  1. Pull pending contracts from Pact Broker
  2. Run provider verification against each
  3. Mark pacts as "successfully verified" (unblocks consumer)
  4. If verification fails → block deploy, notify consumer team

Deployment Gate:
  - Consumer: can deploy if all provider pacts are verified
  - Provider: can deploy if all consumer pacts are verified
  - Both: Pact Broker webhooks → trigger deployments
```

---

## Contract Testing vs Integration Testing

| Dimension | Contract Testing | Integration Testing |
|-----------|-----------------|--------------------|
| Scope | Two services | Full system |
| Dependencies | Mocked | Real services |
| Speed | Seconds | Minutes to hours |
| Failure isolation | ✅ Immediate | ❌ Cascading |
| Environment | Local/CI | Staging/Prod |
| Validates | Interface only | End-to-end behavior |
| Best for | Microservices | Shared databases |

---

## Pact Broker (Self-Hosted)

```bash
# docker-compose.yml for self-hosted Pact Broker
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pact_broker
      POSTGRES_USER: pact_broker
      POSTGRES_PASSWORD: pact_broker
  pact_broker:
    image: pactfoundation/pact-broker:2.105.0-0
    ports:
      - "9292:9292"
    environment:
      PACT_BROKER_DATABASE_URL: postgres://pact_broker:pact_broker@postgres:5432/pact_broker
      PACT_BROKER_PORT: 9292
    depends_on:
      - postgres
```

---

## When to Trigger This Skill

- Building or consuming microservices
- CDC (Consumer-Driven Contract) testing
- Pact, PactFlow, or Pact Broker
- OpenAPI/Swagger contract validation
- GraphQL schema breaking change detection
- API versioning and compatibility
- Frontend-backend API contract mismatches
- API consumer team blocked by provider

---

*Last updated: 2026-03-28*
