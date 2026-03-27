---
name: finops-for-ai
description: AI Agent 成本优化（FinOps）技能。用于分析 AI 使用成本、优化 prompt 效率、选择经济模型、实施成本监控和预算控制。
tags: [finops, cost-optimization, ai-agents, budget, monitoring]
---

# FinOps for AI Agents - AI 成本优化指南

## 概述

2026 年 AI Agent 的核心挑战之一：**如何在不牺牲质量的前提下控制成本**。本技能提供完整的 AI FinOps 框架，涵盖成本分析、优化策略和监控实施。

## 核心指标

### 关键指标定义
```
Token 成本 = 输入 Token 数 × 输入单价 + 输出 Token 数 × 输出单价
每次请求成本 = Token 成本 + API 调用 overhead
每日成本 = Σ(每次请求成本 × 请求数)
每月成本 = 每日成本 × 30
```

### 主流模型定价参考（2026年）
| 模型 | 输入$/1M | 输出$/1M | 适用场景 |
|------|---------|---------|---------|
| GPT-4o | $2.5 | $10 | 通用任务 |
| Claude 3.5 Sonnet | $3 | $15 | 长上下文、分析 |
| Gemini 2.0 Flash | $0.1 | $0.4 | 高频调用 |
| DeepSeek-V3 | $0.27 | $1.1 | 成本敏感 |
| Qwen-2.5 | $0.5 | $2 | 中文场景 |

## 成本分析框架

### 1. Token 使用分析
```typescript
interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
}

function analyzeCost(response: { usage: TokenUsage }): void {
  const { prompt_tokens, completion_tokens, total_tokens } = response.usage;
  const inputCost = prompt_tokens * INPUT_PRICE_PER_TOKEN;
  const outputCost = completion_tokens * OUTPUT_PRICE_PER_TOKEN;
  
  console.log(`
    Token 分析:
    - 输入: ${prompt_tokens} tokens ($${inputCost.toFixed(6)})
    - 输出: ${completion_tokens} tokens ($${outputCost.toFixed(6)})
    - 总计: ${total_tokens} tokens ($${(inputCost + outputCost).toFixed(6)})
  `);
}
```

### 2. Prompt 效率评分
```
效率分数 = (有效信息 Token / 总 Token) × 100

高效率 (>80%): 
  - 简洁的指令
  - 直接的示例
  - 最小化的上下文

低效率 (<50%):
  - 冗长的系统提示
  - 重复的示例
  - 过大的上下文窗口
```

## 优化策略

### 策略 1: 模型分层路由
```typescript
// 按任务复杂度选择模型
function selectModel(task: Task): string {
  const complexity = assessComplexity(task);
  
  if (complexity === "simple") {
    return "gpt-4o-mini";  // $0.15/1M 输出，便宜 60x
  } else if (complexity === "medium") {
    return "claude-3-haiku";
  } else {
    return "claude-3-opus";  // 复杂任务用最强模型
  }
}

function assessComplexity(task: Task): "simple" | "medium" | "complex" {
  // 简单：分类、格式化、简短问答
  // 中等：代码审查、多步骤推理
  // 复杂：架构设计、长篇写作、深度分析
}
```

### 策略 2: Prompt 压缩
```typescript
// 压缩冗长上下文
function compressContext(context: string, maxTokens: number): string {
  const currentTokens = estimateTokens(context);
  
  if (currentTokens <= maxTokens) return context;
  
  // 保留核心信息
  const essential = extractEssentialInfo(context);
  return truncateWithSummary(essential, maxTokens);
}

// 动态示例选择
function selectExamples(task: string, examplePool: Example[]): Example[] {
  // 只选择与当前任务最相关的示例
  const relevance = examplePool.map(e => ({
    example: e,
    score: calculateRelevance(task, e.description)
  }));
  
  return relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)  // 最多 3 个示例
    .map(r => r.example);
}
```

### 策略 3: 缓存策略
```typescript
// Semantic cache for similar prompts
class SemanticCache {
  private cache: Map<string, CachedResult>;
  private similarityThreshold = 0.95;
  
  async get(prompt: string): Promise<string | null> {
    for (const [key, value] of this.cache) {
      const similarity = calculateEmbeddingSimilarity(prompt, key);
      if (similarity >= this.similarityThreshold) {
        this.updateHitRate(value);
        return value.response;
      }
    }
    return null;
  }
  
  async set(prompt: string, response: string): Promise<void> {
    const embedding = await generateEmbedding(prompt);
    this.cache.set(prompt, { response, embedding, timestamp: Date.now() });
  }
}
```

### 策略 4: Batch Processing
```typescript
// 批量处理节省成本
async function batchProcess(items: string[], model: string): Promise<string[]> {
  const BATCH_SIZE = 100;  // 批量大小
  
  const batches = chunk(items, BATCH_SIZE);
  const results: string[] = [];
  
  for (const batch of batches) {
    const response = await callModel({
      model,
      prompt: `处理以下 ${batch.length} 个任务:\n${batch.join("\n")}`
    });
    results.push(...parseBatchResponse(response));
  }
  
  return results;
}
```

## 成本监控

### 1. 实时成本追踪
```typescript
class CostTracker {
  private dailyCost = 0;
  private monthlyBudget = 1000; // $1000/月预算
  
  async trackRequest(prompt: string, response: any): Promise<void> {
    const cost = this.calculateCost(response.usage);
    this.dailyCost += cost;
    
    if (this.dailyCost > this.monthlyBudget * 0.9) {
      console.warn(`⚠️ 成本预警: 已使用 $${this.dailyCost.toFixed(2)}`);
    }
  }
  
  private calculateCost(usage: TokenUsage): number {
    return (usage.prompt_tokens * INPUT_PRICE + usage.completion_tokens * OUTPUT_PRICE);
  }
  
  getReport(): CostReport {
    return {
      daily_cost: this.dailyCost,
      monthly_budget: this.monthlyBudget,
      utilization: (this.dailyCost / this.monthlyBudget) * 100,
      remaining: this.monthlyBudget - this.dailyCost
    };
  }
}
```

### 2. 成本 Dashboard 指标
```
每日成本趋势图
├── 今天: $12.45
├── 昨天: $11.20 (+11%)
├── 本周平均: $10.80/天
└── 预计本月: $324

Token 使用分布
├── 输入: 2.1M (30%)
├── 输出: 4.9M (70%)
└── 缓存节省: 1.2M

模型使用分布
├── GPT-4o-mini: 65% ($45)
├── Claude 3.5 Sonnet: 30% ($180)
└── GPT-4o: 5% ($60)
```

## 预算控制

### 1. 自动熔断机制
```typescript
class BudgetCircuitBreaker {
  private readonly DAILY_LIMIT = 100; // $100/天
  
  async executeWithBudget<T>(
    task: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    const todayCost = await this.getTodayCost();
    
    if (todayCost >= this.DAILY_LIMIT) {
      console.warn("预算已达上限，使用降级策略");
      return fallback();
    }
    
    return task();
  }
}
```

### 2. 分级降级策略
```typescript
const GRADUAL_DEGRADATION = {
  level_1: { model: "gpt-4o", threshold: 0.7 },   // 预算 70% 时降级
  level_2: { model: "gpt-4o-mini", threshold: 0.85 }, // 预算 85% 时降级
  level_3: { model: "rule-based", threshold: 0.95 }   // 预算 95% 时完全降级
};
```

## Prompt 优化检查清单

在每次发送请求前检查：

- [ ] **去除冗余** - 删除不必要的背景信息和重复内容
- [ ] **精简示例** - 最多 3 个高度相关的示例
- [ ] **使用小模型验证** - 先用小模型验证思路，再用大模型执行
- [ ] **批量处理** - 将多个小任务合并为一个批量请求
- [ ] **启用缓存** - 对于相似请求使用语义缓存
- [ ] **流式响应** - 对于长输出使用流式 API 减少等待时间

## 成本优化 ROI 计算

```
优化前成本/月: $500
优化后成本/月: $180

节省: $320/月 ($3,840/年)

优化投入:
- 实施时间: 8 小时
- 开发成本: $200

ROI = ($3,840 - $200) / $200 = 17.2x/年
```

## 最佳实践总结

1. **模型路由** - 简单任务用便宜模型，复杂任务用强模型
2. **Prompt 压缩** - 去除冗余，保持简洁
3. **语义缓存** - 避免重复计算相同内容
4. **批量 API** - 合并请求减少 API 调用次数
5. **实时监控** - 建立成本告警机制
6. **定期审计** - 每周分析成本构成和优化空间
