---
name: vector-search
description: "向量检索技能：向量数据库（FAISS/Milvus/Qdrant/Weaviate）建库与检索、Embedding 训练、混合检索、重排序。用于 RAG 系统、电商推荐、语义搜索等场景。"
tags: [vector-search, faiss, milvus, qdrant, weaviate, embedding, rag, hybrid-search]
---

# 向量检索技能

## When to Use This Skill

触发此技能当：
- 设计 RAG 系统的检索层
- 搭建向量数据库服务
- 实现电商推荐系统的召回层
- 需要语义搜索或相似度匹配
- 做 Embedding 训练或微调
- 实现混合检索（向量+关键词）
- 需要检索结果重排序

## Not For / Boundaries

此技能不适用于：
- 简单的全文搜索（用数据库内置全文检索）
- 精确 ID 查询（无需向量检索）
- 关系型数据库查询（用图数据库）

## Quick Reference

### 向量数据库对比

| 数据库 | 特点 | 适用规模 | 部署复杂度 |
|----------|------|----------|------------|
| **FAISS** | Meta 开源，纯内存，最快 | 1000万以内 | 低 |
| **Milvus** | 云原生，支持过滤，GPU | 1亿以内 | 中 |
| **Qdrant** | Rust 编写，轻量，易部署 | 5000万以内 | 低 |
| **Weaviate** | 模块化，支持 GraphQL | 1亿以内 | 中 |
| **Pinecone** | 托管服务，零运维 | 无限制 | 极低 |
| **Chroma** | 简单易用，适合本地 | 100万以内 | 低 |

### 检索架构

```
┌─────────────────────────────────────────────────┐
│            向量检索系统             │
├─────────────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐   ┌──────────────┐  │
│  │  Embedding   │   │  向量数据库    │  │
│  │  训练/微调  │   │  (FAISS/      │  │
│  │             │   │  Milvus/     │  │
│  └─────────────┘   └──────────────┘  │
│         │                      │          │
│  ┌──────────────────────────────┐      │
│  │     混合检索层          │      │
│  │  向量 + BM25 + 过滤器    │      │
│  └──────────────────────────────┘      │
│         │                      │          │
│  ┌──────────────────────────────┐      │
│  │       重排序层            │      │
│  │  XGBoost/CrossEncoder      │      │
│  └──────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

## 核心模式

### 1. 向量数据库初始化

```python
# Milvus（推荐生产使用）
from pymilvus import connections, CollectionSchema, FieldSchema, DataType

# 连接 Milvus
client = connections.connect(host="localhost", port="19530")

# 定义 Collection Schema
schema = CollectionSchema([
    FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=768),
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="metadata", dtype=DataType.JSON),  # 用于过滤
])

# 创建 Collection
collection_name = "documents"
if client.has_collection(collection_name):
    client.drop_collection(collection_name)

client.create_collection(
    collection_name=collection_name,
    schema=schema
)

# 创建索引
index_params = {
    "index_type": "IVF_FLAT",  # IVF_FLAT/IVF_PQ/HNSW
    "metric_type": "IP",        # L2/IP/COSINE/HAMMING
    "params": {"nlist": 128}     # IVF 聚类数
}
client.create_index(
    collection_name=collection_name,
    index_params=index_params
)
```

### 2. Embedding 生成

```python
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModel
import torch

# 方案1：预训练模型
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
embeddings = model.encode(
    documents,
    batch_size=32,
    show_progress_bar=True
)

# 方案2：领域微调
class DomainEmbedding(torch.nn.Module):
    """领域特定 Embedding 模型"""

    def __init__(self, base_model_name, dim=768):
        super().__init__()
        self.base = AutoModel.from_pretrained(base_model_name)
        self.projection = torch.nn.Linear(self.base.config.hidden_size, dim)

    def forward(self, input_ids, attention_mask):
        outputs = self.base(input_ids, attention_mask)
        # 使用 CLS token 的 embedding
        cls_embedding = outputs.last_hidden_state[:, 0, :]
        return self.projection(cls_embedding)

# 训练
def train_domain_embedding(train_pairs):
    """使用对比学习训练领域 Embedding"""
    model = DomainEmbedding('bert-base-uncased')
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-5)
    criterion = torch.nn.TripletMarginLoss(margin=0.2)

    for epoch in range(10):
        for anchor, positive, negative in train_pairs:
            anchor_emb = model(*anchor)
            positive_emb = model(*positive)
            negative_emb = model(*negative)

            loss = criterion(anchor_emb, positive_emb, negative_emb)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
```

### 3. 向量插入

```python
# 批量插入
def insert_vectors_milvus(collection, documents, embeddings):
    """批量插入向量到 Milvus"""

    data = [
        {
            "id": str(i),
            "embedding": emb.tolist(),  # 768维向量
            "content": doc,
            "metadata": {
                "category": metadata.get("category"),
                "created_at": metadata.get("created_at"),
                "author_id": metadata.get("author_id"),
            }
        }
        for i, (doc, emb, metadata) in enumerate(zip(documents, embeddings))
    ]

    collection.insert(data)

# Qdrant
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)
client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)

client.upsert(
    collection_name="documents",
    points=[
        PointStruct(id=i, vector=emb.tolist(), payload=metadata)
        for i, (emb, metadata) in enumerate(embeddings)
    ]
)
```

### 4. 混合检索

```python
from rank_bm25 import BM25Okapi

# 构建 BM25 索引
bm25 = BM25Okapi(
    documents,
    tokenizer="base_cased",
    language="english"
)

def hybrid_search(query, top_k=20):
    """混合检索：向量 + 关键词"""

    # 向量检索
    query_embedding = model.encode(query)
    vector_results = search_vectors(query_embedding, k=10)

    # BM25 检索
    bm25_results = bm25.get_top_n(query, n=10)

    # 合并去重
    seen_ids = set()
    combined = []

    for score, doc_id in vector_results:
        if doc_id not in seen_ids:
            combined.append({
                "doc_id": doc_id,
                "vector_score": score,
                "bm25_score": 0,
                "source": "vector"
            })
            seen_ids.add(doc_id)

    for score, doc_id in bm25_results:
        if doc_id not in seen_ids:
            combined.append({
                "doc_id": doc_id,
                "vector_score": 0,
                "bm25_score": score,
                "source": "bm25"
            })
            seen_ids.add(doc_id)

    # 归一化分数
    max_vec = max(r["vector_score"] for r in combined) or 1.0
    max_bm25 = max(r["bm25_score"] for r in combined) or 1.0

    for r in combined:
        r["normalized_score"] = (
            r["vector_score"] / max_vec * 0.7 +
            r["bm25_score"] / max_bm25 * 0.3
        )

    # 排序
    combined.sort(key=lambda x: x["normalized_score"], reverse=True)
    return combined[:top_k]
```

### 5. 重排序（Reranking）

```python
import xgboost as xgb
from sentence_transformers import SentenceTransformer, util

class CrossEncoder:
    """CrossEncoder 用于重排序"""

    def __init__(self, model_name):
        self.model = SentenceTransformer(model_name)

    def encode_query(self, query):
        return self.model.encode(query, convert_to_tensor=True)

    def encode_docs(self, docs):
        return self.model.encode(docs, convert_to_tensor=True)

# 训练重排序模型
def train_reranker(pairs):
    """训练查询-文档相关性模型"""

    cross_encoder = CrossEncoder('ms-marco-MiniLM-L-6-v3')
    optimizer = torch.optim.AdamW(cross_encoder.parameters(), lr=2e-5)

    for epoch in range(5):
        for query, pos_doc, neg_docs in pairs:
            query_emb = cross_encoder.encode_query(query)
            pos_emb = cross_encoder.encode_docs([pos_doc])[0]
            neg_embs = cross_encoder.encode_docs(neg_docs)

            # 计算相似度
            pos_scores = util.cos_sim(query_emb, pos_emb)
            neg_scores = [util.cos_sim(query_emb, neg_emb) for neg_emb in neg_embs]

            # 损失：正样本分数应更高
            loss = sum([max(0, 1 - s) for s in neg_scores]) + max(0, 1 - pos_scores)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

# 推理时重排序
def rerank(query, candidates, model):
    """对检索结果重排序"""

    query_emb = model.encode_query(query)
    doc_embs = model.encode_docs([c["content"] for c in candidates])

    # 计算相似度
    scores = util.cos_sim(query_emb, doc_embs)

    # 更新分数（可结合原始分数）
    for i, candidate in enumerate(candidates):
        candidate["rerank_score"] = scores[i].item()
        candidate["final_score"] = (
            candidate.get("score", 0) * 0.5 +
            scores[i].item() * 0.5
        )

    candidates.sort(key=lambda x: x["final_score"], reverse=True)
    return candidates
```

## Examples

### Example 1: 搭建 Milvus 向量数据库

**场景：** 为电商推荐系统搭建向量数据库

**实现：**
```python
from pymilvus import connections, CollectionSchema, FieldSchema, DataType

# 连接
client = connections.connect(
    alias="default",
    host="localhost",
    port="19530"
)

# Collection Schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
    FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=768),
    FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=512),
    FieldSchema(name="price", dtype=DataType.DOUBLE),
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=64),
    FieldSchema(name="tags", dtype=DataType.ARRAY, max_capacity=100),
]

# 创建 Collection
client.create_collection("products", fields=fields)

# 创建索引
client.create_index(
    collection_name="products",
    index_name="vector_index",
    field_name="vector",
    index_type="IVF_FLAT",
    metric_type="IP",  # 内积相似度
    params={"nlist": 128}
)
```

**预期输出：** Milvus Collection 创建完成，支持 768 维向量插入和检索

### Example 2: 电商推荐召回

**场景：** 根据用户行为召回相关商品

**实现：**
```python
def product_recall(user_id, user_history, top_k=100):
    """多路召回商品"""

    recalls = []

    # 路径1：历史交互向量召回
    recent_ids = [h["product_id"] for h in user_history[-20:]]
    query_vec = aggregate_history_vectors(recent_ids)  # 加权平均
    vec_results = search_milvus(query_vec, filter={}, k=50)
    recalls.extend(vec_results)

    # 路径2：同类目协同过滤
    category_set = get_user_categories(user_history)
    cf_results = collaborative_filtering(user_id, category_set, k=30)
    recalls.extend(cf_results)

    # 路径3：热门商品（规则召回）
    hot_results = get_hot_products_by_category(category_set, k=20)
    recalls.extend(hot_results)

    # 去重
    seen = set()
    unique_recalls = []
    for r in recalls:
        if r["id"] not in seen:
            unique_recalls.append(r)
            seen.add(r["id"])

    return unique_recalls[:top_k]
```

**预期输出：** 召回 100 个候选商品，包含向量相关、协同过滤、热门商品

### Example 3: RAG 检索层

**场景：** 为知识问答系统构建检索层

**实现：**
```python
from pymilvus import connections
from sentence_transformers import SentenceTransformer

# 初始化
client = connections.connect(host="localhost", port="19530")
collection = client.get_collection("knowledge_base")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# 检索函数
def retrieve_knowledge(query, top_k=5, filters=None):
    """检索相关知识片段"""

    # 生成查询向量
    query_embedding = model.encode(query)

    # 构建过滤条件
    if filters:
        filter_expr = f"category in {filters['categories']}"
    else:
        filter_expr = ""

    # 向量搜索
    results = collection.search(
        data=[query_embedding],
        anns_field="vector",
        param={
            "metric_type": "COSINE",
            "params": {"nprobe": 16},
            "top_k": top_k,
            "expr": filter_expr
        }
    )

    return [
        {
            "content": r["entity"]["content"],
            "score": r["distance"],  # 距离越小越好
            "metadata": r["entity"]
        }
        for r in results
    ]
```

**预期输出：** 返回 top-k 个相关知识片段，带相似度分数

### Example 4: 域于 Qdrant 的轻量检索

**场景：** 快速搭建本地向量检索服务

**实现：**
```python
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer

# 初始化 Qdrant
client = QdrantClient(url="http://localhost:6333")

# 创建 Collection
client.recreate_collection(
    collection_name="docs",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE)
)

# 插入文档
def insert_docs(docs):
    vectors = [
        models.PointStruct(
            id=str(i),
            vector=model.encode(doc["text"]).tolist(),
            payload={"title": doc["title"], "category": doc["category"]}
        )
        for i, doc in enumerate(docs)
    ]
    client.upsert(collection_name="docs", points=vectors)

# 检索
def search(query, limit=10, category_filter=None):
    query_vector = model.encode(query).tolist()

    search_filter = None
    if category_filter:
        search_filter = models.Filter(
            must=[models.FieldCondition(key="category", match=models.MatchValue(value=category_filter))]
        )

    results = client.search(
        collection_name="docs",
        query_vector=query_vector,
        query_filter=search_filter,
        limit=limit,
        with_payload=True
    )

    return [
        {
            "id": r.id,
            "score": r.score,
            "payload": r.payload
        }
        for r in results
    ]
```

**预期输出：** Qdrant 集合部署完成，支持向量检索和过滤

## References

- [Milvus Docs](https://milvus.io/docs/)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [FAISS GitHub](https://github.com/facebookresearch/faiss)
- [Sentence Transformers](https://www.sbert.net/)
- [Cross-Encoders for Reranking](https://www.sbert.net/examples/applications/retrieve-ranking/)

## Maintenance

- 来源：基于向量检索最佳实践 + RAG 系统设计经验
- 最后更新：2026-01-24
- 已知限制：
  - 需要选择合适的向量数据库（规模/性能/成本权衡）
  - Embedding 质量直接影响检索效果
  - 大规模检索需要合理的分片和索引策略
