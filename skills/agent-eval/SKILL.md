---
name: agent-eval
description: "AI Agent 评估专家：设计和实施 Agent 评估体系，包括评估任务设计、评分器选择、评估框架搭建。触发词：agent评估、评估体系、eval设计。"
---

# agent-eval Skill

为 AI Agent 项目设计和实施完整的评估体系，确保 Agent 质量可量化、可追踪、可改进。

## When to Use This Skill

触发此技能当：
- 项目是 AI Agent 类型（编码 Agent、对话 Agent、研究 Agent、计算机使用 Agent）
- 需要设计评估任务和评分标准
- 需要选择或搭建评估框架
- 项目需要交付给客户，需要提供质量保证文档
- 需要在模型升级时快速验证 Agent 性能

自动判断标准：
1. 项目涉及 LLM Agent 开发
2. 需要量化 Agent 性能
3. 项目有持续迭代需求

## Not For / Boundaries

此技能不适用于：
- 简单的 LLM 调用（非 Agent）
- 一次性脚本或工具
- 不需要质量追踪的原型项目

必要输入：
- Agent 类型和核心功能
- 成功标准定义
- 可选：现有测试用例

## Quick Reference

### 评估核心概念

| 术语 | 定义 |
|------|------|
| Task（任务） | 单个测试，有明确输入和成功标准 |
| Trial（试验） | 对任务的一次尝试，因模型输出变化需多次运行 |
| Grader（评分器） | 评估 Agent 表现的逻辑 |
| Transcript（记录） | 完整的试验记录，包括工具调用、推理过程 |
| Outcome（结果） | 试验结束时环境的最终状态 |

### 评分器类型

| 类型 | 方法 | 优点 | 缺点 |
|------|------|------|------|
| 代码评分器 | 字符串匹配、单元测试、静态分析 | 快速、便宜、可复现 | 脆弱、缺乏灵活性 |
| 模型评分器 | 评分标准、自然语言断言、成对比较 | 灵活、可扩展、捕捉细微差别 | 非确定性、需校准 |
| 人工评分器 | 专家评审、众包判断、抽样检查 | 金标准质量 | 昂贵、缓慢 |

### 评估类型

| 类型 | 目的 | 初始通过率 |
|------|------|-----------|
| 能力评估 | 测试 Agent 能做什么 | 低（有提升空间） |
| 回归评估 | 确保 Agent 仍能完成已有任务 | 高（接近100%） |

### 关键指标

| 指标 | 含义 | 适用场景 |
|------|------|----------|
| pass@k | k 次尝试中至少成功 1 次的概率 | 允许多次尝试的场景 |
| pass^k | k 次尝试全部成功的概率 | 要求一致性的场景 |

### 不同 Agent 类型的评估重点

| Agent 类型 | 评估重点 | 推荐评分器 |
|------------|----------|-----------|
| 编码 Agent | 代码运行、测试通过 | 单元测试 + LLM 代码质量评分 |
| 对话 Agent | 任务完成、交互质量 | 状态检查 + LLM 评分标准 |
| 研究 Agent | 信息准确性、来源质量 | 事实核查 + 覆盖度检查 |
| 计算机使用 Agent | 最终状态正确性 | 环境状态验证脚本 |

## Examples

### Example 1: 编码 Agent 评估设计

- 场景：开发一个代码修复 Agent
- 评估设计：
  ```yaml
  task:
    name: fix-auth-bypass
    description: 修复认证绕过漏洞
    input: GitHub Issue 描述
    environment: 隔离的代码仓库

  graders:
    - type: code
      name: tests-pass
      check: 运行测试套件，所有测试通过
    - type: code
      name: security-scan
      check: 安全扫描无高危漏洞
    - type: llm
      name: code-quality
      rubric: 代码可读性、无冗余、符合项目风格

  metrics:
    - pass@1
    - token_usage
    - latency
  ```
- 验收：评估任务可运行，结果可追踪

### Example 2: 对话 Agent 评估设计

- 场景：客服退款处理 Agent
- 评估设计：
  ```yaml
  task:
    name: handle-refund-request
    description: 处理愤怒客户的退款请求
    user_persona: 购买了损坏商品的不满客户
    success_criteria:
      - 退款已处理（数据库状态）
      - 对话轮次 < 10
      - 语气适当

  graders:
    - type: code
      name: refund-processed
      check: 数据库中存在退款记录
    - type: llm
      name: tone-appropriate
      rubric: 专业、有同理心、不卑不亢
    - type: code
      name: turn-count
      check: 对话轮次 <= 10
  ```
- 验收：多维度评估，覆盖任务完成和交互质量

### Example 3: 评估体系从零搭建

- 场景：新 Agent 项目需要完整评估体系
- 步骤：
  1. **收集初始任务**（20-50个）
     - 从手动测试用例转化
     - 从 bug 报告提取
     - 从用户反馈收集
  2. **设计评分器**
     - 优先使用代码评分器（确定性）
     - 必要时使用 LLM 评分器（灵活性）
     - 定期用人工评分校准
  3. **搭建评估框架**
     - 选择框架：Promptfoo / Braintrust / Harbor
     - 配置隔离环境
     - 设置并发运行
  4. **建立基线**
     - 运行初始评估
     - 记录 pass@1、延迟、token 用量
  5. **持续迭代**
     - 能力评估饱和后转为回归评估
     - 定期阅读 transcript 发现问题
- 验收：评估体系可运行、可追踪、可迭代

## References

### 推荐评估框架

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| [Promptfoo](https://promptfoo.dev/) | 轻量、YAML 配置、开源 | 快速迭代、CI/CD 集成 |
| [Braintrust](https://braintrust.dev/) | 离线评估 + 生产监控 | 需要全链路追踪 |
| [Harbor](https://harborframework.com/) | 容器化、大规模并发 | 复杂 Agent、标准化基准 |
| [LangSmith](https://docs.langchain.com/langsmith/) | LangChain 生态集成 | 使用 LangChain 的项目 |

### 参考基准

- [SWE-bench Verified](https://swebench.com/) — 编码 Agent 基准
- [Terminal-Bench](https://tbench.ai/) — 端到端技术任务
- [τ-Bench](https://arxiv.org/abs/2406.12045) — 对话 Agent 基准
- [WebArena](https://arxiv.org/abs/2307.13854) — 浏览器 Agent 基准

### 官方文档

- [Anthropic: Building effective agents](https://anthropic.com/engineering/building-effective-agents)
- [Anthropic: Evaluating AI agents](https://anthropic.com/engineering/evaluating-ai-agents)

## Maintenance

- 来源：基于 Anthropic 官方 Agent 评估指南
- 最后更新：2026-01-15
- 已知限制：
  - 评估设计需要领域专业知识
  - LLM 评分器需要定期与人工评分校准
  - 复杂 Agent 评估可能需要自定义框架
