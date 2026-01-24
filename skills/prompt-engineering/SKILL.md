---
name: prompt-engineering
description: 提示词工程技能。设计优化提示词，提升 LLM 输出质量。
tags: [prompt, llm, optimization]
---

# 提示词工程技能

## When to Use This Skill

- 设计 LLM 提示词时
- 优化提示词性能时
- 创建角色设定时
- 需要提示词模板时

## Quick Reference

### 提示词结构

```
1. 角色设定 (Role)
2. 任务描述 (Task)
3. 上下文信息 (Context)
4. 输出格式 (Format)
5. 示例 (Examples)
```

### 提示词要素

| 要素 | 说明 | 示例 |
|------|------|------|
| 角色 | 定义 AI 的身份 | 「你是一个经验丰富的程序员」 |
| 任务 | 明确要完成的任务 | 「帮我设计一个 API」 |
| 约束 | 输出限制条件 | 「不要使用 emoji」 |
| 格式 | 输出结构要求 | 「用 JSON 格式输出」 |
| 示例 | 提供参考示例 | 「比如...」 |

## 提示词模板

### 角色设定模板

```
你是一个{角色}。
你的专长是{专长}。
你的任务风格是{风格}。
```

### 任务描述模板

```
{任务背景}

你的任务是：{具体任务}

请遵循以下要求：
1. {要求1}
2. {要求2}
3. {要求3}
```

### 输出格式模板

```
请按以下格式输出：

```{语言}
{格式描述}
```

{额外要求}
```

## 优化技巧

### 技巧 1：明确指令

```
❌ 模糊
帮我写代码

✅ 清晰
用 TypeScript 写一个 RESTful API 的用户注册端点，包括：
1. 邮箱验证
2. 密码加密（使用 bcrypt）
3. 返回统一的响应格式
```

### 技巧 2：逐步思考

```
请按以下步骤思考：

步骤 1：分析问题的需求
步骤 2：列出可能的解决方案
步骤 3：比较各方案的优缺点
步骤 4：选择最佳方案并解释原因

现在开始：
```

### 技巧 3：提供示例

```
以下是一个好的回答示例：

问题：如何检查字符串是否为空？
回答：
```typescript
function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}
```

现在请回答：
```

### 技巧 4：角色扮演

```
你是一个资深的前端工程师，擅长 React 和 TypeScript。
你的回答风格：
- 简洁明了
- 包含代码示例
- 解释最佳实践
- 不使用 emoji

请回答以下问题：
```

### 技巧 5：约束输出

```
请直接输出代码，不要包含任何解释或 markdown 标记。
代码格式要求：
- 使用 TypeScript
- 函数命名使用 camelCase
- 添加必要的 JSDoc 注释

代码：
```

## 常用提示词模板

### 代码审查模板

```
你是一个资深代码审查员。请审查以下代码，关注以下方面：

1. 代码质量（可读性、命名、结构）
2. 潜在 bug
3. 性能问题
4. 安全问题
5. 最佳实践

代码：
```{language}
{code}
```

请按以下格式输出：
```markdown
## 代码审查报告

### 总体评价
[总体评价]

### 发现的问题
1. **[严重级别] [问题描述]**
   - 位置：[位置]
   - 修复建议：[建议]

### 优点
- [优点1]
- [优点2]
```
```

### 代码生成模板

```
你是一个{语言}专家。请完成以下任务：

任务描述：{任务描述}

技术要求：
- {要求1}
- {要求2}
- {要求3}

代码风格：
- {风格1}
- {风格2}

请直接输出代码，不要包含解释：
```

### API 设计模板

```
你是一个 API 设计专家。请为以下功能设计 RESTful API：

功能描述：{功能描述}

请提供：
1. 资源路径设计
2. HTTP 方法映射
3. 请求参数定义
4. 响应格式
5. 错误码定义

请按以下格式输出：
```markdown
## API 设计

### 资源设计
[资源路径]

### 端点定义
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /path | 描述 |

### 请求/响应格式
```json
{json}
```

### 错误码
| 码 | 说明 |
|----|------|
| 400 | 说明 |
```
```

### 技术写作模板

```
你是一个技术写作专家。请根据以下要点写一篇技术文档：

主题：{主题}

要点：
1. {要点1}
2. {要点2}
3. {要点3}

写作要求：
- 目标受众：{受众}
- 风格：{风格（专业/通俗/学术）}
- 长度：{长度要求}
- 包含代码示例

请用{语言}撰写。
```

## LangChain 提示词模板

### ChatPromptTemplate

```typescript
import { ChatPromptTemplate } from 'langchain/prompts';

const prompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
你是一个{role}。
你的专长是{expertise}。
你的回答风格：
- {style1}
- {style2}
- {style3}
`),
  HumanMessagePromptTemplate.fromTemplate(`
上下文：
{context}

问题：
{question}

请基于上下文回答问题。
`),
]);
```

### Few-Shot Prompt

```typescript
const fewShotPrompt = PromptTemplate.fromTemplate(`
以下是一些{任务类型}的示例：

示例 1：
输入：{input1}
输出：{output1}

示例 2：
输入：{input2}
输出：{output2}

示例 3：
输入：{input3}
输出：{output3}

现在请完成：
输入：{input}
输出：
`);
```

## 提示词评估

### 评估维度

| 维度 | 检查项 |
|------|--------|
| 清晰度 | 指令是否明确无歧义 |
| 完整性 | 是否包含所有必要信息 |
| 简洁性 | 是否简洁不冗余 |
| 有效性 | 是否能产生期望输出 |
| 可复用性 | 是否可以作为模板使用 |

### A/B 测试

```markdown
## 提示词 A/B 测试

### 版本 A
{prompt A}

### 版本 B
{prompt B}

### 测试结果
| 指标 | 版本 A | 版本 B |
|------|--------|--------|
| 准确率 | {score} | {score} |
| 相关性 | {score} | {score} |
| 完整性 | {score} | {score} |

### 结论
{选择哪个版本及原因}
```

## Common Patterns

### CoT (Chain of Thought)

```
请一步步思考问题：

步骤 1：{step1}

步骤 2：{step2}

步骤 3：{step3}

最终答案：
```

### ReAct (Reason + Act)

```
你有以下工具：
- {tool1}: {tool1_description}
- {tool2}: {tool2_description}

请按以下格式回答：
Thought: [你的思考]
Action: [使用的工具]
Observation: [工具返回的结果]
... (重复直到得到答案)
Final Answer: [最终答案]

问题：{question}
```

### Self-Consistency

```
请针对以下问题给出 3 个不同的解决方案：

问题：{question}

方案 1：
{solution1}

方案 2：
{solution2}

方案 3：
{solution3}

请比较这三个方案，选择最优的一个并说明理由：
```

## Examples

### Example 1: 代码生成提示

```
你是一个 TypeScript 专家。

任务：创建一个用户服务类

技术要求：
- 使用类和接口
- 实现以下方法：create, findById, findByEmail
- 使用 async/await
- 添加 JSDoc 注释
- 错误处理使用自定义 Error 类

代码风格：
- 使用 camelCase 命名
- 私有方法使用下划线前缀

请直接输出代码：
```

### Example 2: 文档编写提示

```
你是一个技术文档专家。

主题：RESTful API 设计最佳实践

受众：初级到中级后端开发者

风格：
- 专业但易懂
- 包含代码示例
- 分章节组织

章节要求：
1. 简介（什么是 REST）
2. 资源命名规范
3. HTTP 方法使用指南
4. 状态码使用指南
5. 错误处理最佳实践
6. 示例：用户管理 API

请用中文撰写，每章包含代码示例。
```

### Example 3: 代码审查提示

```
你是一个资深代码审查员。

请审查以下 React 组件代码，关注：

1. 性能问题（不必要渲染、内存泄漏等）
2. React 最佳实践
3. 可访问性 (a11y)
4. 错误处理
5. 代码风格

代码：
```tsx
{code}
```

请按以下格式输出：
```markdown
## 代码审查报告

### 总体评分
⭐⭐⭐☆☆ (3/5)

### 发现的问题
1. **Important** - 问题描述
   - 位置：Component.tsx:12
   - 修复建议：建议修复方案

### 优点
- 优点描述

### 修改建议
```tsx
{improved_code}
```
```

## References

- [take-skills/skills/prompt-engineer/SKILL.md](../take-skills/skills/prompt-engineer/SKILL.md)

## Maintenance

- 来源：结合两个项目的提示词工程经验
- 最后更新：2026-01-24
