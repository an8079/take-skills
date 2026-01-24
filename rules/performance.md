# 性能规则

确保代码性能良好，提供流畅的用户体验。

## 模型选择

根据任务复杂度选择合适的模型：

| 任务类型 | 推荐模型 | 说明 |
|----------|-----------|------|
| 简单任务 | haiku | 快速、经济 |
| 中等任务 | sonnet | 平衡质量和速度 |
| 复杂任务 | opus | 最高质量 |
| 代码审查 | opus | 需要深度分析 |

## 代码性能

### 算法复杂度

- 优先使用低复杂度算法
- 避免嵌套循环

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

### 数据库查询优化

- 使用索引
- 避免 N+1 查询
- 使用分页

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

// ✅ 使用 include 或 eager loading
async function getUserOrders(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { orders: true }
  });
  return user.orders;
}

// ✅ 使用分页
async function getOrders(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return await db.order.findMany({
    skip,
    take: limit
  });
}
```

### 缓存策略

- 缓存频繁访问的数据
- 设置合理的过期时间

```typescript
import Redis from 'ioredis';

const redis = new Redis();

export async function getUser(userId: string): Promise<User> {
  // 先从缓存获取
  const cached = await redis.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 缓存未命中，从数据库获取
  const user = await userRepository.findById(userId);

  // 写入缓存，过期时间 1 小时
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

  return user;
}
```

## 前端性能

### 代码分割

```typescript
// ✅ 懒加载组件
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// ✅ 动态导入
const module = await import('./module');
```

### 图片优化

```html
<!-- ✅ 使用现代图片格式 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" loading="lazy" alt="Description">
</picture>
```

### React 性能优化

```typescript
// ✅ 使用 useMemo 缓存计算结果
const filteredItems = useMemo(
  () => items.filter(item => item.active),
  [items]
);

// ✅ 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  // 处理点击
}, [dependency]);

// ✅ 使用 React.memo 防止不必要重渲染
const ExpensiveComponent = React.memo(({ data }) => {
  // 组件实现
});
```

## API 性能

### 响应时间目标

| 端点类型 | 目标响应时间 |
|----------|-------------|
| 简单查询 | < 50ms |
| 复杂查询 | < 200ms |
| 写操作 | < 500ms |
| 批量操作 | < 2s |

### 分页

```typescript
// ✅ 总是使用分页
app.get('/api/orders', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    orderRepository.findAll({ limit: Number(limit), offset }),
    orderRepository.count()
  ]);

  return res.json({
    data: orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});
```

### 压缩响应

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // 只压缩大于 1KB 的响应
}));
```

## 监控指标

### 关键指标

| 指标 | 目标 | 说明 |
|------|------|------|
| API 响应时间 | < 200ms (P95) | 95% 的请求 |
| 数据库查询时间 | < 50ms (P95) | 95% 的查询 |
| 错误率 | < 0.1% | 错误请求占比 |
| 内存使用 | < 80% | 峰值内存占比 |
| CPU 使用 | < 70% | 平均 CPU 占比 |

### 性能监控

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
      duration
    });
  });

  next();
});
```

## 性能检查清单

- [ ] 数据库查询有索引
- [ ] 避免 N+1 查询
- [ ] 使用分页
- [ ] 实现缓存策略
- [ ] API 响应时间达标
- [ ] 前端代码已分割
- [ ] 图片已优化
- [ ] 使用压缩
- [ ] 监控已配置

---

**记住：** 性能优化不是过度优化。先让代码正确，再通过监控发现问题后针对性优化。
