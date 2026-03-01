---
name: performance-tuning
description: 性能调优技能。高并发优化、数据库调优、缓存设计、向量检索优化。
tags: [performance, optimization, caching]
---

# 性能调优技能

## When to Use This Skill

- 性能优化时
- 高并发场景设计时
- 数据库调优时
- 需要优化响应时间时

## Quick Reference

### 性能优化层次

```
┌─────────────────────────────────────────┐
│         应用层优化                      │
│   (算法优化、代码优化、并行处理）           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         缓存层优化                      │
│   (内存缓存、CDN、本地缓存）             │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         数据库层优化                    │
│   (索引优化、查询优化、读写分离）           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         基础设施优化                    │
│   (负载均衡、服务器配置、网络优化）           │
└─────────────────────────────────────────┘
```

### 算法优化

```typescript
// ❌ O(n²) - 嵌套循环
function findDuplicates(arr: string[]): string[] {
  const duplicates: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

// ✅ O(n) - 使用 Set
function findDuplicates(arr: string[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.push(item);
    } else {
      seen.add(item);
    }
  }
  return duplicates;
}
```

### 数据库优化

#### 索引策略

```sql
-- 为常用查询条件添加索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status_created ON users(status, created_at DESC);

-- 复合索引（注意顺序）
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- 部分索引（只索引活跃用户）
CREATE INDEX idx_active_users ON users(id) WHERE is_active = true;
```

#### 查询优化

```typescript
// ❌ N+1 查询
async function getUserOrders(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  const orders = [];
  for (const orderId of user.orderIds) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    orders.push(order);
  }
  return orders;
}

// ✅ 使用 include 或 join
async function getUserOrders(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { orders: true }
  });
  return user.orders;
}
```

#### 分页优化

```typescript
// 使用游标分页（大数据量更高效）
async function getOrders(cursor?: string, limit = 20) {
  const where = cursor ? { id: { gt: cursor } } : {};
  const orders = await db.order.findMany({
    where,
    orderBy: { id: 'asc' },
    take: limit + 1, // 多取一个判断是否有下一页
  });

  const hasMore = orders.length > limit;
  const data = hasMore ? orders.slice(0, -1) : orders;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
}
```

### 缓存策略

#### Redis 缓存

```typescript
import Redis from 'ioredis';

const redis = new Redis();

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

class CachedRepository<T> {
  constructor(
    private repository: Repository<T>,
    private cache: Redis,
    private options: CacheOptions = {}
  ) {}

  async findById(id: string): Promise<T | null> {
    const cacheKey = `${this.options.keyPrefix || 'entity'}:${id}`;

    // 先从缓存获取
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 缓存未命中，从数据库获取
    const entity = await this.repository.findById(id);
    if (entity) {
      // 写入缓存
      await this.cache.setex(cacheKey, this.options.ttl || 3600, JSON.stringify(entity));
    }

    return entity;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const entity = await this.repository.update(id, data);
    // 更新后删除缓存
    const cacheKey = `${this.options.keyPrefix || 'entity'}:${id}`;
    await this.cache.del(cacheKey);
    return entity;
  }
}
```

#### 缓存失效策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| TTL | 过期时间自动失效 | 通用场景 |
| 主动失效 | 更新时删除 | 数据一致性要求高 |
| 写穿透 | 缓存空值防止穿透 | 防止大量请求穿透 |
| 写回显 | 延迟双写防止不一致 | 高并发写入 |

```typescript
// 写穿透防护
async function getUser(id: string): Promise<User | null> {
  const cacheKey = `user:${id}`;

  // 检查缓存
  const cached = await redis.get(cacheKey);
  if (cached !== null) {
    return cached === 'NULL' ? null : JSON.parse(cached);
  }

  // 从数据库获取
  const user = await userRepository.findById(id);

  // 缓存空值（使用特殊标记）
  await redis.setex(cacheKey, 300, user ? JSON.stringify(user) : 'NULL');

  return user;
}

// 延迟双写（防止脏数据）
async function updateUser(id: string, data: Partial<User>): Promise<User> {
  // 1. 先更新数据库
  const user = await userRepository.update(id, data);

  // 2. 延迟删除缓存（让其他请求读数据库）
  setTimeout(async () => {
    await redis.del(`user:${id}`);
  }, 100);

  return user;
}
```

### 并发优化

```typescript
// 使用 Promise.all 并行执行
async function getUserData(userId: string) {
  const [user, orders, payments] = await Promise.all([
    userRepository.findById(userId),
    orderRepository.findByUserId(userId),
    paymentRepository.findByUserId(userId)
  ]);

  return { user, orders, payments };
}

// 使用 worker_threads CPU 密集型任务
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) {
  // 主线程
  async function processLargeDataset(data: any[]) {
    const chunkSize = 100;
    const chunks = chunk(data, chunkSize);
    const workers = chunks.map(chunk => new Worker(__filename, { workerData: chunk }));

    const results = await Promise.all(
      workers.map(worker => new Promise(resolve => worker.on('message', resolve)))
    );

    return results.flat();
  }
} else {
  // Worker 线程
  const result = processData(workerData);
  parentPort.postMessage(result);
}
```

### 前端性能优化

```typescript
// 代码分割
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 使用 useMemo 缓存计算结果
const filteredItems = useMemo(
  () => items.filter(item => item.active),
  [items]
);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  onAction(item);
}, [item, onAction]);

// 使用 React.memo 防止不必要重渲染
const ExpensiveComponent = React.memo(({ data }) => {
  // 组件实现
});

// 图片懒加载
<img src={imageUrl} loading="lazy" alt="Description" />
```

### CDN 优化

```html
<!-- 使用 CDN 加载静态资源 -->
<link rel="stylesheet" href="https://cdn.example.com/styles.css">
<script src="https://cdn.example.com/app.js"></script>

<!-- 使用 CDN 加载字体 -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

## 性能监控

### 关键指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| API 响应时间 | < 200ms (P95) | 95% 的请求 |
| 数据库查询时间 | < 50ms (P95) | 95% 的查询 |
| 错误率 | < 0.1% | 错误请求占比 |
| 缓存命中率 | > 80% | 缓存有效的请求占比 |
| 内存使用 | < 80% | 峰值内存占比 |
| CPU 使用 | < 70% | 平均 CPU 占比 |

### 监控实现

```typescript
// 记录性能指标
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
    });
  });

  next();
});

// APM 集成 (如 New Relic, Datadog)
import * as newrelic from 'newrelic';

// 性能追踪
newrelic.startWebTransaction('custom transaction', () => {
  return asyncOperation();
});
```

## 性能检查清单

- [ ] 算法复杂度合理
- [ ] 数据库有适当索引
- [ ] 避免 N+1 查询
- [ ] 使用分页
- [ ] 实现缓存策略
- [ ] API 响应时间达标
- [ ] 前端代码已分割
- [ ] 图片已优化
- [ ] 使用 CDN
- [ ] 监控已配置

## References

- Google Web Fundamentals: https://web.dev/explore/performance
- MDN Performance: https://developer.mozilla.org/en-US/docs/Web/Performance

## Maintenance

- 来源：结合两个项目的性能优化经验
- 最后更新：2026-01-24
