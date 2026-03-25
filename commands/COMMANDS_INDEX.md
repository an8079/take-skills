# 命令索引

> **版本：** v3.1.0 | 更新日期：2026-03-24
> **项目路径：** `F:\claude-studio\3.4\claude-studio\claude-studio`

---

## 核心命令（8个）

| 命令 | 文件 | 用途 | 阶段 |
|------|------|------|------|
| `/interview` | interview.md | 需求访谈 | 访谈 |
| `/spec` | spec.md | 生成规格文档 | 规格 |
| `/plan` | plan.md | 创建实现计划 | 计划 |
| `/code` | code.md | 进入编码模式 | 编码 |
| `/tdd` | tdd.md | TDD 工作流 | 编码 |
| `/test` | test.md | 运行测试 | 测试 |
| `/review` | review.md | 代码审查 | 审查 |
| `/debug` | debug.md | 调试模式 | 调试 |

---

## 增强命令（3个）

| 命令 | 文件 | 用途 |
|------|------|------|
| `/lyd-analyze` | lyd-analyze.md | 项目分析 |
| `/lyd-scope` | lyd-scope.md | 范围管理 |
| `/lyd-import` | lyd-import.md | 导入项目 |

---

## 自动模式命令（4个）

| 命令 | 文件 | 用途 |
|------|------|------|
| `/lyd-autopilot` | lyd-autopilot.md | 自动驾驶模式 |
| `/lyd-ultraqa` | lyd-ultraqa.md | QA 测试模式 |
| `/lyd-ultrawork` | lyd-ultrawork.md | 高效工作模式 |
| `/lyd-team` | lyd-team.md | 团队协作模式 |

---

## 专项命令（17个）

| 命令 | 文件 | 用途 |
|------|------|------|
| `/lyd-boss` | lyd-boss.md | 老板督导 PUA 模式 |
| `/lyd-reverse-architect` | lyd-reverse-architect.md | 逆向思维架构师 |
| `/lyd-po` | lyd-po.md | 提示词优化器 |
| `/lyd-imapo` | lyd-imapo.md | AI 图像提示词工程师 |
| `/lyd-qa` | lyd-qa.md | 自动化 QA 测试与修复 |
| `/lyd-qa-only` | lyd-qa-only.md | 仅生成缺陷报告 |
| `/lyd-rag` | lyd-rag.md | RAG 检索增强 |
| `/lyd-pua` | lyd-pua.md | PUA 模式 |
| `/lyd-office-hours` | lyd-office-hours.md | 办公时间 |
| `/lyd-structure-thinking` | lyd-structure-thinking.md | 结构化思考 |
| `/lyd-find-product-remind` | lyd-find-product-remind.md | 产品提醒 |
| `/lyd-test-teams` | lyd-test-teams.md | 团队测试 |
| `/lyd-ralph` | lyd-ralph.md | Ralph 循环模式 |
| `/lyd-deep-interview` | lyd-deep-interview.md | 深度访谈模式 |
| `/lyd-auto-interview` | lyd-auto-interview.md | 自动访谈模式 |
| `/lyd-notify` | lyd-notify.md | 通知管理 |

---

## 触发词映射

| 触发词 | 命令 |
|--------|------|
| `开始访谈` | /interview |
| `写规格` | /spec |
| `做计划` | /plan |
| `开始编码` | /code |
| `TDD` | /tdd |
| `跑测试` | /test |
| `审查代码` | /review |
| `调试` | /debug |
| `分析` | /lyd-analyze |
| `范围` | /lyd-scope |
| `导入` | /lyd-import |
| `深度访谈` | /lyd-deep-interview |
| `快速开始` | /interview 快速开始 |
| `pua` | /lyd-pua |
| `团队` | /lyd-team |
| `qa` | /lyd-qa |
| `ultrawork` | /lyd-ultrawork |
| `autopilot` | /lyd-autopilot |
| `ultraqa` | /lyd-ultraqa |
| `ralph` | /lyd-ralph |
| `boss` | /lyd-boss |
| `逆向` | /lyd-reverse-architect |
| `po` | /lyd-po |
| `imapo` | /lyd-imapo |

---

## 流程关系

```
/interview → /spec → /plan → /code → /test → /review
     ↓          ↓        ↓        ↓        ↓        ↓
  需求访谈    规格文档   任务计划   编码     测试     审查
```

---

## 命令 YAML Frontmatter 格式

每个命令文件包含 YAML frontmatter：

```yaml
---
name: 命令名
description: 命令描述
---
```

---

## 阶段钩子配置

命令触发受 `hooks/hooks.json` 控制：

| 钩子类型 | 触发时机 | 脚本 |
|---------|---------|------|
| PreCommandUse | 命令执行前 | phase-validator.js |
| PostCommandUse | 命令执行后 | phase-manager.js next |

---

**总计：31 个命令**
