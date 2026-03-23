# Process Management Skill

> Phase governance and process control for claude-studio

## Overview

This skill provides disciplined phase management with explicit state transitions, stage gates, approval workflows, and full audit trails.

## Phase Lifecycle

```
DRAFT → DISCUSSING → PLANNED → EXECUTING → VERIFYING → COMPLETED → ARCHIVED
              ↓           ↓         ↓          ↓
           BLOCKED ←──────────────────────────────────────
```

## Commands

### Phase Navigation

| Command | Description |
|---------|-------------|
| `/process:status` | Show current phase progress and health |
| `/process:list` | List all phases with their status |
| `/process:current` | Show current active phase details |
| `/process:progress` | Show completion percentage and metrics |

### Phase Transitions

| Command | Description |
|---------|-------------|
| `/process:start-discuss [phase]` | Start discussion phase |
| `/process:end-discuss [phase]` | End discussion, move to planning |
| `/process:start-plan [phase]` | Start planning phase |
| `/process:end-plan [phase]` | End planning, move to execution |
| `/process:start-execute [phase]` | Start execution phase |
| `/process:end-execute [phase]` | End execution, move to verification |
| `/process:start-verify [phase]` | Start verification phase |
| `/process:end-verify [phase]` | Complete verification |

### Gate Management

| Command | Description |
|---------|-------------|
| `/process:check-gate [phase]` | Check if phase passes its stage gate |
| `/process:gate-report [phase]` | Get detailed gate check report |
| `/process:list-gates` | Show all stage gates and criteria |

### Approval Workflow

| Command | Description |
|---------|-------------|
| `/process:approve [phase]` | Approve phase transition |
| `/process:reject [phase] <reason>` | Reject with reason |
| `/process:pending-approvals` | List pending approval requests |
| `/process:approval-history` | Show approval audit trail |

### Process Governance

| Command | Description |
|---------|-------------|
| `/process:audit` | Show recent audit log entries |
| `/process:violations` | List current process violations |
| `/process:enforce` | Run process compliance check |
| `/process:set-mode [mode]` | Set process mode (strict/relaxed/yolo) |

### Deliverable Validation

| Command | Description |
|---------|-------------|
| `/process:check-deliverables [phase]` | Validate phase deliverables |
| `/process:register-deliverable [phase]` | Register a new deliverable |
| `/process:deliverable-status` | Show deliverable summary |

## Process Modes

### Strict Mode (Default)
- Phases must complete in order
- Stage gates enforced
- Approvals required
- Dependencies strictly enforced

### Relaxed Mode
- Phases can start without sequential completion
- Gate checks are warnings only
- Approvals still required for major transitions

### Yolo Mode
- No process enforcement
- Phases can transition freely
- For rapid prototyping only

## Stage Gates

### Discussion Gate
- CONTEXT.md must exist
- Key decisions documented
- Edge cases identified

### Planning Gate
- Research documentation exists
- Plans are valid XML
- Dependencies resolved

### Execution Gate
- All plans committed
- No merge conflicts
- Tests exist

### Verification Gate
- UAT passed
- No critical issues
- Documentation updated

## Integration

The process skill works with:
- `src/phase-manager/` - Core phase state machine and tracking
- `src/governance/` - Process controller and audit logging
- `src/validator/` - Deliverable and phase health validation

## Usage Example

```
User: Let's start phase 2 planning
Claude: /process:start-plan 2

User: Show me what needs to be done
Claude: /process:check-gate 2

User: The deliverables look good
Claude: /process:approve 2

User: /process:end-plan 2
```

## Philosophy

This process system improves on get-shit-done by:
1. **Explicit state machine** - No implicit transitions
2. **Stage gates** - Configurable quality checkpoints
3. **Approval workflows** - Formal sign-offs with audit trail
4. **Dependency tracking** - Clear phase relationships
5. **Process modes** - Balance discipline vs flexibility
