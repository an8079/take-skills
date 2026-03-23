# Governance Modes / 治理模式

> **版本:** v1.0.0 | **日期:** 2026-03-23

---

## Overview / 概述

Three-tier governance system controlling process strictness, gate enforcement, artifact requirements, and audit depth.

三层治理系统，控制流程严格性、门禁执行、产物要求和审计深度。

| Mode | 适用场景 | Gates | Audit | Security | Team |
|------|----------|-------|-------|----------|------|
| **Lite** | 快速迭代、POC、原型 | Minimal | None | None | Disabled |
| **Standard** | 常规项目、团队协作 | Core | Basic | Core | Enabled |
| **Strict** | 安全敏感、合规要求 | Full | Complete | Full | Full |

---

## Gate Strictness Levels / 门禁严格级别

| Level | 行为 |
|-------|------|
| `none` | Gate skipped, no check |
| `warning` | Gate runs, failures logged but not blocking |
| `required` | Gate must pass, failures block phase progression |

### Phase Gate Matrix / 阶段门禁矩阵

| Phase | Lite | Standard | Strict |
|-------|------|----------|--------|
| `interview` | warning | required | required |
| `spec` | warning | required | required |
| `plan` | none | required | required |
| `execute` | none | warning | required |
| `review` | warning | required | required |
| `qa` | warning | required | required |
| `ship` | none | required | required |

---

## Lite Mode / Lite 模式

**Use for:** Quick iterations, PoCs, prototypes, early exploration

### Characteristics / 特性

- Minimal gates (only `interview` and `spec` with warnings)
- Core artifacts only: `CONTEXT.md`, `SPEC.md`
- No audit logging
- No security checks
- Team features disabled
- Phase skipping allowed
- Up to 3 active phases simultaneously
- Auto-advance enabled

### When to Use / 使用场景

- Initial project exploration
- Rapid prototyping where speed is critical
- Solo development with full context
- Spike investigations

### Artifacts / 产物

**Required:**
- `CONTEXT.md` - Phase context and decisions
- `SPEC.md` - Specification document

**Optional:**
- Architecture diagram
- API contract
- Database schema
- Deployment guide

---

## Standard Mode / Standard 模式

**Use for:** Most production projects, team collaboration

### Characteristics / 特性

- Core gates enforced (`interview`, `spec`, `plan`, `review`, `qa`, `ship`)
- Complete artifacts: `CONTEXT.md`, `SPEC.md`, `PLAN.md`, test results, review notes
- Basic audit logging (phase transitions, approvals, gate violations, config changes)
- Core security enabled (code signoff required, block on vulnerabilities)
- Team features enabled (multi-agent coordination, approval workflows)
- No phase skipping
- Single active phase
- Explicit completion required

### When to Use / 使用场景

- Standard development workflows
- Team projects requiring coordination
- Projects needing audit trails without full compliance overhead
- Production-ready applications

### Artifacts / 产物

**Required:**
- `CONTEXT.md` - Phase context and decisions
- `SPEC.md` - Specification document
- `PLAN.md` - Implementation plan
- Test Results - Test execution results
- Review Notes - Code review findings

**Optional:**
- Architecture diagram
- API contract
- Database schema
- Deployment guide

### Audit Events / 审计事件

- Phase transitions
- Approval requests and decisions
- Gate violations (blocking and warning)
- Configuration changes

---

## Strict Mode / Strict 模式

**Use for:** Security-sensitive projects, compliance requirements, formal approvals

### Characteristics / 特性

- All gates enforced with `required` strictness
- Full artifact set including security-specific artifacts
- Complete audit logging (includes team events)
- Full security (code signoff, security review, vulnerability blocking)
- Full team features (multi-agent coordination, role enforcement, approval workflows, auto-escalation)
- No phase skipping
- Single active phase
- Explicit completion required

### When to Use / 使用场景

- Security-critical applications
- Regulated industries (finance, healthcare, government)
- Projects requiring formal audit trails
- Compliance-mandated environments
- Multi-team coordination with role enforcement

### Artifacts / 产物

**Required:**
- `CONTEXT.md` - Phase context and decisions
- `SPEC.md` - Specification document
- `PLAN.md` - Implementation plan
- Test Results - Test execution results
- Review Notes - Code review findings
- Security Scan Report - Security vulnerability scan
- Audit Trail - Complete decision audit trail
- Sign-off Records - Formal approval sign-offs

**Optional:**
- Threat Model - Security threat assessment
- Performance Benchmarks - Performance test results
- Architecture diagram
- API contract
- Database schema
- Deployment guide

### Security Gates / 安全门禁

| Check | Standard | Strict |
|-------|----------|--------|
| Code Signoff | Required | Required |
| Security Review | Optional | Required |
| Block on Vulnerabilities | Yes | Yes |

### Team Features / 团队功能

| Feature | Standard | Strict |
|---------|----------|--------|
| Multi-Agent Coordination | Yes | Yes |
| Role Enforcement | No | Yes |
| Approval Workflows | Yes | Yes |
| Auto-Escalation | No | Yes |

---

## Switching Modes / 模式切换

### Runtime Switch / 运行时切换

```typescript
import { ModeContext } from "./governance/mode-context.js";

const ctx = new ModeContext({ initialMode: "standard" });

// Check current mode
ctx.getMode(); // "standard"

// Switch modes
ctx.switchMode("strict", "Security requirements increased", "security-team");

// Check capabilities
ctx.isGateBlocking("execute"); // true in strict, false in standard
```

### Programmatic Switch / 程序化切换

```typescript
import { GOVERNANCE_MODES } from "./governance/modes.js";

// Direct mode access
const strictConfig = GOVERNANCE_MODES.strict;

// Check mode properties
if (strictConfig.security.requireSecurityReview) {
  // Enforce security review gate
}
```

### Dynamic Mode Detection / 动态模式检测

```typescript
function enforceGate(ctx: ModeContext, phase: PhaseName): void {
  const strictness = ctx.getGateForPhase(phase);

  switch (strictness) {
    case "required":
      // Must pass or block
      break;
    case "warning":
      // Log and continue
      break;
    case "none":
      // Skip gate entirely
      break;
  }
}
```

---

## API Reference / API 参考

### ModeConfig / 模式配置

```typescript
interface ModeConfig {
  id: GovernanceMode;           // "lite" | "standard" | "strict"
  name: string;
  description: string;
  gates: GateConfig;            // Strictness per phase
  artifacts: {
    minRequired: Artifact[];
    optional: Artifact[];
  };
  audit: AuditConfig;          // Audit logging settings
  security: SecurityConfig;    // Security settings
  teamFeatures: TeamConfig;   // Team feature settings
  process: ProcessConfig;     // Process behavior settings
}
```

### ModeContext / 模式上下文

```typescript
class ModeContext {
  // Mode access
  getMode(): GovernanceMode;
  getModeConfig(): ModeConfig;
  getGates(): Record<PhaseName, GateStrictness>;
  getGateForPhase(phase: PhaseName): GateStrictness;

  // Capability checks
  isGateEnabled(phase: PhaseName): boolean;
  isGateBlocking(phase: PhaseName): boolean;
  isAuditEnabled(): boolean;
  isSecurityEnabled(): boolean;
  isTeamFeaturesEnabled(): boolean;

  // Mode transitions
  canSwitchMode(): boolean;
  switchMode(mode: GovernanceMode, reason?: string, actor?: string): boolean;
  getTransitionHistory(): ModeTransitionEvent[];

  // Comparison
  isMode(mode: GovernanceMode): boolean;
  isAtLeastStrictness(requested: GovernanceMode): boolean;
}
```

### GovernanceMode Type / 治理模式类型

```typescript
type GovernanceMode = "lite" | "standard" | "strict";

type GateStrictness = "none" | "warning" | "required";

type PhaseName = "interview" | "spec" | "plan" | "execute" | "review" | "qa" | "ship";
```

---

## Migration Guide / 迁移指南

### Lite to Standard

1. Enable audit logging
2. Add `PLAN.md` artifact requirement
3. Enforce `interview` and `spec` gates as required
4. Disable phase skipping

### Standard to Strict

1. Enable full security review gates
2. Add security-specific artifacts (scan report, threat model)
3. Enable role enforcement in team features
4. Enable auto-escalation
5. Enable team event audit logging

### Downgrading / 降级

When switching to a less strict mode:

1. Review pending approvals and gates
2. Clear or migrate incomplete audits
3. Verify no blocking operations are in flight
4. Update team feature configurations

---

## File Structure / 文件结构

```
src/governance/
├── index.ts           # Module exports
├── modes.ts           # Mode definitions (LITE_MODE, STANDARD_MODE, STRICT_MODE)
├── mode-context.ts   # Runtime mode context management
├── audit-log.ts       # Audit logging
└── process-controller.ts  # Process control

docs/
└── MODES.md           # This documentation
```
