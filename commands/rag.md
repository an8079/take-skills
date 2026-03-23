---
name: rag
description: RAG 项目设计与讨论。讨论 LangGraph 工作流、LangFuse/LangSmith 集成、LangChain 组件选型、RAG 架构设计。
---

# /rag - RAG 项目设计

与用户讨论并设计 RAG (Retrieval Augmented Generation) 项目架构。

## 使用方式

```
/rag
```

或

```
RAG设计
开始RAG设计
设计RAG系统
```

## 工作流程

1. **需求讨论** - 与用户讨论 RAG 使用场景和需求
2. **数据源分析** - 分析数据源类型和查询模式
3. **架构设计** - 设计 RAG Pipeline 和工作流
4. **组件选型** - 推荐 Embedding、Vector DB、Retrieval 策略
5. **技术方案** - 提供完整的实现建议

## 讨论内容

### LangGraph 工作流设计

- Supervisor-Worker 模式
- 状态持久化与 Checkpointing
- 条件边与路由逻辑
- 子图设计

### LangFuse 集成方案

- 追踪配置与装饰器使用
- 评估指标设计
- Prompt 版本管理
- 成本分析

### LangSmith 监控配置

- 项目与数据集设置
- 评估链构建
- 反馈收集
- A/B 测试

### LangChain 组件选型

- Embedding 模型选择（OpenAI BGE、Cohere）
- Vector Database 对比与选型
- Chunking 策略设计
- Reranking 策略

### RAG 架构设计

- 向量数据库选型（Pinecone、Milvus、Qdrant、Chroma、FAISS）
- Embedding 模型选择
- Chunking 策略
- Retrieval 和 Reranking 策略
- LangGraph 状态机设计

## 输出内容

RAG 架构设计文档，包含：

| 内容 | 说明 |
|------|------|
| 向量数据库选型建议 | 根据规模、成本、性能需求推荐 |
| Embedding 模型选择 | 中文/英文、精度/速度权衡 |
| Chunking 策略 | 根据文档类型推荐分块策略 |
| Retrieval 策略 | Naive RAG、GraphRAG、Hybrid Search 等 |
| Reranking 策略 | BGE Reranker、Cohere Rerank |
| LangGraph 工作流 | 状态定义、节点设计、边设计 |
| 监控方案 | LangFuse/LangSmith 配置建议 |

## 使用技能

- `skills/rag-design/SKILL.md` - RAG 设计知识库

## 示例场景

### 场景 1: 企业内部知识库

```
用户: 我们想做一个法律文档问答系统
/rag → 讨论 → 推荐 GraphRAG + LangGraph + Qdrant + BGE
```

### 场景 2: 客服机器人

```
用户: 需要做一个实时客服系统
/rag → 讨论 → 推荐 Hybrid Search + Pinecone + Redis 缓存
```

### 场景 3: 多语言文档检索

```
用户: 我们的文档有中英文
/rag → 讨论 → 推荐 Cohere Embed + Weaviate + Hybrid Search
```

---

**提示：** `/rag` 是设计讨论模式，不会自动执行代码。讨论完成后，你可以使用 `/plan` 进入计划阶段。
