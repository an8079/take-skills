# Team Pipeline

## Overview

The team pipeline is a staged execution model:

```
team-plan → team-prd → team-exec → team-verify → team-fix (loop)
```

## Stage Definitions

### team-plan
- Task decomposition
- Resource allocation
- Dependency analysis
- Timeline estimation

### team-prd
- Requirements documentation
- Acceptance criteria
- Scope boundaries
- Success metrics

### team-exec
- Implementation
- Unit testing
- Integration
- Documentation

### team-verify
- Test verification
- Quality checks
- Acceptance testing
- Performance validation

### team-fix
- Issue identification
- Root cause analysis
- Corrective action
- Re-verification

## Loop Boundaries

- Maximum fix iterations: 3
- Exceeding limit → failed state
- Resume from last incomplete stage

## State Transitions

| Current | Next | Trigger |
|---------|------|---------|
| team-plan | team-prd | Plan approved |
| team-prd | team-exec | PRD signed off |
| team-exec | team-verify | All tasks done |
| team-verify | team-fix | Issues found |
| team-fix | team-exec | Fixes applied |

## Terminal States

- `complete`: All stages passed
- `failed`: Max iterations exceeded
- `cancelled`: User cancelled
