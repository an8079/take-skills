---
name: embedding-generation
description: "Embedding 训练技能：文本/图像/多模态向量化、对比学习、领域适配微调、向量索引构建。用于 RAG 检索优化、语义搜索、个性化推荐等场景。"
tags: [embedding, vectorization, contrastive-learning, fine-tuning, semantic-search, multi-modal]
---

# Embedding 训练技能

## When to Use This Skill

触发此技能当：
- 训练商品/文档的 Embedding 模型
- 优化现有 Embedding 以提升检索效果
- 领域自适应微调
- 对比学习训练
- 构建向量索引用于 RAG

## Not For / Boundaries

此技能不适用于：
- 使用预训练通用 Embedding（无需训练）
- 简单的词袋或 TF-IDF 向量
- 视频或 3D 数据向量化

## Quick Reference

### Embedding 模型对比

| 模型 | 类型 | 向量维度 | 推荐用途 | 训练数据需求 |
|------|------|----------|----------------|
| **BERT** | 掩码器 | 768 | 通用语义 | 文本对 |
| **RoBERTa** | 掩码器 | 768 | 对比学习 | 文本对 |
| **SimCSE** | 掩码器 | 768 | 对比学习 | 语义相似度 |
| **E5** | 掩码器 | 1024 | 代码理解 | 代码检索 |
| **Sentence-BERT** | 掩码器 | 384 | 通用语义 | 多语言 |
| **CLIP** | 多模态 | 512 | 图文对齐 | 图像检索 |
| **CoLLA** | 对比学习 | 768 | 推荐召回 | 文本对 |
| **BGE-M3** | 对比学习 | 1024 | 通用语义 | 文本对 |
| **Jina** | 对比学习 | 768 | 高性能 | 文本对 |
| **OpenCLIP** | 多模态 | 768 | 开源 | 图像检索 |
| **Nomic** | 对比学习 | 768/768 | 高检索 | 语义对 |
| **MTEB** | 对比学习 | 768 | 高检索 | 文本对 |

## 核心组件

### 1. 对比学习训练

```python
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

class ContrastiveEmbedding(nn.Module):
    """对比学习模型（如 SimCSE）"""

    def __init__(self, model_name, embedding_dim=768):
        super().__init__()

        # 加载预训练模型
        self.encoder = AutoModel.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.embedding_dim = embedding_dim

        # 投影头（用于相似度计算）
        self.projection = nn.Linear(
            self.encoder.config.hidden_size,
            embedding_dim
        )

    def forward(self, input_texts, device='cuda'):
        """前向传播"""

        # Tokenize
        encoded_input = self.tokenizer(
            input_texts,
            padding=True,
            truncation=True,
            return_tensors='pt'
        )

        embeddings = self.encoder(
            encoded_input['input_ids'].to(device),
            attention_mask=encoded_input['attention_mask'].to(device)
        ).last_hidden_state[:, 0, :]

        # 投影到 embedding 空间
        projected = self.projection(embeddings)

        # 归一化
        normalized = torch.nn.functional.normalize(projected, p=2, dim=1)

        return normalized

def train_contrastive_model(train_pairs, epochs=5):
    """训练对比学习模型"""

    model = ContrastiveEmbedding('sentence-transformers/paraphrase-multilingual-MiniLM-L6-v2')
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    criterion = nn.CosineEmbeddingLoss()

    for epoch in range(epochs):
        model.train()
        total_loss = 0

        for anchor, positive in train_pairs:
            # Anchor 输入
            anchor_input = model.tokenizer(anchor, padding=True, truncation=True, return_tensors='pt')
            # Positive 输入
            positive_input = model.tokenizer(positive, padding=True, truncation=True, return_tensors='pt')

            anchor_emb = model([anchor_input['input_ids'], anchor_input['attention_mask']])
            positive_emb = model([positive_input['input_ids'], positive_input['attention_mask']])

            # 对比损失（拉近正样本，推开负样本）
            loss = criterion(anchor_emb, positive_emb)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        print(f"Epoch {epoch}, Loss: {total_loss / len(train_pairs)}")

    return model

# 批量编码
def encode_batch(model, texts, batch_size=32, device='cuda'):
    """批量编码文本为向量"""

    encoded = model.tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=128,
        return_tensors='pt'
    )

    input_ids = encoded['input_ids'].to(device)
    attention_mask = encoded['attention_mask'].to(device)

    with torch.no_grad():
        embeddings = model(
            input_ids,
            attention_mask=attention_mask
        ).last_hidden_state[:, 0, :]

    return embeddings.cpu().numpy()
```

### 2. 领域自适应微调

```python
import torch
import torch.nn as nn
from transformers import AutoModel, AdapterType

class DomainAdaptedEmbedding(nn.Module):
    """领域自适应微调的 Embedding 模型"""

    def __init__(self, base_model_name, domain_data_path, adapter_rank=8):
        super().__init__()

        # 加载基础模型
        self.base_model = AutoModel.from_pretrained(base_model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)
        self.embedding_dim = self.base_model.config.hidden_size

        # 加载领域数据
        domain_embeddings = torch.load(domain_data_path)

        # 创建 LoRA 适配器
        self.adapters = nn.ModuleDict({
            f'adapter_{i}': AdapterType.get_adapter(
                self.base_model.config.hidden_size,
                r=adapter_rank  # 低秩适配器
            )
            for i in range(adapter_rank)
        })

        # 初始化适配器权重
        for adapter in self.adapters.values():
            nn.init.xavier_uniform_(adapter[0])

    def forward(self, input_ids, attention_mask, adapter_id=0):
        """前向传播（带领域适配）"""

        outputs = self.base_model(
            input_ids,
            attention_mask=attention_mask,
            adapter_names=[f'adapter_{adapter_id}']
        )

        return outputs.last_hidden_state[:, 0, :]

def train_domain_adapter(base_model, domain_data, num_epochs=3):
    """训练领域适配器"""

    # 假设 domain_data 是 (token_ids, attention_mask, adapter_id)
    optimizer = torch.optim.AdamW([
        {'params': adapter.parameters()}
        for adapter in base_model.adapters.values()
    ], lr=1e-4)

    criterion = nn.MSELoss()  # 或对比损失

    for epoch in range(num_epochs):
        for batch in domain_data:
            input_ids, attention_mask, adapter_id = batch

            # 前向
            embeddings = base_model(
                input_ids.unsqueeze(0),
                attention_mask.unsqueeze(0),
                adapter_names=[f'adapter_{adapter_id}']
            )

            # 计算损失
            # 这里简化，实际需要获取 target embeddings
            loss = criterion(embeddings, embeddings)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        print(f"Epoch {epoch}, Loss: {loss.item()}")

    return model
```

### 3. 向量索引构建

```python
import faiss
import numpy as np

def build_faiss_index(embeddings, index_type='IVF_FLAT', nlist=128):
    """构建 FAISS 索引"""

    dimension = embeddings.shape[1]

    # IVF_FLAT 索引（内存占用低，搜索快）
    index = faiss.IndexFlatL2(dimension)

    # 训练索引
    index.add(embeddings)

    # 保存索引
    faiss.write_index(index, 'product_embeddings.index')

    return index

def build_faiss_index_with_ivfpq(embeddings, nlist=128, m=16):
    """构建 IVFPQ 索引（更快，内存占用更大）"""

    dimension = embeddings.shape[1]

    # IVFPQ 索引
    quantizer = faiss.IndexIVFPQ(dimension, nlist=nlist, m=m)
    quantizer.train(embeddings)
    index = quantizer.index

    # 保存索引
    faiss.write_index(quantizer, 'product_embeddings_ivfpq.index')

    return quantizer, index

# 搜索函数
def search_similar(query_embedding, index, k=10):
    """向量相似度搜索"""

    # FAISS L2 距离
    scores, indices = index.search(query_embedding, k)

    return {
        'indices': indices,
        'scores': scores,
        'similarities': 1 / (1 + scores)  # 转换为相似度
    }
```

### 4. 多模态 CLIP 训练

```python
import torch
import torch.nn as nn
from transformers import CLIPProcessor, CLIPModel

class MultiModalCLIP(nn.Module):
    """多模态 CLIP 模型（图像+文本联合嵌入）"""

    def __init__(self, model_name='openai/clip-vit-base-patch32', embedding_dim=512):
        super().__init__()

        # 加载 CLIP 模型
        self.model = CLIPModel.from_pretrained(model_name)
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.embedding_dim = embedding_dim
        self.logit_scale = 100

    def encode_image(self, image_path, device='cuda'):
        """图像编码"""

        from PIL import Image
        image = Image.open(image_path).convert('RGB')
        inputs = self.processor(images=image, return_tensors='pt', padding=True)

        with torch.no_grad():
            image_features = self.model.vision_model(**inputs.to(device))

        # 归一化
        image_features = image_features / image_features.norm(dim=1, keepdim=True)

        return image_features.cpu().numpy()

    def encode_text(self, text, device='cuda'):
        """文本编码"""

        inputs = self.processor(text=text, return_tensors='pt', padding=True, truncation=True)

        with torch.no_grad():
            text_features = self.model.text_model(**inputs.to(device))

        # 归一化
        text_features = text_features / text_features.norm(dim=1, keepdim=True)

        return text_features.cpu().numpy()

    def forward(self, image, text):
        """前向传播（计算图像-文本相似度）"""

        # 图像和文本特征
        image_features = self.encode_image(image)
        text_features = self.encode_text(text)

        # 计算对数相似度（温度参数控制）
        logits_per_image = (image_features @ text_features.T) / self.logit_scale

        return logits_per_image
```

### 5. 向量检索优化

```python
import numpy as np
import faiss

class OptimizedVectorSearch:
    """优化的向量检索系统"""

    def __init__(self, index_type='IVFPQ', embedding_dim=768):
        self.index_type = index_type
        self.embedding_dim = embedding_dim

    def build_index(self, embeddings):
        """构建检索索引"""

        if self.index_type == 'IVFPQ':
            # IVFPQ 索引（更快搜索）
            quantizer = faiss.IndexIVFPQ(
                self.embedding_dim,
                nlist=128,
                m=16
            )
            quantizer.train(embeddings)
            self.index = quantizer.index
        else:
            # IVF_FLAT 索引（内存占用低）
            self.index = faiss.IndexFlatL2(self.embedding_dim)
            self.index.add(embeddings)

    def search(self, query_embedding, k=100, rerank=True):
        """向量搜索（可选重排序）"""

        if self.index_type == 'IVFPQ':
            # IVFPQ 搜索
            distances, indices = self.index.search(query_embedding, k)
            # 重排序（重新计算精确距离）
            vectors = self.index.index.codes[indices[0]]
            exact_distances = np.linalg.norm(vectors - query_embedding, axis=1)
            return indices, exact_distances
        else:
            # IVF_FLAT 搜索
            distances, indices = self.index.search(query_embedding, k)
            return indices, distances

    def batch_search(self, query_embeddings, k=100):
        """批量搜索"""

        if self.index_type == 'IVFPQ':
            distances, indices = self.index.search(query_embeddings, k)
        else:
            distances, indices = self.index.search(query_embeddings, k)

        return indices, distances
```

## Examples

### Example 1: 商品向量检索优化

**场景：** 电商平台需要高效的商品向量检索系统

**实现：**
```python
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# 1. 训练/加载 Embedding 模型
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# 加载所有商品并编码
products = load_products_from_database()  # 商品列表
product_texts = [p['title'] + ' ' + p['category'] + ' ' + p['description']
                   for p in products]

product_embeddings = model.encode(product_texts, batch_size=64)

# 2. 构建 IVFPQ 索引
quantizer = faiss.IndexIVFPQ(
    d=product_embeddings.shape[1],      # 向量维度
    nlist=128,                             # Voronoi 数量
    m=16                                   # 子量化器数量
    quantizer.train(product_embeddings)
index = quantizer.index

# 3. 保存索引
faiss.write_index(quantizer, 'products_ivfpq.index')

# 4. 检索服务
def product_search(query, top_k=10):
    """商品向量检索"""

    # 编码查询
    query_embedding = model.encode(query)

    # IVFPQ 检索
    distances, indices = index.search(query_embedding, k=top_k)

    # 获取结果
    results = []
    for idx in indices[0]:
        results.append({
            'product_id': products[idx]['id'],
            'product': products[idx]['title'],
            'score': 1 / (1 + distances[0][idx]),  # 距离转相似度
        })

    return results
```

**预期输出：** 高效的商品向量检索系统，支持快速检索和排序

### Example 2: 领域适配微调

**场景：** 时尚电商需要领域特定的 Embedding

**实现：**
```python
from transformers import AutoModel, AdapterType

# 基础模型
base_model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')

# 时尚领域数据（文本对）
fashion_pairs = load_fashion_domain_data()  # [(query, positive), ...]

# 训练领域适配器
# 这里简化实现，实际需要完整训练循环
domain_model = train_domain_adapter(
    base_model.name,
    fashion_domain_data='fashion_embeddings.pth',
    adapter_rank=16
)

# 保存模型
torch.save({
    'base_model': base_model.state_dict(),
    'adapters': domain_model.adapters.state_dict()
}, 'fashion_domain_adapted.pt')

# 使用领域微调模型编码
user_query = "我喜欢复古风格"
domain_embedding = domain_model.encode_text(user_query)
```

**预期输出：** 针对特定领域的 Embedding 模型，提升检索准确率

### Example 3: 图文多模态检索

**场景：** 用户上传图片搜索相似商品

**实现：**
```python
from transformers import CLIPProcessor, CLIPModel
import faiss

# 加载 CLIP 模型
model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32')
processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')

# 编码所有商品图片
product_images = load_product_images()
image_embeddings = []
for img in product_images:
    emb = model.encode_image(img)
    image_embeddings.append(emb)

# 构建 FAISS 索引
index = faiss.IndexFlatIP(512)  # 内积相似度
index.add(np.array(image_embeddings))

# 图文检索
def image_text_search(query_image, text_query=None):
    """图像或文本检索"""

    if text_query:
        # 文本检索
        text_emb = model.encode_text(text_query)
        distances, indices = index.search(text_emb, k=10)
    else:
        # 图像检索
        img_emb = model.encode_image(query_image)
        distances, indices = index.search(img_emb, k=10)

    return indices[0], distances[0]
```

**预期输出：** 支持图片和文本两种查询方式的多模态检索

## References

- [Sentence Transformers](https://www.sbert.net/)
- [OpenAI CLIP](https://openai.com/research/clip/)
- [FAISS Documentation](https://faiss.ai/)
- [SimCSE Paper](https://arxiv.org/abs/2108.08804)
- [BGE-M3 Paper](https://arxiv.org/abs/2109.02607)

## Maintenance

- 来源：基于向量检索最佳实践和 RAG 系统设计经验
- 最后更新：2026-01-24
- 已知限制：
  - 训练对比学习需要大量正负样本对
  - 领域适配需要高质量的领域数据
  - 多模态模型计算开销大
