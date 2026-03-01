# Tech Stack Selection Best Practices

## Evaluation Criteria

When selecting a technology stack, consider these dimensions:

### 1. Business Alignment
- **Time to Market**: How quickly can we deliver MVP?
- **Development Cost**: What are the development and maintenance costs?
- **Team Expertise**: Do we have existing skills or is learning curve acceptable?
- **Scalability Requirements**: Can the stack handle projected growth?

### 2. Technical Merit
- **Performance**: Does it meet performance requirements?
- **Security**: Are there known vulnerabilities or security issues?
- **Maintainability**: Is the codebase easy to maintain long-term?
- **Integration**: How well does it integrate with existing systems?

### 3. Ecosystem Health
- **Community Support**: Is there an active community?
- **Documentation Quality**: Are docs comprehensive and up-to-date?
- **Package Ecosystem**: Are required packages available and maintained?
- **Talent Availability**: Is it easy to hire developers?

### 4. Operational Considerations
- **Deployment Complexity**: How complex is production deployment?
- **Monitoring**: What tooling exists for observability?
- **CI/CD Support**: How well does it integrate with CI/CD pipelines?
- **Cost of Operations**: What are infrastructure costs?

---

## Decision Framework

Use this scoring rubric for technology evaluation:

| Criterion | Weight (1-5) | Score (1-10) | Weighted Score |
|-----------|------------------|----------------|----------------|
| Time to Market | | | |
|` Development Cost | | | |
| Team Expertise | | | |
| Performance | | | |
| Scalability | | | |
| Security | | | |
| Ecosystem | | | |
| Maintainability | | | |
| **Total** | | | |

**Decision Rule:** Score > 70 = Approved, 50-70 = Needs Review, < 50 = Not Recommended

---

## Common Stack Patterns

### Modern Web Application
```
Frontend: Next.js + React + TypeScript
UI: Tailwind CSS + shadcn/ui
Backend: Node.js + Express/Fastify
Database: PostgreSQL + Prisma
Auth: NextAuth.js / Auth0
Deployment: Vercel / Netlify
```

### Enterprise SaaS
```
Frontend: React + TypeScript
State: Zustand / Redux Toolkit
UI: Material-UI / Ant Design
Backend: Node.js/Go + gRPC
Database: PostgreSQL + Redis
Message Queue: RabbitMQ / Kafka
Auth: OAuth 2.0 + JWT
Monitoring: Prometheus + Grafana
Deployment: Kubernetes + AWS/GCP
```

### Data-Intensive Application
```
Backend: Python (FastAPI/Django)
Data Processing: Apache Spark / Ray
Database: PostgreSQL + TimescaleDB
Cache: Redis
Analytics: ClickHouse / BigQuery
ML Pipeline: scikit-learn / TensorFlow
```

### High-Performance API
```
Backend: Go / Rust
Framework: Gin / Axum
Database: PostgreSQL + Redis
API: gRPC / REST
Validation: Protobuf
Benchmarking: BenchmarkGo / Criterion
```

---

## Anti-Patterns to Avoid

### 1. Over-Engineering
- **Problem**: Using complex stacks for simple requirements
- **Example**: GraphQL for simple CRUD, Microservices for monolith use case
- **Solution**: Start simple, scale when needed

### 2. Legacy Lock-in
- **Problem**: Choosing dying technologies with no migration path
- **Example**: jQuery for new projects, Angular.js v1
- **Solution**: Prefer actively maintained frameworks

### 3. Resume-Driven Development
- **Problem**: Choosing technologies based on resume building, not project needs
- **Example**: Kubernetes for simple static site
- **Solution**: Match technology to problem

### 4. Framework Fatigue
- **Problem**: Constantly chasing new frameworks
- **Example**: Rewriting in Svelte from Vue just because it's new
- **Solution**: Evaluate migration value vs. cost

---

## Migration Considerations

When replacing a technology stack, assess:

### 1. Transition Plan
- Can we run side-by-side with legacy?
- What's the data migration strategy?
- How do we handle API compatibility?
- What's the rollback plan?

### 2. Risk Assessment
- **Timeline Impact**: How long will migration take?
- **Team Availability**: Who owns the migration?
- **Business Continuity**: Can we ship features during migration?
- **Unknown Unknowns**: What risks haven't we identified?

### 3. Incremental Adoption
- Start with non-critical systems
- Use feature flags for gradual rollout
- Monitor metrics at each stage
- Have clear success criteria

---

## Technology Radar

### Adopt (Recommend for immediate use)
- React 18+ (with React Server Components)
- Next.js 14+ (App Router)
- TypeScript 5+
- PostgreSQL 16+
- Node.js 20+
- Prisma 5+

### Trial (Worth exploring in pilot projects)
- Bun (JavaScript runtime)
- Deno (JavaScript runtime)
- SvelteKit (Frontend framework)
- EdgeDB (Edge database)
- Drizzle ORM (Type-safe ORM)

### Assess (Monitor for maturity)
- AI/LLM frameworks (LangChain, Vercel AI SDK)
- Serverless platforms (beyond AWS Lambda)
- WASM deployment patterns
- Edge computing frameworks

### Hold (Avoid using in new projects)
- Create React App (deprecated)
- Webpack (use Next.js, Vite, or esbuild)
- Class components in React (prefer hooks)
- Babel (use SWC)
- Redux Toolkit (simpler alternatives exist)

---

## Decision Documentation

Every technology decision should be recorded with:

| Decision | Date | Chosen Option | Alternatives Considered | Rationale | Stakeholders | Review Date |
|----------|------|----------------|-------------------------|-----------|---------------|--------------|
| [Decision] | | | | | | |

---

*Reference document for tech-stack-detection skill*
