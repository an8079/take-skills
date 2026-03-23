---
name: team
description: "Team collaboration skill: includes task coordination, parallel execution, agent delegation, and team communication protocols. Use when user mentions 'team', 'parallel', 'delegate', 'coordinate', 'agent', or 'collaborate'."
---

# Team Skill

Multi-agent team orchestration and coordination skill.

## When to Use This Skill

Trigger when any of these applies:
- Multiple agents need to coordinate
- Tasks can run in parallel
- Delegation to specialized agents
- Team communication protocols
- Shared state management
- Task decomposition and assignment

## Not For / Boundaries

- Not for single-agent workflows (use direct execution)
- Not for real-time chat/interactive communication
- Not for deployment orchestration (see `deploy` skill)

## Quick Reference

### Team Pipeline

```
team-plan → team-prd → team-exec → team-verify → team-fix (loop)
```

### Stage Transitions

| From | To | Condition |
|------|----|-----------|
| team-plan | team-prd | Planning complete |
| team-prd | team-exec | Scope defined |
| team-exec | team-verify | Tasks complete |
| team-verify | team-fix | Issues found |
| team-fix | team-exec | Fixes ready |

### Delegation Patterns

```bash
# Single agent delegation
/delegate architect "design auth system"

# Parallel delegation (up to 3 concurrent)
/delegate coder "implement user module"
/delegate coder "implement task module"
/delegate tester "write tests"

# Team composition
/team 3:coder "implement features"
```

### Task Assignment

```bash
# Assign to agent
/assign "implement login" to coder

# Check status
/status

# Report progress
/progress
```

### Communication Protocol

```bash
# Broadcast to team
/broadcast "deployment in 5 minutes"

# Send to specific agent
/message architect "design review needed"
```

## Examples

### Example 1: Feature Development Team

- Input: Implement user authentication system
- Team composition:
  - architect: System design
  - coder: Implementation
  - reviewer: Code review
  - tester: Test coverage
- Steps:
  1. architect creates design spec
  2. coder implements based on spec
  3. reviewer checks code quality
  4. tester verifies functionality
- Expected output: Complete, tested, reviewed feature

### Example 2: Parallel Bug Fix

- Input: Fix 5 independent bugs
- Team composition: 5 coders, 1 verifier
- Steps:
  1. Decompose into 5 tasks
  2. Assign to parallel coders
  3. Each fixes independently
  4. Verifier confirms all fixes
- Expected output: All bugs fixed, verified

### Example 3: Code Review Team

- Input: Review large refactor
- Team composition:
  - style-reviewer: Formatting
  - logic-reviewer: Logic defects
  - security-reviewer: Security
- Steps:
  1. Split code by module
  2. Each reviewer checks independently
  3. Synthesize findings
  4. Report comprehensive review
- Expected output: Multi-dimensional review report

## Team Compositions

### Feature Development
```
interviewer → architect → coder → tester → reviewer → verifier
```

### Bug Investigation
```
explorer + debug-helper + coder + tester + verifier
```

### Code Review
```
reviewer (style) + reviewer (logic) + reviewer (security)
```

### Architecture Review
```
architect + critic + reviewer (security)
```

## References

- `references/index.md`: Navigation
- `references/pipeline.md`: Pipeline details
- `references/delegation.md`: Delegation patterns

## Maintenance

- Sources: claude-studio team system
- Last updated: 2026-03-01
- Known limits: Real-time communication not supported
