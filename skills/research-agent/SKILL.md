---
name: research-agent
description: AI领域深度调研Agent——多源搜索+结构化输出+迭代深挖，适用于竞品分析、技术选型、市场调研。
trigger:
  - "调研"
  - "research"
  - "竞品分析"
  - "技术选型"
  - "行业分析"
  - "市场调研"
  - "深度搜索"
---

# research-agent — AI领域深度调研技能

## 核心定位

对任意AI/技术主题执行结构化深度调研，输出可直接使用的研究报告。解决"需要快速了解某个领域但信息分散"的问题。

## 核心原则

- **多源并行**：同时搜索多个角度，避免单一视角
- **结构化输出**：按固定框架组织信息，便于阅读和分享
- **可迭代深挖**：基于初稿继续提问，逐层深入

## 输出框架

```
# [主题] 深度调研报告

## 📌 一句话结论
[核心发现]

## 🏢 竞品/项目概览
[列出主要玩家，一句话描述]

## 🔢 关键数据
- [数据点1]
- [数据点2]
- [数据点3]

## ✅ 核心优势
[3-5个核心优势]

## ⚠️ 局限性/风险
[2-3个主要问题]

## 📦 生态与社区
- Stars / 社区规模
- 文档质量
- 维护活跃度

## 💡 适合场景
[谁适合用，什么场景]

## 🔮 趋势判断
[未来3-6个月预判]

## 🔗 参考链接
[来源链接]
```

## 调研策略（按主题类型）

### 1. 框架/工具类调研
```
搜索角度：
- "框架名 + GitHub stars 2026"
- "框架名 vs 竞品 2026 comparison"
- "site:github.com 框架名"
- "框架名 official documentation"
```

### 2. 市场/产品类调研
```
搜索角度：
- "2026 AI tool release [month]"
- "AI product launch [category] 2026"
- "best [category] AI tools 2026"
```

### 3. 技术选型类调研
```
搜索角度：
- "[技术A] vs [技术B] 2026"
- "when to use [framework]"
- "[framework] limitations problems 2026"
```

## Actions

### action: research

**触发**：用户提供调研主题

#### STEP 1: 规划搜索角度

**tool**: `llm-task`（或内部分析）

分析主题，确定3-5个搜索角度：
- 核心问题（是什么，怎么用）
- 竞品对比（有哪些，谁更好）
- 实际案例（谁在用，效果如何）
- 局限性（有什么问题）
- 趋势（未来发展）

#### STEP 2: 多源并行搜索

**tool**: `batch_web_search`

```json
{
  "queries": [
    { "query": "[主题] GitHub 2026 stars features", "num_results": 8 },
    { "query": "[主题] vs [竞品] 2026 comparison", "num_results": 6 },
    { "query": "[主题] limitations problems 2026", "num_results": 6 },
    { "query": "[主题] use cases real world 2026", "num_results": 6 },
    { "query": "site:github.com [主题] 2026", "num_results": 5 }
  ]
}
```

#### STEP 3: 深度内容提取（关键来源）

**tool**: `extract_content_from_websites`

从搜索结果中选取2-3个高质量来源（如官方文档、权威评测）深度提取：

```json
{
  "tasks": [
    { "url": "<url1>", "prompt": "提取关键功能、优缺点、定价、使用限制", "task_name": "主站文档" },
    { "url": "<url2>", "prompt": "提取评测数据、用户反馈、对比信息", "task_name": "对比评测" }
  ]
}
```

#### STEP 4: 合成结构化报告

**tool**: `llm-task`

将搜索结果合成结构化报告，填充输出框架的每个章节。

#### STEP 5: 存储到文件

**tool**: `write`

```json
{
  "path": "memory/research/[主题]_[日期].md",
  "content": "<完整报告内容>"
}
```

### action: followup

**触发**：用户对报告继续提问或要求深挖

在上一份报告基础上：
1. 识别用户问题指向的章节
2. 补充搜索新角度（2-3个额外query）
3. 更新对应章节
4. 追加"🔍 追问："模块记录本次追问

---

## 环境配置

```yaml
environment:
  required_tools:
    - batch_web_search       # 多源搜索
    - extract_content_from_websites  # 深度内容提取
    - llm-task              # 搜索结果合成
    - write                  # 报告存储
  required_permissions:
    - 网络访问
```

## 使用示例

**用户输入**：
> 调研一下 2026年AI编程工具的格局，重点关注Claude Code竞品

**Agent行为**：
1. 规划搜索角度：OpenCode vs Cursor vs Roo Code vs Claude Code，各自特点
2. 发起5个并行搜索
3. 提取2个关键页面的深度内容
4. 合成结构化报告，包含竞品对比表格、场景推荐
5. 存储到 `memory/research/ai_coding_tools_2026_0407.md`

---

## 最佳实践

1. **先规划再搜索**：花30秒规划搜索角度，比直接搜效果好3倍
2. **优先官方来源**：GitHub README > 官方文档 > 权威媒体 > 博客
3. **数据要有时效性**：2026年的信息才有价值，避免引用过时数据
4. **结论要可行动**：每个报告最后要有"我应该怎么做"的结论
5. **保存历史报告**：同类主题多次调研时，历史报告是宝贵的对比基准
