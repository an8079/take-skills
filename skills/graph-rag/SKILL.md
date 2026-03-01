---
name: graph-rag
description: "知识图谱与 RAG 技能：图谱构建、实体对齐、关系抽取、Neo4j/RDF 三元组存储、SPARQL 查询、知识图谱嵌入（GraphRAG/KGE）、混合检索。用于知识库构建、专业问答、语义搜索增强等场景。"
tags: [knowledge-graph, rag, neo4j, rdf, sparql, graph-embedding, entity-alignment, hybrid-retrieval]
---

# 知识图谱与 RAG 技能

## When to Use This Skill

触发此技能当：
- 构建领域知识图谱
- 实现 RAG 系统的图谱增强检索
- 知识图谱存储与查询
- 实体关系抽取与对齐
- 知识图谱嵌入（GraphRAG/KGE）
- 图数据库选型与优化

## Not For / Boundaries

此技能不适用于：
- 简单的键值存储（用数据库或缓存即可）
- 线性关系数据（不涉及复杂图结构）
- 实时大规模图谱更新（需专用流处理框架）

## Quick Reference

### 图数据库对比

| 数据库 | 特点 | 适用规模 | 查询语言 | 事务支持 |
|------|------|----------|---------|---------|
| **Neo4j** | 原生图，高性能 | 百万级 | Cypher/Java/Python | 支持ACID | 中 |
| **MongoDB** | 文档图，易用 | 千万级 | JavaScript/Python | 支持多文档 | 高 |
| **PostgreSQL** | 关系型，强事务 | 百万级 | SQL/PLpgSQL | 完整ACID | 高 |
| **NebulaGraph** | 嵌入式，分布式 | 亿级+ | Java/Python | 支持查询 | 低 |
| **ArangoDB** | 多模型，高性能 | 千万级 | AQL/JavaScript | 支持 | 高 |
| **RedisGraph** | 内存图，极速 | 百万级 | 无（API） | 嵌入式 | 低 |
| **Amazon Neptune** | 云托管，弹性 | 亿级 | Gremlin/JavaScript | 支持开放图 | 低 |
| **JanusGraph** | 云托管，分析友好 | 百亿级 | Gremlin/JavaScript | 支持 | 低 |
| **OrientDB** | 嵌入式，SQL扩展 | 百万级 | SQL | 原生SQL | 完整ACID | 高 |
| **Memgraph** | 高性能，图查询语言 | 亿级 | GQL/C++ | 支持 | 低 |

### RAG 架构对比

| 方案 | 检索层 | 知识库 | 优势 | 缺点 |
|------|--------|--------|------|
| **Naive RAG** | 线性检索 | 矢量库 | 简单 | 无图谱推理 |
| **GraphRAG** | 图遍历推理 | 向量+图 | 可解释 | 复杂 |
| **Hybrid Search** | 混合检索 | 向量+图谱 | 精确 | 需要图嵌入 |
| **CRAG** | 压缩图检索 | 子图 | 压缩 | 适合大规模 |

## 核心组件

### 1. Neo4j 图谱构建

```python
from neo4j import GraphDatabase

def build_knowledge_graph(driver_uri, auth):
    """构建 Neo4j 知识图谱"""

    graph = GraphDatabase.driver(driver_uri, auth=auth)
    graph.delete_all()  # 清空现有图谱

    return graph

def create_entity_relationship(graph, entity_type, properties):
    """创建实体类型"""

    # 创建约束（唯一性）
    graph.execute(f"""
        CREATE CONSTRAINT entity_name_unique IF NOT EXISTS (
            SELECT name FROM {entity_type}
        )
        """)

    # 创建索引
    graph.execute(f"""
        CREATE INDEX entity_name_idx ON {entity_type}(name)
        """)

    # 创建节点标签
    graph.execute(f"""
        CALL apoc.create.addLabels([
            {{
                "labels": [
                    "Person", "Organization", "Product", "Location", "Category"
                ],
                "relationshipTypes": [
                    "WORKS_AT", "LOCATED_AT", "PART_OF",
                    "HAS_PRODUCT", "BELONGS_TO", "RELATED_TO"
                ]
            }}
        ])
        """)

    return graph

# 创建实体
def create_entity(graph, entity_type, properties):
    """创建实体类型"""

    props_str = ", ".join([f"{{p['name']}}: {{p['type']}}" for p in properties])

    graph.execute(f"""
        CREATE (:Person {props_str})
        """)

    # 创建关系类型
    graph.execute(f"""
        CREATE (:WORKS_AT {props_str})
        """)

def add_entities_batch(graph, entities_data):
    """批量添加实体"""

    with graph.begin_transaction() as tx:
        for entity in entities_data:
            node = graph.create(
                entity['type'],
                **entity['properties']
            )

        tx.commit()
```

### 2. SPARQL 查询

```python
from neo4j import GraphDatabase

def sparql_query(graph, query, params=None):
    """执行 SPARQL 查询"""

    result = graph.run(query, parameters=params)

    # 处理结果
    entities = []
    for record in result:
        entities.append({
            'id': record['id'],
            'labels': record.get('labels', []),
            'properties': record.get('properties', {})
        })

    return entities

# 示例查询
def find_person_by_name(graph, name):
    """根据姓名查找人物"""

    query = f"""
    MATCH (p:Person {{name: '{name}'}})
        RETURN p
    """

    return sparql_query(graph, query)
```

### 3. 图谱嵌入（GraphRAG/KGE）

```python
import torch
import torch.nn as nn

class GraphRAG(nn.Module):
    """GraphRAG 图谱嵌入模型"""

    def __init__(self, num_entities=10000, num_relations=50000, embedding_dim=128):
        super().__init__()

        # 实体嵌入表
        self.entity_embedding = nn.Embedding(num_entities, embedding_dim)
        # 关系嵌入表
        self.relation_embedding = nn.Embedding(num_relations, embedding_dim)

    def forward(self, entity_indices, relation_indices, neighbor_indices):
        """前向传播"""

        # 实体嵌入
        entity_embs = self.entity_embedding(entity_indices)

        # 关系嵌入
        relation_embs = self.relation_embedding(relation_indices)

        # 邻居节点嵌入
        neighbor_embs = self.entity_embedding(neighbor_indices)

        # 聚合嵌入（可设计更复杂的方式）
        combined = entity_embs + relation_embs + neighbor_embs

        return combined

# 训练
def train_graph_embedding(triples, epochs=100):
    """训练图谱嵌入模型"""

    model = GraphRAG()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.BCEWithLogitsLoss()

    for epoch in range(epochs):
        model.train()
        total_loss = 0

        for triple in triples:
            head, relation, tail = triple
            loss = criterion(model(head, relation, tail))
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        print(f"Epoch {epoch}, Loss: {total_loss / len(triples)}")

    return model
```

### 4. 混合检索（向量 + 图谱）

```python
import faiss
import numpy as np

class HybridRetrieval:
    """混合检索系统（向量 + 图谱）"""

    def __init__(self, vector_index, graph):
        self.vector_index = vector_index
        self.graph = graph

    def search(self, query_embedding, top_k=10):
        """混合检索"""

        # 1. 向量检索
        vec_distances, vec_indices = self.vector_index.search(query_embedding, k=top_k)

        # 2. 图谱路径扩展（2-hop）
        graph_results = self._expand_graph_path(vec_indices, hops=2)

        # 3. 融合结果
        final_results = []

        for i, vec_idx in enumerate(vec_indices[0]):
            graph_matches = graph_results.get(i, [])

            # 计算融合分数
            vec_score = 1 / (1 + vec_distances[0][i])
            graph_score = len(graph_matches) / 5  # 假设 5 个相关节点加分

            final_score = vec_score * 0.7 + graph_score * 0.3

            final_results.append({
                'id': i,
                'vector_score': vec_score,
                'graph_score': graph_score,
                'final_score': final_score,
                'graph_entities': graph_matches
            })

        # 按最终分数排序
        final_results.sort(key=lambda x: x['final_score'], reverse=True)

        return final_results[:top_k]

    def _expand_graph_path(self, entity_indices, hops=2):
        """扩展图谱路径（获取邻居节点）"""

        paths = {}
        for idx in entity_indices:
            entities = self._get_neighbors(idx, hops)
            paths[idx] = entities

        return paths

    def _get_neighbors(self, entity_id, hops):
        """获取实体的邻居节点"""

        # 这里简化实现，实际需要 Neo4j 查询
        neighbors = []
        # TODO: 执行图谱查询获取邻居

        return neighbors
```

### 5. 知识图谱嵌入（BGE/MTEB）

```python
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

class BGEEncoder(nn.Module):
    """BGE 图谱嵌入模型"""

    def __init__(self, model_name='BAAI/bge-base-en', embedding_dim=768):
        super().__init__()

        self.model = AutoModel.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.embedding_dim = self.model.config.hidden_size

    def encode_entities(self, entity_texts):
        """编码实体为向量"""

        # Tokenize
        encoded = self.tokenizer(
            entity_texts,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors='pt'
        )

        # 获取 CLS token 嵌入作为实体表示
        with torch.no_grad():
            outputs = self.model(
                encoded['input_ids'],
                attention_mask=encoded['attention_mask'],
                output_attentions=None,
                output_hidden_states=None,
                return_dict=False
            )

        # CLS token 嵌入作为实体表示
        cls_embeddings = outputs.last_hidden_state[:, 0, :]  # [batch, 768]

        # 归一化
        normalized = torch.nn.functional.normalize(cls_embeddings, p=2, dim=1)

        return normalized.cpu().numpy()

# 使用示例
entity_texts = ["阿里巴巴", "马云", "杭州", "阿里巴巴集团"]
embeddings = encode_entities(entity_texts)
```

## Examples

### Example 1: 构建电商知识图谱

**场景：** 为电商平台构建商品知识图谱

**实现：**
```python
from neo4j import GraphDatabase

# 连接 Neo4j
graph = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

# 创建约束和索引
create_entity_relationship(graph, "Product", [
    {"name": "name", "type": "STRING"},
    {"name": "price", "type": "FLOAT"},
    {"name": "category", "type": "STRING"},
    {"name": "brand", "type": "STRING"}
])

# 添加示例数据
products = [
    {"name": "iPhone 15 Pro", "price": 6999, "category": "手机", "brand": "Apple"},
    {"name": "MacBook Air", "price": 7999, "category": "笔记本", "brand": "Apple"},
]

with graph.begin_transaction() as tx:
    for product in products:
        node = graph.create("Product", **product)
        tx.commit()

print(f"添加了 {len(products)} 个商品节点")
```

**预期输出：** Neo4j 知识图谱，包含商品实体和关系

### Example 2: RAG 知识增强检索

**场景：** 结合知识图谱回答用户问题

**实现：**
```python
def rag_with_knowledge_graph(query, vector_index, graph):
    """RAG + 知识图谱检索"""

    # 1. 向量检索
    vec_results = vector_index.search(query, k=5)

    # 2. 从检索结果中提取实体
    entities = extract_entities_from_results(vec_results)

    # 3. 图谱查询（获取相关实体和关系）
    graph_entities = query_graph(graph, entities)

    # 4. 构建答案
    answer = construct_answer(query, vec_results, graph_entities)

    return answer

def construct_answer(query, vec_results, graph_entities):
    """构建答案（向量结果 + 知识图谱）"""

    # 向量结果
    vec_items = [{"id": r["id"], "score": r["score"]} for r in vec_results]

    # 知识结果
    graph_context = summarize_graph_context(graph_entities)

    answer = f"""
    根据您的查询"{query}"，我找到以下相关信息：

    相关商品：
    {vec_items}

    知识库相关信息：
    {graph_context}

    答案：综合以上信息，为您推荐...
    """

    return answer
```

**预期输出：** 结合向量检索和知识图谱的增强 RAG 回答

### Example 3: 图谱嵌入训练

**场景：** 训练 BGE 模型用于语义检索

**实现：**
```python
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

model = AutoModel.from_pretrained('BAAI/bge-base-en')
tokenizer = AutoTokenizer.from_pretrained('BAAI/bge-base-en')

# 编码文本对
text_pairs = [
    ("商品", "商品描述和价格"),
    ("手机", "通讯设备和功能"),
]

# 训练对比学习
# 这里需要更多训练数据和完整实现
# 参考 ContrastiveEmbedding 训练部分
```

**预期输出：** 训练好的 BGE 模型，用于语义相似度计算

## References

- [Neo4j Documentation](https://neo4j.com/docs/)
- [SPARQL 1.1](https://www.w3.org/TR/sparql11/)
- [GraphRAG Paper](https://arxiv.org/abs/2310.00844)
- [BGE Paper](https://arxiv.org/abs/2309.14107)
- [GraphRAGE Paper](https://arxiv.org/abs/2405.09555)

## Maintenance

- 来源：基于知识图谱最佳实践和 RAG 系统设计经验
- 最后更新：2026-01-24
- 已知限制：
  - 大规模图谱需要专业的图数据库
  - 图嵌入训练需要高质量的实体对数据
  - RAG 混合检索需要调优融合权重
