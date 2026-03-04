# 数据库设计规范

## 概述

本文档定义 CLAUDE-STUDIO 项目的数据库设计标准和最佳实践。

---

## 设计原则

### 1. 规范化 vs 性能

- **OLTP 系统**: 优先规范化（3NF）
- **OLAP 系统**: 可以适度反规范化
- **读写比例高**: 考虑反规范化

### 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 表名 | snake_case，复数 | `users`, `order_items` |
| 列名 | snake_case | `user_name`, `created_at` |
| 主键 | `id` | `id`, `user_id` |
| 外键 | `{table}_id` | `user_id`, `order_id` |
| 索引 | `idx_{table}_{columns}` | `idx_users_email` |
| 唯一约束 | `uk_{table}_{columns}` | `uk_users_email` |

### 3. 数据类型选择

```sql
-- 字符串
VARCHAR(255)    -- 短文本
TEXT            -- 长文本
CHAR(10)        -- 固定长度

-- 数字
INT             -- 整数 (-2B ~ 2B)
BIGINT          -- 大整数
DECIMAL(10,2)   -- 精确小数
FLOAT           -- 浮点数

-- 日期时间
TIMESTAMP       -- 带时区
DATE            -- 日期
TIME            -- 时间

-- 布尔
BOOLEAN         -- true/false

-- UUID
UUID            -- 分布式ID
```

---

## 表设计标准

### 1. 必须字段

```sql
CREATE TABLE users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP   -- 软删除
);
```

### 2. 审计字段

```sql
-- 需要记录创建/更新人
created_by  UUID    REFERENCES users(id),
updated_by  UUID    REFERENCES users(id),
```

### 3. 软删除

```sql
-- 使用 deleted_at 而非 is_deleted
deleted_at  TIMESTAMP   NULL,
-- 查询时自动过滤
WHERE deleted_at IS NULL;
```

---

## 索引设计

### 1. 索引选择

| 场景 | 索引类型 |
|------|----------|
| 唯一值 | UNIQUE INDEX |
| 频繁查询 | B-tree INDEX |
| 全文搜索 | FULLTEXT INDEX |
| 地理数据 | GIST INDEX |

### 2. 复合索引

```sql
-- 索引列顺序：选择性高的在前
CREATE INDEX idx_orders_user_status
ON orders (user_id, status);

-- 覆盖索引
CREATE INDEX idx_users_email
ON users (email)
INCLUDE (name, avatar);
```

### 3. 索引原则

- ✅ WHERE 子句中的列
- ✅ JOIN 条件的列
- ✅ ORDER BY 子句中的列
- ❌ 频繁更新的列
- ❌ 低选择性的列

---

## 关系设计

### 1. 一对多

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    total DECIMAL(10,2)
);
```

### 2. 多对多

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY
);

CREATE TABLE roles (
    id UUID PRIMARY KEY
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

### 3. 一对一

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    avatar_url VARCHAR(500)
);
```

---

## 约束设计

### 1. 主键

```sql
-- 优先使用 UUID
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- 业务主键（需要唯一性）
UNIQUE (email)
UNIQUE (username)
```

### 2. 外键

```sql
-- 强制外键
FOREIGN KEY (user_id) REFERENCES users(id)

-- 软外键（级联删除）
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- 阻止删除
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
```

### 3. 检查约束

```sql
-- 数值范围
CHECK (age >= 0 AND age < 150)

-- 枚举值
CHECK (status IN ('active', 'inactive', 'pending'))

-- 正数
CHECK (quantity > 0)
```

---

## 性能优化

### 1. 分页

```sql
-- 游标分页（推荐）
SELECT * FROM orders
WHERE id > :last_id
ORDER BY id
LIMIT 20;

-- 偏移分页（大数据量慢）
SELECT * FROM orders
ORDER BY id
LIMIT 20 OFFSET 1000;
```

### 2. 预聚合

```sql
-- 物化视图
CREATE MATERIALIZED VIEW order_stats AS
SELECT
    date_trunc('day', created_at) as day,
    COUNT(*) as order_count,
    SUM(total) as total_amount
FROM orders
GROUP BY date_trunc('day', created_at);
```

### 3. 分区

```sql
-- 按时间分区
CREATE TABLE orders (
    id UUID,
    created_at TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2026 PARTITION OF orders
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

---

## 迁移规范

### 1. 迁移文件

```sql
-- migrations/001_create_users.sql
-- 创建时间: 2026-03-01
-- 描述: 创建用户表

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 回滚
DROP TABLE users;
```

### 2. 迁移原则

- ⚠️ 不要修改已存在的列
- ✅ 只添加新列/表
- ✅ 使用 IF NOT EXISTS
- ⚠️ 大数据量迁移需要停机窗口

---

## 反模式

### 1. EAV（Entity-Attribute-Value）

```sql
-- ❌ 反模式
CREATE TABLE product_attributes (
    product_id UUID,
    attribute_name VARCHAR(50),
    attribute_value VARCHAR(255)
);

-- ✅ 推荐
CREATE TABLE product_attributes (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    color VARCHAR(50),
    size VARCHAR(20),
    weight DECIMAL(10,2)
);
```

### 2. 混用日期时间

```sql
-- ❌ 混用
created_at TIMESTAMP,
created_date DATE,

-- ✅ 统一
created_at TIMESTAMP WITH TIME ZONE,
```

### 3. 存储 JSON

```sql
-- ✅ 适合 JSON
metadata JSONB    -- 可索引的 JSON

-- ❌ 不适合 JSON
user_data JSON    -- 需要频繁查询字段
```

---

## 安全考虑

### 1. 敏感数据

```sql
-- ✅ 加密存储
password_hash VARCHAR(255)
sensitive_data BYTEA

-- ❌ 明文存储
password VARCHAR(255)
```

### 2. 行级安全

```sql
-- 只读自己的数据
CREATE POLICY user_isolation ON orders
    FOR SELECT USING (user_id = auth.uid());
```

### 3. SQL 注入防护

```sql
-- ✅ 参数化查询
INSERT INTO users (email) VALUES ($1);

-- ❌ 字符串拼接
INSERT INTO users (email) VALUES ('" + email + "');
```
