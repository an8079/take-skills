---
name: user-profiling
description: "用户画像建模技能：行为分析、兴趣标签、特征工程、分群、生命周期分析。用于电商推荐、内容推荐、精准营销等场景。"
tags: [user-profiling, behavior-analysis, interest-tagging, clustering, lifecycle]
---

# 用户画像建模技能

## When to Use This Skill

触发此技能当：
- 构建用户画像系统
- 分析用户行为数据（点击/浏览/购买/收藏）
- 提取用户兴趣标签
- 用户分群与精细化运营
- 计算用户生命周期价值（RFM）
- 做个性化推荐或营销

## Not For / Boundaries

此技能不适用于：
- 简单的 ID 分配
- 用户信息查询（非画像构建）
- 实时画像更新（可用部分功能）

## Quick Reference

### 用户画像维度

```
┌─────────────────────────────────────────────┐
│             用户画像体系             │
├─────────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────────┐  │
│  │        行为特征层           │  │
│  │  点击/浏览/购买/搜索/收藏     │  │
│  └──────────────────────────────────────┘  │
│                 │                       │
│  ┌──────────────────────────────────────┐  │
│  │        兴趣偏好层           │  │
│  │  类目/品牌/风格/价格敏感度       │  │
│  └──────────────────────────────────────┘  │
│                 │                       │
│  ┌──────────────────────────────────────┐  │
│  │        用户分群层           │  │
│  │  高价值/潜在/流失/新用户        │  │
│  └──────────────────────────────────────┘  │
│                 │                       │
│  ┌──────────────────────────────────────┐  │
│  │        价值模型（RFM）         │  │
│  │  最近度/频次/金额（LTV）       │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 核心组件

### 1. 行为特征提取

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class BehaviorExtractor:
    """用户行为特征提取"""

    @staticmethod
    def extract_features(user_events):
        """
        从事件流中提取行为特征

        Events 格式: [
            {'user_id': 123, 'event_type': 'click', 'item_id': 'A001', 'timestamp': ...},
            ...
        ]
        """
        df = pd.DataFrame(user_events)

        # 基础统计
        features = {
            # 活跃度
            'total_events': len(df),
            'active_days': df['timestamp'].dt.date.nunique(),
            'avg_daily_events': len(df) / max(df['timestamp'].dt.date.nunique(), 1),

            # 行为分布
            'click_count': len(df[df['event_type'] == 'click']),
            'view_count': len(df[df['event_type'] == 'view']),
            'cart_count': len(df[df['event_type'] == 'cart']),
            'purchase_count': len(df[df['event_type'] == 'purchase']),
            'fav_count': len(df[df['event_type'] == 'favorite']),

            # 最近行为（近7天/30天）
            'click_7d': len(df[df['event_type'] == 'click'] &
                           (df['timestamp'] > df['timestamp'].max() - timedelta(days=7))]),
            'purchase_7d': len(df[df['event_type'] == 'purchase'] &
                             (df['timestamp'] > df['timestamp'].max() - timedelta(days=7))]),
            'click_30d': len(df[df['event_type'] == 'click'] &
                            (df['timestamp'] > df['timestamp'].max() - timedelta(days=30))]),
            'purchase_30d': len(df[df['event_type'] == 'purchase'] &
                             (df['timestamp'] > df['timestamp'].max() - timedelta(days=30))]),

            # 时间特征
            'last_activity': df['timestamp'].max(),
            'days_since_last': (datetime.now() - df['timestamp'].max()).days,

            # 转化相关
            'click_to_purchase_rate': calculate_conversion_rate(df),
            'avg_session_length': calculate_session_length(df),
        }

        return features

    @staticmethod
    def calculate_conversion_rate(df):
        """计算点击到购买转化率"""
        purchases = len(df[df['event_type'] == 'purchase'])
        clicks = len(df[df['event_type'] == 'click'])
        return purchases / clicks if clicks > 0 else 0

    @staticmethod
    def calculate_session_length(df):
        """计算平均会话长度（30分钟无操作算新会话）"""
        if df.empty:
            return 0

        df = df.sort_values('timestamp')
        sessions = []
        session_start = df.iloc[0]['timestamp']

        for _, row in df.iterrows():
            if (row['timestamp'] - session_start).total_seconds() / 60 > 30:
                sessions.append(session_start)
                session_start = row['timestamp']
            else:
                session_start = row['timestamp']

        sessions.append(session_start)
        return len(sessions)
```

### 2. 兴趣标签提取

```python
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

class InterestExtractor:
    """用户兴趣标签提取"""

    def __init__(self, n_clusters=20):
        self.vectorizer = TfidfVectorizer(max_features=500)
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)

    def fit_extract(self, user_browsing_history):
        """从浏览历史中提取兴趣标签"""

        # 提取文本特征
        texts = [
            self._extract_text_features(h) for h in user_browsing_history
        ]

        # TF-IDF 向量化
        tfidf_matrix = self.vectorizer.fit_transform(texts)

        # K-means 聚类
        self.kmeans.fit(tfidf_matrix)

        # 获取每个聚类的关键词
        feature_names = self.vectorizer.get_feature_names_out()
        centers = self.kmeans.cluster_centers_

        # 提取每个聚类的代表词
        interests = []
        for i, center in enumerate(centers):
            # 获取该聚类最显著的词
            top_indices = np.argsort(center)[-10:][::-1]  # Top 10 词
            top_words = [feature_names[idx] for idx in top_indices]

            interests.append({
                'cluster_id': i,
                'keywords': top_words,
                'label': self._generate_label(top_words),
            })

        return interests

    def _extract_text_features(self, history_item):
        """从历史记录提取文本特征"""
        parts = []
        if history_item.get('title'):
            parts.append(history_item['title'])
        if history_item.get('category'):
            parts.append(history_item['category'])
        if history_item.get('tags'):
            parts.extend(history_item['tags'])
        return ' '.join(parts)

    def _generate_label(self, keywords):
        """根据关键词生成标签名"""
        # 简单规则：取出现频率最高的词
        if not keywords:
            return '其他'
        return keywords[0]

    def assign_user_interests(self, user_id, browsing_history):
        """为用户分配兴趣标签"""
        interests = self.fit_extract(browsing_history)

        # 对每个用户计算兴趣分布
        user_features = self._compute_user_vector(browsing_history)
        user_cluster = self.kmeans.predict([user_features])[0]

        return {
            'user_id': user_id,
            'interests': interests[user_cluster]['keywords'],
            'interest_label': interests[user_cluster]['label'],
            'confidence': self._compute_confidence(user_features, user_cluster),
        }

    def _compute_user_vector(self, browsing_history):
        """计算用户的兴趣向量"""
        # 使用每个商品的特征
        text = self._extract_text_features(browsing_history)
        return self.vectorizer.transform([text])[0]
```

### 3. 用户分群（RFM 模型）

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class RFMAnalyzer:
    """RFM 用户价值分析模型"""

    @staticmethod
    def calculate_rfm(user_data, snapshot_date=None):
        """
        计算 RFM 得分

        R - Recency: 最近一次购买距今天数
        F - Frequency: 购买频次
        M - Monetary: 消费总金额
        """
        if snapshot_date is None:
            snapshot_date = datetime.now()

        df = pd.DataFrame(user_data)

        # 按用户聚合
        rfm = df.groupby('user_id').agg({
            'last_purchase_date': ('purchase_date', 'max'),
            'purchase_count': ('purchase_id', 'count'),
            'total_amount': ('amount', 'sum'),
        }).reset_index()

        # 计算 R（最近度）
        rfm['recency'] = rfm['last_purchase_date'].apply(
            lambda x: (snapshot_date - x).days
        )

        # 计算 F（频次）
        rfm['frequency'] = rfm['purchase_count']

        # 计算 M（金额）
        rfm['monetary'] = rfm['total_amount']

        # 评分（3-5分制，分越高越好）
        rfm['r_score'] = pd.qcut(rfm['recency'], q=5, labels=[5, 4, 3, 2, 1], duplicates='drop')
        rfm['f_score'] = pd.qcut(rfm['frequency'], q=5, labels=[1, 2, 3, 4, 5], duplicates='drop')
        rfm['m_score'] = pd.qcut(rfm['monetary'], q=5, labels=[1, 2, 3, 4, 5], duplicates='drop')

        # 合成 RFM 得分
        rfm['rfm_score'] = (
            rfm['r_score'].astype(int).astype(str) +
            rfm['f_score'].astype(int).astype(str) +
            rfm['m_score'].astype(int).astype(str)
        )

        # 用户分群
        def assign_segment(score):
            """根据 RFM 得分分配用户分群"""
            if score in ['555', '554', '545', '544', '445', '355', '344', '345']:
                return '高价值核心用户'
            elif score in ['553', '543', '533', '433', '335', '325', '324']:
                return '高价值成长用户'
            elif score in ['552', '542', '532', '432', '325', '315', '314']:
                return '普通价值用户'
            elif score in ['551', '541', '531', '421', '323', '313']:
                return '潜力发展用户'
            else:
                return '低价值/流失用户'

        rfm['segment'] = rfm['rfm_score'].apply(assign_segment)

        return rfm

    @staticmethod
    def calculate_ltv(rfm_df, time_horizon_days=365):
        """
        计算用户生命周期价值（LTV）

        简化公式：LTV = ARPU × 留存率 × 时间跨度
        """
        rfm_df['arpu'] = rfm_df['total_amount'] / rfm_df['purchase_count']

        # 假设留存率（实际应从历史数据计算）
        # 高价值用户留存率 0.9，普通 0.7，低价值 0.5
        rfm_df['retention_rate'] = rfm_df['segment'].map({
            '高价值核心用户': 0.9,
            '高价值成长用户': 0.8,
            '普通价值用户': 0.7,
            '潜力发展用户': 0.6,
            '低价值/流失用户': 0.5,
        })

        rfm_df['ltv_365'] = (
            rfm_df['arpu'] *
            rfm_df['retention_rate'] *
            time_horizon_days
        )

        return rfm_df[['user_id', 'segment', 'ltv_365', 'arpu']]
```

### 4. 用户画像更新策略

```python
from datetime import datetime

class UserProfileUpdater:
    """用户画像实时更新"""

    def __init__(self):
        self.user_profiles = {}  # 缓存

    def update_profile(self, event):
        """事件触发更新"""
        user_id = event['user_id']

        if user_id not in self.user_profiles:
            self._init_profile(user_id)

        profile = self.user_profiles[user_id]

        # 实时更新行为统计
        self._update_behavior_stats(profile, event)

        # 周期性重算兴趣标签
        if self._should_recalculate_interests(profile):
            self._recalculate_interests(profile)

    def _init_profile(self, user_id):
        """初始化用户画像"""
        self.user_profiles[user_id] = {
            'user_id': user_id,
            'created_at': datetime.now(),
            'interests': [],
            'behavior_stats': {},
            'rfm_scores': {},
            'segment': '新用户',
        }

    def _update_behavior_stats(self, profile, event):
        """更新行为统计"""
        stats = profile['behavior_stats']

        stats['total_events'] = stats.get('total_events', 0) + 1
        stats['last_event'] = event['timestamp']

        # 按类型统计
        event_type = event['event_type']
        stats[f'{event_type}_count'] = stats.get(f'{event_type}_count', 0) + 1

        # 滑动窗口统计（近7/30/90天）
        for window in [7, 30, 90]:
            window_events = self._get_window_events(profile, window)
            stats[f'{event_type}_{window}d'] = len(window_events)

    def _get_window_events(self, profile, days):
        """获取指定天数内的事件"""
        if 'events' not in profile:
            return []
        cutoff = datetime.now() - timedelta(days=days)
        return [e for e in profile['events'] if e['timestamp'] >= cutoff]

    def _should_recalculate_interests(self, profile):
        """判断是否需要重新计算兴趣标签"""
        # 条件：最近有新交互，且距离上次重算超过 7 天
        last_recalc = profile.get('last_interest_recalc')

        if last_recalc is None:
            return True

        days_since_recalc = (datetime.now() - last_recalc).days
        new_events_count = profile['behavior_stats'].get('total_events', 0)

        # 触发条件：超过 7 天且新增事件超过 10 个
        return days_since_recalc > 7 and new_events_count > 10
```

## Examples

### Example 1: 电商用户兴趣提取

**场景：** 根据用户浏览历史提取兴趣标签

**实现：**
```python
# 用户浏览历史
browsing_history = [
    {'title': '韩系连衣裙 夏季新款', 'category': '女装', 'tags': ['韩系', '连衣裙']},
    {'title': '复古牛仔短裤 修身款', 'category': '女装', 'tags': ['复古', '牛仔裤']},
    {'title': '运动跑鞋 透气轻便', 'category': '鞋靴', 'tags': ['运动', '跑鞋']},
    {'title': '商务衬衫 纯色修身', 'category': '男装', 'tags': ['商务', '衬衫']},
]

# 提取兴趣
extractor = InterestExtractor(n_clusters=20)
interests = extractor.fit_extract(browsing_history)

# 结果
for interest in interests:
    print(f"聚类 {interest['cluster_id']}: {interest['label']}")
    print(f"  关键词: {interest['keywords']}")
```

**预期输出：**
```
聚类 0: 韩系女装
  关键词: ['韩系', '连衣裙', '女装', '夏季', '新款']
聚类 1: 休闲牛仔
  关键词: ['复古', '牛仔裤', '短裤', '修身']
...
```

### Example 2: RFM 用户价值分析

**场景：** 对用户进行价值分层和运营策略制定

**实现：**
```python
# 购买数据
purchase_data = [
    {'user_id': 1, 'purchase_date': '2026-01-20', 'purchase_id': 'A001', 'amount': 299},
    {'user_id': 1, 'purchase_date': '2026-01-18', 'purchase_id': 'A002', 'amount': 599},
    {'user_id': 1, 'purchase_date': '2026-01-15', 'purchase_id': 'A003', 'amount': 199},
    # ... 其他用户数据
]

# 计算 RFM
analyzer = RFMAnalyzer()
rfm_df = analyzer.calculate_rfm(purchase_data, snapshot_date=datetime(2026, 1, 24))

# 分群结果
print(rfm_df[['user_id', 'segment', 'rfm_score']])

# 计算运营策略
def generate_segment_strategy(segment):
    """为每个分群生成运营策略"""
    strategies = {
        '高价值核心用户': {
            'priority': '最高',
            'action': '专属客服、优先发货、积分加倍',
            'marketing': '限量新品抢先购、VIP 专属活动',
        },
        '高价值成长用户': {
            'priority': '高',
            'action': '推荐高客单价商品、关联推荐',
            'marketing': '个性化推荐、购物节提醒',
        },
        '普通价值用户': {
            'priority': '中',
            'action': '常规推荐、优惠券刺激',
            'marketing': '大促活动、限时折扣',
        },
        '潜力发展用户': {
            'priority': '低',
            'action': '新人礼包、首单优惠、引导转化',
            'marketing': '注册优惠券、满减活动',
        },
        '低价值/流失用户': {
            'priority': '最低',
            'action': '召回活动、降价促销、唤醒优惠',
            'marketing': '回归大礼包、清仓特价',
        },
    }
    return strategies[segment]
```

**预期输出：**
```
   user_id  segment  rfm_score   运营策略
0         高价值核心   555       专属客服、优先发货、积分加倍
1         高价值成长   554       推荐高客单价商品、关联推荐
2         普通价值   543       常规推荐、优惠券刺激
...
```

### Example 3: 实时画像更新

**场景：** 用户行为事件驱动实时画像更新

**实现：**
```python
updater = UserProfileUpdater()

# 模拟事件流
events = [
    {'user_id': 123, 'event_type': 'view', 'item_id': 'P001', 'timestamp': datetime.now()},
    {'user_id': 123, 'event_type': 'click', 'item_id': 'P002', 'timestamp': datetime.now()},
    {'user_id': 123, 'event_type': 'cart', 'item_id': 'P003', 'timestamp': datetime.now()},
]

# 处理事件
for event in events:
    updater.update_profile(event)
    # 实时更新统计和兴趣标签

# 获取最新画像
profile = updater.user_profiles[123]
print(f"用户兴趣: {profile['interests']}")
print(f"行为统计: {profile['behavior_stats']}")
```

## 画像存储设计

### 存储方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Redis** | 极快，支持实时更新 | 内存成本高 | 实时画像更新 |
| **MongoDB** | 灵活 Schema，可存复杂结构 | 读性能一般 | 复杂画像结构 |
| **ClickHouse** | 列存性能好，支持分析查询 | 更新延迟较高 | 大规模分析查询 |
| **Elasticsearch** | 支持全文搜索，分析方便 | 写性能一般 | 搜索 + 分析 |

### 画像数据结构

```json
{
  "user_id": "123456",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-24T12:30:00Z",

  "demographics": {
    "age": 28,
    "gender": "female",
    "city": "上海",
    "level": "VIP2"
  },

  "interests": [
    {"tag": "韩系女装", "score": 0.95, "updated_at": "..."},
    {"tag": "运动休闲", "score": 0.82, "updated_at": "..."},
    {"tag": "数码科技", "score": 0.65, "updated_at": "..."}
  ],

  "behavior_stats": {
    "total_events": 1523,
    "last_active": "2026-01-24T10:15:00Z",
    "click_7d": 45,
    "purchase_30d": 3,
    "favorite_categories": ["女装", "鞋靴"]
  },

  "rfm": {
    "r_score": 4,
    "f_score": 5,
    "m_score": 4,
    "rfm_score": "454",
    "segment": "高价值成长用户",
    "ltv_365": 3299.50
  },

  "recommendation_blacklist": [  # 推荐排除列表
    {"item_id": "B001", "reason": "已购买但退换"},
    {"item_id": "B005", "reason": "用户明确不感兴趣"}
  ]
}
```

## References

- [RFM Analysis](https://en.wikipedia.org/wiki/RFM_analysis)
- [User Segmentation](https://en.wikipedia.org/wiki/Market_segmentation)
- [User Profiling Best Practices](https://www.informatica.com/resources/data-warehouse/articles/what-is-user-profiling)

## Maintenance

- 来源：基于电商/推荐系统用户画像最佳实践
- 最后更新：2026-01-24
- 已知限制：
  - 需要足够的用户行为数据
  - 用户兴趣需要定期更新以保持准确性
