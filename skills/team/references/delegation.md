# Delegation Patterns

## When to Delegate

**Delegate when:**
- Multi-file implementation
- Complex refactoring
- Debugging requiring specialization
- Reviews needing expert knowledge
- Planning and research tasks
- Parallel independent work

**Direct execution when:**
- Single file edits
- Quick clarifications
- Trivial operations
- <5 minute tasks

## Delegation Protocol

1. Identify the task type
2. Select appropriate agent
3. Prepare task description
4. Set clear acceptance criteria
5. Monitor progress
6. Verify results

## Agent Selection

| Task Type | Agent |
|-----------|-------|
| Requirements | interviewer |
| Architecture | architect |
| Implementation | coder |
| Testing | tester |
| Review | reviewer |
| Debugging | debug-helper |

## Parallel Delegation

- Maximum concurrent agents: 3
- Independent tasks for parallelism
- Dependent tasks sequentially

## Delegation Examples

```bash
# Architecture task
/delegate architect "design payment system"

/# Parallel implementation
/delegate coder "implement user module"
/delegate coder "implement product module"
/delegate coder "implement order module"

/# Verification
/delegate verifier "validate all implementations"
```
