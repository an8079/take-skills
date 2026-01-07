---
name: skill-creator
description: "智能 Skill 创建器：在项目沟通中自动识别是否需要创建专用 Skill，自动调用 create-skill.sh 生成骨架、填充内容、用 validate-skill.sh 验证。触发词：需要新技能、创建skill、生成skill。"
---

# skill-creator Skill

在项目沟通过程中，自动判断是否需要为当前项目创建专用 Skill，如果需要则自动完成：骨架生成 → 内容填充 → 质量验证。

## When to Use This Skill

触发此技能当：
- 项目涉及特定领域/工具，现有 Skills 库中没有覆盖
- 用户明确说「需要新技能」「创建 skill」「生成 skill」
- 访谈过程中发现需要专门的领域知识才能高质量完成项目
- 项目技术栈包含不熟悉的框架/库/工具

自动判断标准（满足任一即触发）：
1. 项目使用的技术栈在 `i18n/zh/skills/` 中不存在对应 Skill
2. 项目领域需要专门的最佳实践、常见模式、避坑指南
3. 预计该 Skill 未来可复用于其他项目

## Not For / Boundaries

此技能不适用于：
- 一次性的简单任务（不值得创建 Skill）
- 已有现成 Skill 覆盖的领域
- 通用编程知识（不需要专门 Skill）

必要输入：
- 领域/工具名称
- 核心使用场景
- 可选：官方文档链接或参考资料

## Quick Reference

### 完整工作流

```
判断是否需要 Skill → 生成骨架 → 填充内容 → 验证 → 集成到项目
```

### 判断清单

| 问题 | 是 → 创建 | 否 → 跳过 |
|------|-----------|-----------|
| 现有 Skills 库有覆盖吗？ | 无 | 有 |
| 需要专门的最佳实践吗？ | 是 | 否 |
| 未来可复用吗？ | 是 | 否 |
| 领域复杂度高吗？ | 高 | 低 |

### 创建流程（Windows 兼容）

由于验证脚本需要 bash 环境，流程分为两步：

**步骤 1：AI 直接创建 SKILL.md**（无需脚本）
- 在 `i18n/zh/skills/<skill-name>/` 目录下创建文件
- 按 claude-skills 规范填充内容

**步骤 2：提示用户手动验证**
```
⏸️ **暂停：请手动验证新创建的 Skill**

请在 Git Bash 中运行以下命令验证：

cd i18n/zh/skills/claude-skills
./scripts/validate-skill.sh ../<skill-name> --strict

验证通过后回复「继续」，我将继续访谈。
如果验证失败，请告诉我错误信息，我来修复。
```

### SKILL.md 必填章节

```markdown
---
name: skill-name
description: "做什么 + 何时触发"
---

# skill-name Skill
## When to Use This Skill
## Not For / Boundaries
## Quick Reference
## Examples（≥3 个）
## References
## Maintenance
```

### 内容填充要点

| 章节 | 要点 |
|------|------|
| description | 包含触发关键词 |
| When to Use | 具体场景，可判定 |
| Not For | 明确边界，防误触发 |
| Quick Reference | ≤20 个可直接用的模式 |
| Examples | ≥3 个端到端示例 |

## Examples

### Example 1: 项目需要 FastAPI 技能

- 场景：用户说「我要做一个 FastAPI 后端项目」
- 判断：
  - 检查 `i18n/zh/skills/` → 无 fastapi 目录
  - FastAPI 有专门的最佳实践 → 需要
  - 未来可复用 → 是
- 步骤：
  1. AI 直接创建 `i18n/zh/skills/fastapi/SKILL.md`
  2. 填充内容：路由设计、依赖注入、Pydantic 模型、中间件等
  3. 提示用户在 Git Bash 中运行验证：
     ```
     cd i18n/zh/skills/claude-skills
     ./scripts/validate-skill.sh ../fastapi --strict
     ```
  4. 用户回复验证结果，通过后继续访谈
- 验收：`i18n/zh/skills/fastapi/` 存在且验证通过

### Example 2: 项目需要 Supabase 技能

- 场景：用户说「我要用 Supabase 做后端」
- 判断：无现有 Skill，BaaS 有专门用法 → 需要创建
- 步骤：
  1. AI 直接创建 `i18n/zh/skills/supabase/SKILL.md`
  2. 填充：认证、数据库、存储、实时订阅、Edge Functions
  3. 提示用户验证：`./scripts/validate-skill.sh ../supabase --strict`
  4. 用户确认后继续
- 验收：Skill 创建完成，项目可继续

### Example 3: 项目不需要新 Skill

- 场景：用户说「我要做一个 Python CLI 工具」
- 判断：
  - Python CLI 是通用知识
  - 复杂度不高
  - 不需要专门 Skill
- 步骤：直接进入项目开发，不创建 Skill
- 验收：跳过 Skill 创建，节省时间

### Example 4: 访谈中发现需要 Skill

- 场景：访谈到第 3 轮，发现项目要用 Stripe 支付
- 判断：
  - Stripe 有复杂的 API 和 Webhook 流程
  - 支付领域需要专门的安全最佳实践
  - 未来可复用
- 步骤：
  1. 暂停访谈：「检测到项目需要 Stripe 集成，我先创建一个 Stripe Skill」
  2. AI 创建 `i18n/zh/skills/stripe/SKILL.md`
  3. 提示用户验证
  4. 用户确认后继续访谈
- 验收：Skill 创建完成，访谈继续

## References

依赖的工具：
- `i18n/zh/skills/claude-skills/scripts/create-skill.sh` — 骨架生成器
- `i18n/zh/skills/claude-skills/scripts/validate-skill.sh` — 质量验证器
- `i18n/zh/skills/claude-skills/SKILL.md` — 元技能规范

现有 Skills 库：
- `i18n/zh/skills/` — 检查是否已有覆盖

模板文件：
- `i18n/zh/skills/claude-skills/assets/template-minimal.md`
- `i18n/zh/skills/claude-skills/assets/template-complete.md`

## Maintenance

- 来源：基于 claude-skills 元技能扩展
- 最后更新：2026-01-06
- 已知限制：
  - 需要 bash 环境运行脚本（Windows 用 Git Bash）
  - 自动判断基于启发式规则，复杂情况需人工确认
