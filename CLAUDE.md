# CLAUDE.md - 项目配置索引

> **版本：** v2.0.0 | **更新日期：** 2026-03-01 | 适配 Claude Code 使用

---

## 核心文件索引

| 类别 | 文件 | 说明 |
|------|------|------|
| **Agent** | `agents/` | 5 个核心 Agent |
| **Command** | `commands/` | 8 个核心命令 |
| **Skills** | `skills/` | 领域技能库 |
| **Rules** | `rules/` | 架构/安全规则 |
| **Scripts** | `scripts/` | 工程化脚本 |

---

## Agents（5 个）

| Agent | 职责 |
|-------|------|
| `interviewer` | 需求访谈 |
| `architect` | 架构设计 |
| `coder` | 编码实现 |
| `reviewer` | 代码审查 |
| `debug-helper` | 调试助手 |

---

## Commands（8 个）

| 命令 | 用途 |
|------|------|
| `/interview` | 需求访谈 |
| `/spec` | 规格设计 |
| `/plan` | 任务计划 |
| `/code` | 编码实现 |
| `/tdd` | TDD 模式 |
| `/test` | 测试验证 |
| `/review` | 代码审查 |
| `/debug` | 调试模式 |

**增量开发命令：** `/import`, `/analyze`, `/scope`

---

## 阶段流程

```
需求访谈 → 规格设计 → 实现计划 → 编码 → 测试 → 审查 → 交付
```

---

## 关键脚本

| 脚本 | 用途 |
|------|------|
| `phase-manager.js` | 阶段管理 |
| `scope-manager.js` | 边界管理 |
| `memory-manager.js` | 记忆管理 |
| `architecture-validator.js` | 架构验证 |
| `code-entropy.js` | 代码熵治理 |
| `project-analyzer.js` | 项目分析 |

---

## 触发词

| 输入 | 行为 |
|------|------|
| `开始访谈` | 进入访谈模式 |
| `导入项目` | 导入现有项目 |
| `分析项目` | 分析项目架构 |
| `设置范围` | 管理开发边界 |

---

## 文档目录

- `docs/` - 技术规格文档
- `docs/spec-template.md` - 规格模板
- `docs/deploy/` - 部署配置模板

---

## 规则目录

- `rules/architecture-boundary.md` - 架构分层规则

**详细文档请查阅对应文件。**
