---
name: skill-creator
description: 智能技能创建器。自动识别是否需要创建新技能，生成 SKILL.md 文件。
tags: [skill-creation, meta]
---

# 智能技能创建器

## When to Use This Skill

在项目沟通过程中，自动判断是否需要为当前项目创建专用技能：

- 项目使用的技术栈在现有技能库中不存在
- 项目领域需要专门的最佳实践和避坑指南
- 该技能未来可复用于其他项目
- 用户明确说「需要新技能」「创建 skill」

## 判断标准

满足任一即触发创建新技能：

1. 项目使用的技术栈在 `skills/` 中不存在对应 Skill
2. 项目领域需要专门的最佳实践、常见模式、避坑指南
3. 预计该 Skill 未来可复用于其他项目
4. 领域复杂度高，需要深入知识

## Not For / Boundaries

此技能不适用于：

- 一次性的简单任务（不值得创建 Skill）
- 已有现成 Skill 覆盖的领域
- 通用编程知识（不需要专门 Skill）

## Quick Reference

### SKILL.md 必填章节

```markdown
---
name: skill-name
description: "做什么 + 何时触发"
tags: [tag1, tag2]
---

# Skill Name

## When to Use This Skill
## Not For / Boundaries
## Quick Reference
## Examples
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

**场景：** 用户说「我要做一个 FastAPI 后端项目」

**判断：**
- 检查 `skills/` → 无 fastapi 目录
- FastAPI 有专门的最佳实践 → 需要
- 未来可复用 → 是

**步骤：**
1. 创建 `skills/fastapi/SKILL.md`
2. 填充内容：路由设计、依赖注入、Pydantic 模型、中间件等
3. 验证内容完整性

**验收：** `skills/fastapi/SKILL.md` 存在且内容完整

### Example 2: 项目需要 Supabase 技能

**场景：** 用户说「我要用 Supabase 做后端」

**判断：** 无现有 Skill，BaaS 有专门用法 → 需要创建

**步骤：**
1. 创建 `skills/supabase/SKILL.md`
2. 填充：认证、数据库、存储、实时订阅、Edge Functions
3. 添加示例代码

### Example 3: 访谈中发现需要 Skill

**场景：** 访谈到第 3 轮，发现项目要用 Stripe 支付

**判断：**
- Stripe 有复杂的 API 和 Webhook 流程
- 支付领域需要专门的安全最佳实践
- 未来可复用

**步骤：**
1. 暂停访谈：「检测到项目需要 Stripe 集成，我先创建一个 Stripe Skill」
2. 创建 `skills/stripe/SKILL.md`
3. 创建完成后继续访谈

## SKILL.md 模板

```markdown
---
name: skill-name
description: "简短描述 + 何时触发"
tags: [tag1, tag2, tag3]
---

# Skill Name

> 版本：v1.0 | 更新日期：[日期]

## When to Use This Skill

在以下场景调用此技能：

1. [场景1]
2. [场景2]

触发条件：
- [条件1]
- [条件2]

## Not For / Boundaries

此技能不适用于：

- [边界1]
- [边界2]

必要输入：
- [输入1]
- [输入2]

## Quick Reference

### 核心模式

| 模式 | 说明 |
|------|------|
| [模式1] | [描述] |
| [模式2] | [描述] |

### 常用代码

```typescript
// 代码示例
function example() {
  // 实现
}
```

## Examples

### Example 1: [示例标题]

**场景：** [场景描述]

**实现：**
```typescript
// 代码
```

**输出：** [预期结果]

### Example 2: [示例标题]

**场景：** [场景描述]

**实现：**
```typescript
// 代码
```

**输出：** [预期结果]

### Example 3: [示例标题]

**场景：** [场景描述]

**实现：**
```typescript
// 代码
```

**输出：** [预期结果]

## References

- [官方文档链接]
- [相关资源链接]

## Maintenance

- 来源：[来源]
- 最后更新：[日期]
- 已知限制：
  - [限制1]
  - [限制2]
```

## References

- [take-skills/skills/skill-creator/SKILL.md](../take-skills/skills/skill-creator/SKILL.md)
- [everything-claude-code/skills/continuous-learning/SKILL.md](../everything-claude-code/skills/continuous-learning/SKILL.md)

## Maintenance

- 来源：基于两个项目的 skill 创建经验
- 最后更新：2026-01-24
- 已知限制：
  - 自动判断基于启发式规则，复杂情况需人工确认
