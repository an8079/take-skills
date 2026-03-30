# 技能索引

> take-skills 官方技能目录
> 更新：2026-03-30 | 技能总数：19

---

## 核心工作流（4个）

| 技能 | 路径 | 用途 |
|------|------|------|
| autopilot | skills/autopilot/SKILL.md | 全自主执行：自动拆解+并行推进+持续迭代 |
| ralplan | skills/ralplan/SKILL.md | 结构化规划：Quick/Standard/Deep/Review 四模式 |
| deep-interview | skills/deep-interview/SKILL.md | 苏格拉底式访谈：三层真相挖掘需求 |
| hud | skills/hud/SKILL.md | 实时任务状态 HUD：进度+风险预警 |

---

## 代码质量（5个）

| 技能 | 路径 | 用途 |
|------|------|------|
| code-review | skills/code-review/SKILL.md | 多角色代码审查团队 |
| api-reviewer | skills/api-reviewer/SKILL.md | API 专项审查（安全性/性能/最佳实践） |
| style-reviewer | skills/style-reviewer/SKILL.md | 代码风格一致性审查 |
| performance-reviewer | skills/performance-reviewer/SKILL.md | 性能专项审查（前后端/DB/并发） |
| chaos-engineering | skills/chaos-engineering/SKILL.md | 混沌工程：故障注入与韧性测试 |

---

## 研发工具（6个）

| 技能 | 路径 | 用途 |
|------|------|------|
| git-rebase | skills/git-rebase/SKILL.md | Git Rebase 专项：交互式变基/冲突处理/Squash |
| git-troubleshooter | skills/git-troubleshooter/SKILL.md | Git 故障排查：冲突/回退/恢复/reflog |
| observability | skills/observability/SKILL.md | 可观测性：日志/指标/链路追踪设计 |
| api-contract-testing | skills/api-contract-testing/SKILL.md | API契约测试：Pact框架 + 消费者驱动 |
| property-based-testing | skills/property-based-testing/SKILL.md | 属性测试：快速蔟+ Shrinking |
| ecomode | skills/ecomode/SKILL.md | 极简执行模式：省token高效率 |

---

## 辅助技能（4个）

| 技能 | 路径 | 用途 |
|------|------|------|
| takes-master | skills/takes-master/SKILL.md | takes 生态系统管理：批量安装/升级/维护 |
| skill-creator | skills/skill-creator-1.0.0/SKILL.md | 从零创建新 SKILL.md 的标准工作流 |
| cron-mastery | skills/cron-mastery/SKILL.md | Cron表达式解析/验证/生成 + OpenClaw定时任务 |
| json-generator | skills/json-generator/SKILL.md | 测试JSON数据生成：faker模式/边界值/异常构造 |

---

## Takes 命令（30个）

位于 `commands/` 目录，触发词为 `/takes-*`：

**分析类**：`takes-analyze` `takes-scope` `takes-import`

**自动类**：`takes-autopilot` `takes-ultraqa` `takes-ultrawork` `takes-team`

**专项类**：`takes-qa` `takes-qa-only` `takes-rag` `takes-pua` `takes-office-hours`

**深度类**：`takes-deep-interview` `takes-auto-interview` `takes-notify` `takes-boss`

**架构类**：`takes-reverse-architect` `takes-po` `takes-imapo` `takes-cleaner`

**思维类**：`takes-structure-thinking` `takes-find-product-remind` `takes-test-teams` `takes-ralph`

---

## YAML Frontmatter 格式

每个技能文件包含 YAML frontmatter：

```yaml
---
name: 技能名
description: 简短描述
triggers:
  - 触发词1
  - 触发词2
---
```

## 安装方式

```bash
# 方式1：一键安装所有技能
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash

# 方式2：选择性安装
cd ~/take-skills/skills && git clone <skill-repo>

# takes-master：管理所有skill
/takes-master install api-reviewer
/takes-master list
```
