---
name: continuous-learning
description: 持续学习技能。从会话中提取模式，保存为可复用的经验。
tags: [learning, patterns, meta]
---

# 持续学习技能

## When to Use This Skill

- 用户说 `/reflect` 时
- 用户多次纠正 AI 后
- 会话结束时
- 里程碑完成时
- 用户说 `/learn` 时

## How It Works

### 1. 学习检测

自动检测以下模式为「纠正」：

| 模式 | 示例 |
|------|------|
| 否定 + 正确做法 | 「不对，用 X 不是 Y」「别用 A， 用 B」 |
| 实际上... | 「实际上应该...」「其实是...」 |
| 记住... | 「记住：...」「以后要...」 |
| 这样不行 | 「这样不行，应该...」「错了，要...」 |

### 2. 记录学习

检测到纠正后，记录到 `memory-bank/学习记录.md`：

```markdown
| 2026-01-24 16:00 | 不对，用 gpt-5.1 不是 gpt-5 | 推理任务使用 gpt-5.1 | ⬜ 待反思 | 全局 |
```

### 3. 反思处理

用户说 `/reflect` 时：

1. 展示待处理的纠正
2. 用户确认后应用
3. 更新规则文件
4. 标记为已应用

## Quick Reference

### 学习应用范围

| 范围 | 应用位置 |
|------|----------|
| 全局 | CLAUDE.md |
| 项目 | memory-bank/学习记录.md 的项目规则 |
| 领域 | 对应的 SKILL.md |

### 学习处理流程

```
检测纠正 → 记录学习 → 用户确认 → 应用规则 → 标记完成
```

## Examples

### Example 1: 反思学习

**用户说：** `/reflect`

**AI 输出：**
```
🔍 **反思：发现 3 条待处理的纠正**

| # | 用户说的 | AI 学到的 | 建议范围 |
|---|----------|----------|----------|
| 1 | 不对，用 gpt-5.1 不是 gpt-5 | 推理任务用 gpt-5.1 | 全局 |
| 2 | 这个项目用 PostgreSQL | 本项目用 PostgreSQL | 项目 |
| 3 | 别用 var，用 const | JS 中优先用 const | 全局 |

请选择：
- 「全部应用」— 接受所有学习
- 「选择应用」— 逐条确认
- 「跳过」— 暂不处理
```

### Example 2: 提取模式

**用户说：** `/learn`

**AI 输出：**
```
📚 **模式提取**

本次会话识别到以下可复用模式：

### 1. Repository 模式

**类型：** 架构模式

**代码示例：**
```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: UserData): Promise<User>;
}
```

**适用场景：**
- 需要抽象数据访问的项目
- 可能切换数据库的项目

---

是否保存这些模式？
```

## Configuration

### 自动学习配置

可以在 `memory-bank/学习记录.md` 中配置：

```json
{
  "auto_detect": true,
  "min_corrections": 2,
  "ask_before_apply": true
}
```

## References

- [take-skills/CLAUDE.md](../take-skills/CLAUDE.md#反思机制自学习)
- [everything-claude-code/skills/continuous-learning/SKILL.md](../everything-claude-code/skills/continuous-learning/SKILL.md)

## Maintenance

- 来源：结合两个项目的持续学习机制
- 最后更新：2026-01-24
