English | [中文](README.md)

# claude-studio

**Intelligent Multi-Agent Orchestration for Claude Code.**

Multi-agent orchestration framework that coordinates specialized agents, tools, and skills for end-to-end software development.

---

## Quick Start

**Step 1: Install dependencies**

```bash
# Verify Claude Code is installed
claude --version
```

**Step 2: Explore the structure**

```bash
# Core directories
agents/    # 5 specialized agents
commands/  # 8 development commands
skills/    # Domain skill library
docs/      # Technical specifications
rules/     # Architecture & security rules
scripts/   # Engineering scripts
```

**Step 3: Start building**

```
/interview  # Requirements interview
/plan       # Task planning
/code       # Implementation
/test       # Testing
/review     # Code review
```

---

## Architecture

### Agents (5 Core)

| Agent | Role |
|-------|------|
| `interviewer` | Requirements discovery |
| `architect` | System design |
| `coder` | Implementation |
| `reviewer` | Code review |
| `debug-helper` | Debugging assistant |

### Commands (8 Core)

| Command | Purpose |
|---------|---------|
| `/interview` | Requirements interview |
| `/spec` | Specification design |
| `/plan` | Task planning |
| `/code` | Implementation |
| `/tdd` | TDD mode |
| `/test` | Testing |
| `/review` | Code review |
| `/debug` | Debug mode |

---

## Development Workflow

```
Requirements Interview → Specification → Planning → Implementation → Testing → Review → Delivery
```

### Phase Flow

| Phase | Command | Description |
|-------|---------|-------------|
| Interview | `/interview` | Discover requirements via Socratic questioning |
| Spec | `/spec` | Create technical specification |
| Plan | `/plan` | Break down into executable tasks |
| Code | `/code` | Implement features |
| Test | `/test` | Verify functionality |
| Review | `/review` | Quality assurance |
| Debug | `/debug` | Fix issues |

---

## Skills Library

Domain-specific skills extend agent capabilities:

| Skill | Description |
|-------|-------------|
| `git-workflow/` | Git operations and workflow |
| `code-review/` | Code quality analysis |
| `claude-skills/` | Meta-skill for creating skills |
| `mcp-builder/` | MCP server development |
| `webapp-testing/` | Web application testing |
| `pdf-skills/` | PDF manipulation |
| `docx/` | Word document handling |
| `graphql/` | GraphQL development |
| `kubernetes/` | K8s deployment |
| `rust-patterns/` | Rust idioms |
| `go-patterns/` | Go idioms |
| `java-spring/` | Spring framework |
| `nextjs/` | Next.js development |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `phase-manager.js` | Phase management |
| `scope-manager.js` | Scope management |
| `memory-manager.js` | Memory management |
| `architecture-validator.js` | Architecture validation |
| `code-entropy.js` | Code entropy governance |
| `project-analyzer.js` | Project analysis |

---

## Trigger Keywords

| Input | Behavior |
|-------|----------|
| `开始访谈` | Enter interview mode |
| `导入项目` | Import existing project |
| `分析项目` | Analyze project architecture |
| `设置范围` | Manage development scope |

---

## Documentation

- `docs/` - Technical specification documents
- `docs/spec-template.md` - Specification template
- `docs/deploy/` - Deployment configuration templates

## License

MIT
