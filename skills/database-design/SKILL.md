---
name: database-design
description: 数据库设计技能。关系型数据库设计、表结构、索引优化。
tags: [database, sql, postgresql, mysql]
---

# 数据库设计技能

## When to Use This Skill

- 设计数据库表结构时
- 优化数据库性能时
- 数据迁移时
- 需要 ER 图设计时

## Quick Reference

### 设计原则

| 原则 | 说明 |
|------|------|
| 第三范式 | 消除冗余，确保数据一致性 |
| 适当反范式 | 为性能考虑，适度冗余 |
| 索引策略 | 常查询字段建立索引 |
| 分区策略 | 大表考虑分区 |
| 备份策略 | 定期备份，灾难恢复 |

### 命名规范

| 对象 | 规范 | 示例 |
|------|------|------|
| 表名 | snake_case, 复数 | `users`, `orders`, `order_items` |
| 列名 | snake_case | `user_id`, `created_at`, `is_active` |
| 主键 | `id` 或 `表名_id` | `id`, `order_id` |
| 外键 | `关联表_id` | `user_id`, `product_id` |
| 时间戳 | `created_at`, `updated_at` | `created_at`, `updated_at` |
| 布尔值 | `is_` 前缀 | `is_active`, `is_deleted` |

### 常用数据类型

| 类型 | 用途 | PostgreSQL | MySQL |
|------|------|-----------|-------|
| 主键 | 唯一标识 | `UUID`, `BIGSERIAL` | `UUID`, `BIGINT AUTO_INCREMENT` |
| 外键 | 关联引用 | `UUID`, `BIGINT` | `BIGINT` |
| 字符串 | 短文本 | `VARCHAR(n)` | `VARCHAR(n)` |
| 长文本 | 长文本 | `TEXT` | `TEXT` |
| 整数 | 数字 | `SMALLINT`, `INT`, `BIGINT` | `TINYINT`, `INT`, `BIGINT` |
| 小数 | 金额、精度 | `DECIMAL(19,2)` | `DECIMAL(19,2)` |
| 布尔 | 是/否 | `BOOLEAN` | `TINYINT(1)` |
| 时间 | 日期时间 | `TIMESTAMP`, `DATE` | `DATETIME`, `DATE` |
| JSON | 结构化数据 | `JSONB` | `JSON` |

### 表设计示例

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- 订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(19,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 订单商品表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_at_order DECIMAL(19,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### ER 图示例

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  User    │  1   n  │  Order   │  n   1  │ Product  │
├──────────┼─────────┼──────────┼─────────┼──────────┤
│ id       │         │ id       │         │ id       │
│ email    │         │ user_id  │         │ name     │
│ password │         │ status   │         │ price    │
│ ...      │         │ total    │         │ ...      │
└──────────┘         │ ...      │         └──────────┘
                     │
                     │ 1
                     │
                     │ n
              ┌──────────┐
              │OrderItem │
              ├──────────┤
              │ id       │
              │ order_id │
              │ product_id│
              │ quantity │
              │ price    │
              └──────────┘
```

### 数据库连接池配置

```typescript
// PostgreSQL 连接池
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: 2,      // 最小连接数
  max: 10,     // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 使用
async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 迁移脚本

```sql
-- V1__Create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- V2__Create_orders_table.sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(19,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V3__Add_updated_at.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

## Examples

### Example 1: 电商数据库设计

```sql
-- 商品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(19,2) NOT NULL CHECK (price >= 0),
  stock INT DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 购物车表
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);
```

### Example 2: 审计日志

```sql
-- 审计日志表
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 触发器
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_at)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), NOW());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), NOW());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

## References

- 数据库设计最佳实践: https://www.databasejournal.com/
- PostgreSQL 文档: https://www.postgresql.org/docs/

## Maintenance

- 来源：结合两个项目的数据库设计经验
- 最后更新：2026-01-24
