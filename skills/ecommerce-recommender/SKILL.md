---
name: ecommerce-recommender
description: "电商推荐系统专家。设计实现协同过滤、内容推荐、向量检索、用户画像等推荐算法。适用于淘宝/京东/拼多多等电商场景。"
tags: [recommendation, ecommerce, vector-search, collaborative-filtering, user-profiling]
---

# 电商推荐系统专家

## When to Use This Skill

触发此技能当：
- 设计电商推荐系统（淘宝/京东/拼多多等）
- 需要实现商品推荐算法
- 分析用户购物意图和行为
- 构建向量检索和重排序系统
- 优化推荐准确率和点击率

## Not For / Boundaries

此技能不适用于：
- 社交媒体内容优化（请用 customer-service-expert）
- 简单的排序功能
- 非推荐系统的搜索

## Quick Reference

### 推荐系统架构

```
┌─────────────────────────────────────────────────┐
│            电商推荐系统              │
├─────────────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐   ┌──────────────┐  │
│  │  召回层    │   │   排序层    │  │
│  │  Recall     │   │  Ranking    │  │
│  │             │   │             │  │
│  │ 向量检索    │   │  多目标优化  │  │
│  │ 协同过滤   │   │  CTR预估    │  │
│  │ 规则推荐    │   │             │  │
│  └─────────────┘   └──────────────┘  │
│         │                      │          │
│  ┌──────────────────────────────┐      │
│  │       用户画像层          │      │
│  │  行为特征、兴趣标签       │      │
│  └──────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | 功能 | 技术方案 |
|------|------|----------|
| 向量检索 | 语义相似度推荐 | FAISS/Milvus/Qdrant + Embedding |
| 协同过滤 | 基于历史行为推荐 | Matrix Factorization/NeuCF/Graph |
| 内容推荐 | 基于商品特征推荐 | TF-IDF/BM25/分类模型 |
| 多路召回 | 组合多种召回源 | OR/Weighted Sum |
| 重排序 | 综合多特征优化排序列表 | XGBoost/DeepFM/LightGBM |
| 实时特征 | 用户当前会话特征 | 在线学习/即时更新 |

## 算法实现

### 1. 向量检索（召回）

```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# 初始化 Embedding 模型
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# 构建商品向量索引
def build_product_index(products):
    """构建商品向量索引"""
    # 商品描述转为向量
    embeddings = model.encode(
        [p['title'] + ' ' + p['category'] + ' ' + p['attributes']
         for p in products],
        batch_size=64,
        show_progress_bar=True
    )

    # FAISS 索引
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # 内积相似度
    index.add(embeddings)

    return index, embeddings

# 召回相关商品
def recall_by_query(query, index, k=100):
    """根据用户查询召回商品"""
    query_vec = model.encode([query])
    scores, indices = index.search(query_vec, k)
    return scores, indices

# 召回历史相关
def recall_by_history(user_history, index, k=50):
    """根据用户历史推荐相似商品"""
    # 获取最近交互的商品向量
    recent_items = [h['product_id'] for h in user_history[-10:]]
    # 搜索相似商品
    similar_scores, similar_indices = index.search(
        embeddings[recent_items],
        k * len(recent_items)
    )
    return similar_scores, similar_indices
```

### 2. 协同过滤

```python
import torch
import torch.nn as nn

class NeuCF(nn.Module):
    """神经协同过滤模型"""
    def __init__(self, n_users, n_items, embedding_dim=64):
        super().__init__()
        # 用户和物品嵌入
        self.user_embedding = nn.Embedding(n_users, embedding_dim)
        self.item_embedding = nn.Embedding(n_items, embedding_dim)

        # MLP 层
        self.fc_layers = nn.Sequential(
            nn.Linear(embedding_dim * 2, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, user_ids, item_ids):
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)
        concat = torch.cat([user_emb, item_emb], dim=-1)
        return self.fc_layers(concat)

# 训练
def train_ncf(train_data, n_users, n_items, epochs=10):
    model = NeuCF(n_users, n_items)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCELoss()

    for epoch in range(epochs):
        for batch in train_data:
            user_ids, item_ids, labels = batch
            predictions = model(user_ids, item_ids)
            loss = criterion(predictions.squeeze(), labels.float())

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
```

### 3. 多路召回（Multi-Recall）

```python
def multi_recall(user, query, history, index):
    """多路召回：组合多种召回源"""

    recalls = {}

    # 路径1：向量检索
    vec_scores, vec_indices = recall_by_query(query, index, k=50)
    recalls['vector'] = list(zip(vec_scores[0], vec_indices[0]))

    # 路径2：协同过滤
    cf_items = collaborative_filtering(user, k=30)
    recalls['cf'] = cf_items

    # 路径3：内容推荐
    content_items = content_based_filtering(history, k=20)
    recalls['content'] = content_items

    # 路径4：规则推荐
    rule_items = rule_based_recommendation(user, history)
    recalls['rule'] = rule_items

    # 去重合并
    all_items = {}
    for path, items in recalls.items():
        for score, item_id in items:
            if item_id not in all_items:
                all_items[item_id] = {
                    'item_id': item_id,
                    'score': score,
                    'source': path
                }

    return list(all_items.values())[:200]  # Top 200 候选
```

### 4. 重排序（Reranking）

```python
import lightgbm as lgb

def build_rerank_features(user, items, context):
    """构建重排序特征"""
    features = []
    for item in items:
        feat = {
            # 用户-商品交互特征
            'user_item_similarity': user_item_cosine(user, item),
            'user_category_preference': user_category_score(user, item['category']),

            # 商品特征
            'item_popularity': item['view_count'] / 10000,
            'item_rating': item.get('rating', 4.0),
            'item_price_rank': item['price_rank'],
            'item_stock': 1 if item['in_stock'] else 0,

            # 向量检索分数
            'vector_score': item.get('vector_score', 0),

            # 上下文特征
            'time_of_day': context['hour'],
            'day_of_week': context['day'],
            'is_weekend': context['is_weekend'],
            'session_length': context['session_items'],

            # 历史特征
            'item_viewed_before': 1 if item['id'] in user['history'] else 0,
            'item_purchased_before': 1 if item['id'] in user['purchases'] else 0,
        }
        features.append(feat)

    return features

def rerank_items(user, candidates, context, model):
    """使用模型重排序候选列表"""
    features = build_rerank_features(user, candidates, context)
    features_df = pd.DataFrame(features)

    # LGBM 预测 CTR
    ctr_scores = model.predict(features_df)

    # 排序
    candidates['rerank_score'] = ctr_scores
    ranked = candidates.sort_values('rerank_score', ascending=False)

    return ranked.head(50)  # Top 50 推荐
```

### 5. 用户意图识别

```python
from transformers import pipeline

# 意图分类
intent_classifier = pipeline(
    "text-classification",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

INTENT_LABELS = {
    0: 'browse',        # 浏览/随便看看
    1: 'search',         # 主动搜索
    2: 'compare',       # 对比商品
    3: 'purchase',      # 购买意图
    4: 'inquiry',       # 咨询（材质/尺码/配送）
    5: 'complaint',      # 投诉/售后
}

def classify_user_intent(user_message):
    """识别用户对话意图"""
    result = intent_classifier(user_message)
    intent_id = result[0]['label']
    confidence = result[0]['score']

    return {
        'intent': INTENT_LABELS[intent_id],
        'confidence': confidence,
        'raw_result': result
    }

# 根据意图选择推荐策略
def recommend_by_intent(user, intent, context):
    """根据意图调整推荐策略"""
    if intent == 'browse':
        # 浏览意图：多样化推荐，探索性强
        return diversify_recommendation(user, exploration_rate=0.7)
    elif intent == 'search':
        # 搜索意图：精确匹配搜索结果
        return search_result_rerank(context['search_results'], user)
    elif intent == 'compare':
        # 对比意图：返回对比商品
        return get_comparison_items(context['mentioned_items'])
    elif intent == 'purchase':
        # 购买意图：推荐高转化、高评分
        return conversion_focused_recommendation(user)
    elif intent == 'inquiry':
        # 咨询意图：提供详细商品信息
        return detailed_item_info(context['item_id'])
    elif intent == 'complaint':
        # 投诉意图：转接人工客服
        return transfer_to_human_service(user)
```

## 电商场景特定策略

### 穿搭推荐

```python
def outfit_recommendation(user, history, product_catalog):
    """穿搭组合推荐：上下装+下装+配饰"""

    # 1. 获取用户最近购买的品类
    recent_categories = [
        h['category'] for h in history[-20:]
        if h['action'] == 'purchase'
    ]
    top_category = max(set(recent_categories), key=recent_categories.count)

    # 2. 按穿搭规则组合
    outfits = []

    # 上装
    tops = [p for p in product_catalog if p['category'] in ['T恤', '衬衫', '卫衣']]

    # 下装
    bottoms = [p for p in product_catalog if p['category'] in ['牛仔裤', '休闲裤', '半身裙']]

    # 配饰
    accessories = [p for p in product_catalog if p['category'] in ['包包', '鞋子', '帽子']]

    # 风格一致性：同品牌/同色系/同风格
    for style in ['休闲', '商务', '运动', '复古']:
        style_tops = [t for t in tops if t['style'] == style]
        style_bottoms = [b for b in bottoms if b['style'] == style]

        for top, bottom in zip(style_tops[:5], style_bottoms[:5]):
            # 推荐搭配
            outfits.append({
                'main_items': [top, bottom],
                'accessories': accessories[:2],
                'reason': f'搭配推荐 - {style}风格',
                'match_score': calculate_style_match(top, bottom)
            })

    return outfits[:10]  # Top 10 套装
```

### 个性化推荐

```python
def personalized_recommendation(user):
    """基于用户画像的个性化推荐"""

    profile = get_user_profile(user['id'])

    # 用户维度
    recommendations = []

    # 价格敏感度
    if profile['price_sensitivity'] == 'low':
        # 推荐高价位商品
        recommendations.extend(get_products_in_range(500, 2000))
    else:
        # 推荐性价比商品
        recommendations.extend(get_products_in_range(50, 300))

    # 品牌偏好
    preferred_brands = profile['preferred_brands']
    recommendations.extend(
        get_products_by_brands(preferred_brands)
    )

    # 尺码偏好
    recommended_sizes = profile['preferred_sizes']
    for item in recommendations:
        if item['size'] not in recommended_sizes:
            recommendations.remove(item)

    # 风格标签
    style_tags = profile['style_tags']  # ['韩系', '日系', '欧美']
    for item in recommendations:
        if any(tag in item['tags'] for tag in style_tags):
            item['boost_score'] = item.get('boost_score', 0) + 0.5

    return sorted(recommendations, key=lambda x: x['boost_score'], reverse=True)[:50]
```

## 性能指标

| 指标 | 公式 | 目标值 |
|------|------|--------|
| Recall@K | 召回商品数/K | ≥ 0.3 |
| Precision@K | 命中商品数/K | ≥ 0.15 |
| CTR | 点击数/曝光数 | ≥ 0.05 |
| CVR | 下单数/点击数 | ≥ 0.02 |
| GMV | 订单总金额 | 持续增长 |
| Diversity | 1 - 商品重复率 | ≥ 0.7 |

## 技术栈建议

| 场景 | 向量库 | 召回 | 排序 | 实时特征 |
|------|----------|------|------|----------|
| 小型电商 | FAISS | 向量+CF | XGBoost | Redis |
| 中型电商 | Milvus | 多路召回 | LightGBM | Redis |
| 大型电商 | Qdrant | 多路+图 | DeepFM | Redis+Kafka |

## References

- [Deep Interest Network for Recommendation](https://arxiv.org/abs/2005.13372)
- [Wide & Deep Learning for Recommender Systems](https://arxiv.org/abs/1606.07792)
- [Session-based Recommendation](https://arxiv.org/abs/2106.06839)

## Maintenance

- 创建日期: 2026-01-24
- 来源: 基于电商推荐最佳实践 + Twitter 推荐算法思路改造
