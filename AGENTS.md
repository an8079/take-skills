# AGENTS.md - Agent Catalog

> **Version:** v1.0.0 | **Updated:** 2026-03-01

Multi-agent orchestration system for claude-studio. Each agent has a specialized role in the development lifecycle.

---

## Agent Overview

| Agent | Complexity | Primary Use |
|-------|------------|-------------|
| `interviewer` | Standard | Requirements discovery |
| `architect` | High | System design |
| `coder` | Standard | Implementation |
| `reviewer` | Standard | Code review |
| `debug-helper` | Standard | Debugging |

---

## Agent Specifications

### interviewer

**Role:** Requirements Discovery

**When to use:**
- User has a vague idea
- Need to clarify scope
- Hidden assumptions need to be surfaced
- Socratic questioning required

**Protocol:**
1. Ask clarifying questions
2. Surface hidden constraints
3. Define acceptance criteria
4. Document requirements

**Example invocation:**
```
/interview "I want to build a task management app"
```

---

### architect

**Role:** System Design

**When to use:**
- New project initialization
- Major feature design
- Technology selection
- Boundary definition

**Protocol:**
1. Analyze requirements
2. Design system boundaries
3. Define interfaces
4. Evaluate tradeoffs
5. Document architecture

**Example invocation:**
```
/spec "design a REST API for task management"
```

---

### coder

**Role:** Implementation

**When to use:**
- Feature development
- Refactoring
- Test implementation
- Bug fixes

**Protocol:**
1. Review specifications
2. Implement feature
3. Write tests
4. Verify against spec

**Example invocation:**
```
/code "implement user authentication"
```

---

### reviewer

**Role:** Code Review

**When to use:**
- Before merging changes
- Quality assurance
- Security review
- Performance review

**Protocol:**
1. Review code changes
2. Check for defects
3. Verify best practices
4. Provide feedback

**Example invocation:**
```
/review "review the auth module"
```

---

### debug-helper

**Role:** Debugging Assistant

**When to use:**
- Build errors
- Runtime exceptions
- Logic bugs
- Performance issues

**Protocol:**
1. Reproduce the issue
2. Identify root cause
3. Propose fix
4. Verify resolution

**Example invocation:**
```
/debug "fix the login redirect loop"
```

---

## Agent Composition Patterns

### Feature Development

```
interviewer → architect → coder → test → reviewer → verifier
```

### Bug Investigation

```
explorer + debug-helper + coder + test-engineer + verifier
```

### Code Review

```
reviewer (style) + reviewer (logic) + reviewer (security)
```

### Architecture Review

```
architect + critic + reviewer (security)
```

---

## Model Routing Guidelines

| Complexity | Model | Examples |
|------------|-------|----------|
| Low | haiku | Quick lookups, simple fixes |
| Standard | sonnet | Implementation, debugging, reviews |
| High | opus | Architecture, deep analysis |

---

## Delegation Rules

**Delegate when:**
- Multi-file changes
- Refactoring
- Debugging complex issues
- Reviews requiring specialist knowledge
- Planning and research

**Work directly when:**
- Quick clarifications
- Single file edits
- Trivial operations

---

## State Management

Agents use the `.claude/` directory for persistent state:

- `.claude/state/` - Mode state files
- `.claude/plans/` - Planning documents
- `.claude/logs/` - Execution logs

---

## Quality Gates

Before completion, verify:
- All tests pass
- No lint errors
- No type errors
- Documentation updated
- Acceptance criteria met
