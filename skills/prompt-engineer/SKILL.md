---
name: prompt-engineer
description: "提示词工程专家：根据需求类型生成高质量提示词。触发词：写提示词、生成prompt、创建角色。支持角色扮演、模拟器、专家、互动对话、创作者等多种模式。"
---

# prompt-engineer Skill

根据需求类型，使用经过验证的模式生成高质量提示词。

## When to Use This Skill

触发此技能当：
- 需要为 AI 创建新的角色或行为指令
- 需要生成系统提示词（System Prompt）
- 需要创建特定领域的专家提示词
- 需要设计交互式对话流程
- 说「写提示词」「生成 prompt」「创建角色」

## Not For / Boundaries

此技能不适用于：
- 简单的一次性问答（直接问即可）
- 代码生成（用编码技能）
- 项目规划（用 spec-driven-dev）

必要输入：
- 提示词的目标用途
- 目标角色或功能
- 输出格式要求（可选）

## Quick Reference

### 提示词类型速查

| 类型 | 适用场景 | 核心特征 |
|------|----------|----------|
| 角色扮演 | 模拟专家、顾问、教练 | Act as [角色] |
| 模拟器 | 终端、Excel、游戏 | 只输出模拟结果 |
| 专家顾问 | 职业、技术、领域咨询 | 提供专业建议 |
| 互动对话 | 面试、教学、问答 | 一问一答，等待回复 |
| 创作者 | 写作、音乐、艺术 | 生成创意内容 |
| 翻译改写 | 语言转换、风格改写 | 保持原意，改变形式 |
| 分析评估 | 代码审查、文章点评 | 提供分析和反馈 |

### 核心模板

```markdown
I want you to act as a [角色].

[角色职责描述]

[输出格式约束]

[行为规则]

My first [request/task] is "[示例任务]"
```

### 关键约束短语

| 约束 | 用途 | 示例 |
|------|------|------|
| `only reply with...` | 限制输出格式 | only reply with the code |
| `do not write explanations` | 禁止解释 | 保持输出简洁 |
| `wait for my answers` | 控制节奏 | 互动对话模式 |
| `one by one` | 逐步进行 | 避免一次性输出 |
| `inside one unique code block` | 代码块输出 | 模拟器模式 |
| `keep the meaning same` | 保持原意 | 翻译改写模式 |

### 变量占位符

```markdown
${Variable:DefaultValue}

示例：
- ${Position:Software Developer}
- ${Language:English}
- ${Topic:AI}
```

## Examples

### Example 1: 创建代码审查专家

- 输入：「我需要一个代码审查的提示词」
- 步骤：
  1. 确定类型：专家顾问 + 分析评估
  2. 定义角色：资深代码审查员
  3. 设定输出：问题列表 + 改进建议
  4. 添加约束：关注安全、性能、可读性
- 输出：
```markdown
I want you to act as a senior code reviewer.

I will provide you with code snippets and you will review them for:
- Security vulnerabilities
- Performance issues
- Code readability and maintainability
- Best practices violations

For each issue found, provide:
1. Line number or location
2. Issue description
3. Severity (Critical/Major/Minor)
4. Suggested fix

Do not rewrite the entire code. Focus on specific issues.

My first code to review is:
```

### Example 2: 创建 SQL 终端模拟器

- 输入：「我需要一个模拟 PostgreSQL 的提示词」
- 步骤：
  1. 确定类型：模拟器
  2. 定义行为：只输出查询结果
  3. 设定格式：表格形式
  4. 添加约束：不解释，不建议
- 输出：
```markdown
I want you to act as a PostgreSQL database terminal.

I will type SQL queries and you will reply with what the database would return.

Rules:
- Only reply with the query result in a text-based table format
- Do not write explanations or suggestions
- If the query has an error, show the PostgreSQL error message
- Assume a sample database with common tables (users, orders, products)

When I need to tell you something in English, I will use {curly brackets}.

My first query is: SELECT * FROM users LIMIT 5;
```

### Example 3: 创建面试官角色

- 输入：「我需要一个技术面试官的提示词」
- 步骤：
  1. 确定类型：互动对话
  2. 定义角色：技术面试官
  3. 设定节奏：一问一答
  4. 添加变量：职位可配置
- 输出：
```markdown
I want you to act as a technical interviewer for a ${Position:Backend Developer} position.

Rules:
- Ask me interview questions one by one
- Wait for my answer before asking the next question
- Do not write all questions at once
- Provide brief feedback after each answer (Good/Needs improvement)
- Cover: technical skills, problem-solving, system design, behavioral questions
- Adjust difficulty based on my answers

Do not write explanations. Only act as the interviewer.

Start with: "Hello, welcome to the interview. Let's begin with a brief introduction about yourself."
```

### Example 4: 创建文档翻译改写

- 输入：「我需要一个技术文档翻译的提示词」
- 步骤：
  1. 确定类型：翻译改写
  2. 定义目标：技术文档中英互译
  3. 设定约束：保持术语准确
  4. 添加格式：保留代码块
- 输出：
```markdown
I want you to act as a technical documentation translator.

I will provide technical documents and you will translate them between ${Source:English} and ${Target:Chinese}.

Rules:
- Keep technical terms accurate (provide original term in parentheses if needed)
- Preserve all code blocks, commands, and file paths unchanged
- Maintain the original markdown formatting
- Keep the meaning same, but make it natural in the target language
- Do not add explanations or comments

My first document to translate is:
```

## References

提示词模式来源：
- [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) — 经典提示词库
- [prompts.chat](https://prompts.chat) — 在线提示词平台

本地资源：
- `skills/claude-skills/SKILL.md` — 技能创建规范（可用于创建提示词型技能）

## Maintenance

- 来源：基于 awesome-chatgpt-prompts 项目的模式总结
- 最后更新：2026-01-07
- 已知限制：
  - 生成的提示词需要根据实际 AI 模型调整
  - 复杂场景可能需要多轮迭代优化
