---
name: rag-design
description: RAG 项目设计技能：LangGraph 工作流、LangFuse/LangSmith 集成、LangChain 组件选型、RAG 架构设计（Embedding、Vector DB、Retrieval 策略）。用于设计企业级 RAG 系统。
tags: [rag, langgraph, langfuse, langsmith, langchain, vector-db, embedding, retrieval, rerank]
---

# RAG 项目设计技能

## When to Use This Skill

触发此技能当：
- 用户输入 `/rag` 进行 RAG 项目设计讨论
- 需要设计 LangGraph 工作流
- 需要集成 LangFuse/LangSmith 监控
- 需要选型 LangChain 组件
- 需要设计 Embedding/Vector DB/Retrieval 策略

## Not For / Boundaries

此技能不适用于：
- 简单的键值存储（用数据库或缓存即可）
- 不涉及检索的纯生成任务
- 实时大规模流处理（需专用流处理框架）

---

## Quick Reference

### RAG Pipeline 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG Pipeline                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────┐ │
│  │  Input  │───▶│ Chunking │───▶│Embedding│───▶│ Vector DB  │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────────┘ │
│                                                      │         │
│                                                      ▼         │
│  ┌─────────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐│
│  │   Output   │◀───│  Gen    │◀───│Rerank   │◀───│Retrieval││
│  └─────────────┘    └─────────┘    └─────────┘    └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 向量数据库对比

| 数据库 | 类型 | 特点 | 适用规模 | 延迟 | 成本 |
|--------|------|------|----------|------|------|
| **Pinecone** | 云原生 | 托管服务，开箱即用 | 亿级 | 低 | 高 |
| **Weaviate** | 自部署/云 | 混合检索，原生 GraphQL | 千万级 | 低 | 中 |
| **Milvus** | 自部署 | 高性能，分布式 | 十亿级 | 低 | 低 |
| **Qdrant** | 自部署 | 高性能，滤波支持 | 亿级 | 极低 | 低 |
| **Chroma** | 嵌入式 | 轻量级，开发友好 | 百万级 | 低 | 极低 |
| **FAISS** | 嵌入式 | Meta 开源，GPU 加速 | 百万级 | 极低 | 低 |
| **pgvector** | PostgreSQL 扩展 | SQL 兼容，易集成 | 百万级 | 中 | 低 |

### Embedding 模型对比

| 模型 | 维度 | 上下文 | 特点 | 适合场景 |
|------|------|--------|------|----------|
| **text-embedding-ada-002** | 1536 | 8K | OpenAI 默认 | 通用 |
| **text-embedding-3-small** | 512/1536 | 8K | 高效低成本 | 通用 |
| **text-embedding-3-large** | 256/1024/3072 | 8K | 高精度 | 高精度 |
| **BGE-large** | 1024 | 512 | 开源，中文优化 | 中文场景 |
| **BGE-base** | 768 | 512 | 开源，中文优化 | 中文场景 |
| **m3e-large** | 1024 | 512 | 开源，中文优化 | 中文场景 |
| **Cohere Embed** | 1024 | 512 | 多语言，支持 rerank | 多语言 |

### Chunking 策略

| 策略 | chunk_size | overlap | 优点 | 缺点 |
|------|-------------|---------|------|------|
| **固定大小** | 500-1000 | 50-100 | 简单 | 可能断句 |
| **句子级** | 动态 | 0-50 | 语义完整 | 大小不一 |
| **段落级** | 动态 | 0 | 语义完整 | 大小不一 |
| **递归字符** | 动态 | 50-200 | 智能断句 | 复杂 |

---

## 核心组件设计

### 1. LangGraph 工作流设计

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Annotated
from langgraph.graph.message import add_messages

class RAGState(TypedDict):
    """RAG 状态定义"""
    messages: Annotated[List, add_messages]
    query: str
    retrieved_docs: List
    reranked_docs: List
    context: str
    answer: str
    iteration_count: int

# 节点函数
async def retrieve_node(state: RAGState) -> RAGState:
    """检索节点"""
    query = state["query"]
    docs = await vector_store.similarity_search(query, k=10)
    return {"retrieved_docs": docs}

async def rerank_node(state: RAGState) -> RAGState:
    """重排序节点"""
    docs = state["retrieved_docs"]
    reranked = await reranker.rerank(docs, query, top_n=5)
    return {"reranked_docs": reranked}

async def generate_node(state: RAGState) -> RAGState:
    """生成节点"""
    context = format_docs(state["reranked_docs"])
    prompt = f"基于以下上下文回答问题：\n\n{context}\n\n问题：{state['query']}"
    answer = await llm.ainvoke(prompt)
    return {"answer": answer.content}

# 条件边函数
def should_rerank(state: RAGState) -> str:
    """判断是否需要重排序"""
    if state.get("reranked_docs"):
        return "generate"
    return "rerank"

# 构建图
workflow = StateGraph(RAGState)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("rerank", rerank_node)
workflow.add_node("generate", generate_node)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "rerank")
workflow.add_edge("rerank", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()
```

### 2. LangFuse 集成

```python
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context

# 初始化
langfuse = Langfuse(
    secret_key="sk-...",
    public_key="pk-...",
    host="https://cloud.langfuse.com"  # 或自部署地址
)

# 装饰器追踪
@observe()
async def retrieve_with_trace(query: str):
    with langfuse_context.start_span(
        name="retrieve",
        input={"query": query}
    ) as span:
        docs = await vector_store.similarity_search(query, k=10)
        span.output = {"doc_count": len(docs)}
        return docs

@observe()
async def generate_with_trace(context: str, query: str):
    with langfuse_context.start_span(
        name="generate",
        input={"context": context, "query": query}
    ) as span:
        response = await llm.ainvoke(prompt)
        span.output = {"answer": response.content}
        return response.content

# LangChain 集成
from langchain.callbacks.langfuse import LangfuseCallbackHandler

handler = LangfuseCallbackHandler(
    langfuse=langfuse,
    trace_name="rag-pipeline",
    metadata={"user_id": "user_123"}
)

llm = ChatOpenAI(
    callbacks=[handler]
)
```

### 3. LangSmith 集成

```python
from langsmith import Client, traceable

# 初始化
client = Client(
    api_key="lsv2_...",
    project_name="rag-pipeline"
)

# 追踪装饰器
@traceable(
    project_name="rag-pipeline",
    tags=["retrieval", "production"]
)
async def retrieval_pipeline(query: str, top_k: int = 10):
    """带追踪的检索管道"""
    # 1. Query 预处理
    processed_query = query.strip()

    # 2. 检索
    docs = await vector_store.similarity_search(
        processed_query,
        k=top_k,
        filter={"source": {"$eq": "docs"}}
    )

    return docs

@traceable(
    project_name="rag-pipeline",
    tags=["generation", "production"],
    run_type="chain"
)
async def generation_pipeline(retrieved_docs, query: str):
    """带追踪的生成管道"""
    # 上下文构建
    context = "\n\n".join([doc.page_content for doc in retrieved_docs])

    # Prompt 构建
    prompt = f"""基于以下上下文回答问题。
    如果上下文中没有相关信息，请说明不知道。

    上下文：
    {context}

    问题：{query}
    """

    # 生成
    response = await llm.ainvoke(prompt)
    return response.content

# 评估追踪
@traceable
def evaluate_retrieval(relevant_docs: List, retrieved_docs: List) -> float:
    """评估检索质量"""
    relevant_ids = set(doc.id for doc in relevant_docs)
    retrieved_ids = set(doc.id for doc in retrieved_docs)

    precision = len(relevant_ids & retrieved_ids) / len(retrieved_ids)
    recall = len(relevant_ids & retrieved_ids) / len(relevant_ids)

    return 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
```

### 4. LangChain 组件选型

```python
from langchain_community.vectorstores import Chroma, FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

# Embedding 选择
def get_embedding_model(model_type: str):
    """获取 Embedding 模型"""
    if model_type == "openai":
        return OpenAIEmbeddings(
            model="text-embedding-3-large",
            dimensions=1024
        )
    elif model_type == "bge":
        return HuggingFaceBgeEmbeddings(
            model_name="BAAI/bge-large-zh",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
    elif model_type == "m3e":
        return HuggingFaceBgeEmbeddings(
            model_name="moka-ai/m3e-large",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )

# Vector Store 选择
def get_vector_store(store_type: str, embedding, persist_directory: str = None):
    """获取 Vector Store"""
    if store_type == "chroma":
        return Chroma(
            embedding_function=embedding,
            persist_directory=persist_directory or "./chroma_db"
        )
    elif store_type == "faiss":
        return FAISS(
            embedding_function=embedding,
            index_dims=1024
        )
    elif store_type == "milvus":
        from langchain_community.vectorstores import Milvus
        return Milvus(
            embedding_function=embedding,
            connection_args={"host": "localhost", "port": "19530"}
        )
```

### 5. Reranking 策略

```python
from cohere import Client as CohereClient

class Reranker:
    """重排序器"""

    def __init__(self, api_key: str):
        self.client = CohereClient(api_key=api_key)

    async def rerank(self, documents: List, query: str, top_n: int = 5) -> List:
        """使用 Cohere Rerank"""
        results = self.client.rerank(
            query=query,
            documents=[doc.page_content for doc in documents],
            top_n=top_n,
            model="rerank-multilingual-v2.0"
        )

        reranked = []
        for result in results.results:
            reranked.append({
                "doc": documents[result.index],
                "relevance_score": result.relevance_score
            })

        return reranked

# 或者使用 BGE Reranker
from sentence_transformers import CrossEncoder

class BGEReranker:
    """BGE Reranker"""

    def __init__(self, model_name: str = "BAAI/bge-reranker-large"):
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, documents: List[str], top_k: int = 5) -> List[int]:
        """重排序"""
        pairs = [[query, doc] for doc in documents]
        scores = self.model.predict(pairs)

        # 按分数排序
        ranked_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )

        return ranked_indices[:top_k]
```

---

## RAG 架构模式

### Naive RAG

```
Query ──▶ Embedding ──▶ Vector Search ──▶ Top-K ──▶ Generate ──▶ Answer
```

**适用场景：** 简单问答，文档检索
**优点：** 实现简单，延迟低
**缺点：** 召回质量有限，无推理能力

### GraphRAG

```
Query ──▶ Embedding ──▶ Community Detection ──▶ 子图检索 ──▶ Generate
              │
              ▼
         Global Graph
```

**适用场景：** 复杂关系推理，多跳问答
**优点：** 可解释性强，关系推理
**缺点：** 实现复杂，延迟较高

### Hybrid Search RAG

```
Query ──▶ ┬──▶ Vector Search ──┬──▶ Fusion ──▶ Top-K ──▶ Generate
          │                    │
          └──▶ BM25/KNN ───────┘
```

**适用场景：** 精确关键词 + 语义检索
**优点：** 精确 + 语义平衡
**缺点：** 需要融合策略调优

### Corrective RAG (CRAG)

```
Query ──▶ Retrieval ──▶ 评估 ──▶ ┬──▶ 正确 ──▶ Generate
                                 │
                                 ├──▶ 不确定 ──▶ 知识图谱查询
                                 │
                                 └──▶ 错误 ──▶ Web Search
```

**适用场景：** 高准确性要求
**优点：** 自纠错能力
**缺点：** 实现复杂

### Self-RAG

```
Query ──▶ Retrieval ──▶ 是否相关评估 ──▶ Generate ──▶ 回答质量评估
```

**适用场景：** 需要验证生成质量
**优点：** 自适应检索
**缺点：** 多次 LLM 调用

---

## 向量数据库选型指南

| 需求 | 推荐 | 理由 |
|------|------|------|
| 快速原型开发 | Chroma/FAISS | 轻量，易用 |
| 生产环境千万级 | Qdrant/Milvus | 高性能，分布式 |
| 云原生托管 | Pinecone/Weaviate Cloud | 免运维 |
| 中文场景 | Milvus + BGE | 开源，中文优化 |
| pg 生态 | pgvector | 简化架构 |
| GPU 加速 | FAISS-GPU | 极致性能 |

---

## Chunking 策略指南

| 文档类型 | 策略 | chunk_size | overlap |
|----------|------|-------------|---------|
| 技术文档 | 递归字符 | 800 | 100 |
| 论文 | 句子级 | 动态 | 50 |
| 代码 | 代码块 | 动态 | 0 |
| 对话记录 | 消息级 | 动态 | 0 |
| 知识库 | 段落级 | 500 | 50 |

---

## Examples

### Example 1: 企业内部知识库 RAG

**场景：** 为公司内部文档构建 RAG 系统

**设计决策：**
1. **Embedding:** BGE-large-zh (中文优化)
2. **Vector DB:** Qdrant (高性能，支持滤波)
3. **Chunking:** 递归字符，800 chars, 100 overlap
4. **Retrieval:** Hybrid Search (向量 + BM25)
5. **Rerank:** BGE Reranker
6. **监控:** LangFuse (追踪每次检索质量)

**架构：**
```
文档 → Chunking → Embedding(BGE) → Qdrant
                                      ↓
Query → Embedding → Hybrid Search → Rerank → Generate → Answer
                                      ↓
                                 LangFuse 监控
```

### Example 2: 多跳推理 RAG

**场景：** 复杂法律文档问答，需要多跳推理

**设计决策：**
1. **Embedding:** text-embedding-3-large
2. **Vector DB:** Neo4j + Pinecone (图谱 + 向量)
3. **Workflow:** LangGraph 状态机
4. **模式:** GraphRAG + Chain of Thought

**架构：**
```
Query → 分解问题 → 子问题检索 → 图谱扩展 → 证据整合 → 生成
```

### Example 3: 实时对话 RAG

**场景：** 客服机器人，需要实时检索

**设计决策：**
1. **Embedding:** Cohere Embed (多语言，低延迟)
2. **Vector DB:** Pinecone (云原生，低延迟)
3. **Cache:** Redis (热门查询缓存)
4. **监控:** LangSmith (实时监控)

**架构：**
```
Query → Cache Check → ┬──▶ Hit ──▶ 返回缓存答案
                       │
                       └──▶ Miss ──▶ RAG → Store in Cache → Answer
```

---

## References

- [LangGraph 文档](https://python.langchain.com/docs/langgraph)
- [LangFuse 文档](https://langfuse.com/docs)
- [LangSmith 文档](https://docs.smith.langchain.com)
- [Pinecone 文档](https://docs.pinecone.io)
- [Qdrant 文档](https://qdrant.tech/documentation/)
- [BGE 模型](https://huggingface.co/BAAI/bge-large-zh)
- [Cohere Rerank](https://cohere.com/rerank)

---

## Maintenance

- 来源：基于 RAG 系统最佳实践和 LangGraph/LangChain 生态
- 最后更新：2026-03-23
- 更新内容：初始版本，涵盖 LangGraph 工作流、LangFuse/LangSmith 集成、RAG 架构模式
