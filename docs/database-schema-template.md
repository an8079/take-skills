# 数据库设计文档模板

> 版本：v1.0 | 日期：[日期] | 状态：草稿

---

## 1. 概述

### 1.1 文档目的

本文档描述 [项目名称] 的数据库设计，包括表结构、索引、关系等。

### 1.2 技术选型

| 项目 | 选型 |
|------|------|
| 数据库类型 | [PostgreSQL/MySQL/SQLite/MongoDB] |
| 版本 | [版本号] |
| 字符集 | UTF-8 |
| 时区 | UTC |

---

## 2. ER 图

### 2.1 实体关系图

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    用户     │         │    订单     │         │    商品     │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │1      *│ id (PK)     │*      *│ id (PK)     │
│ email       │         │ user_id (FK)│         │ name        │
│ name       │         │ status      │         │ price       │
│ created_at  │         │ total       │         │ stock       │
└─────────────┘         └─────────────┘         └─────────────┘
       │                     │
       │               *     │
       └─────────────────────┘
              │
              │ 1
              ▼
       ┌─────────────┐
       │    地址     │
       ├─────────────┤
       │ id (PK)     │
       │ user_id (FK)│
       │ province    │
       │ city        │
       │ address     │
       └─────────────┘
```

### 2.2 关系说明

| 实体1 | 关系 | 实体2 | 说明 |
|-------|------|-------|------|
| 用户 | 1:n | 订单 | 一个用户可以有多个订单 |
| 订单 | n:m | 商品 | 一个订单包含多个商品 |
| 用户 | 1:n | 地址 | 一个用户可以有多个地址 |

---

## 3. 表结构

### 3.1 users (用户表)

| 字段 | 类型 | 长度 | 可空 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| id | bigint | - | 否 | AUTO_INCREMENT | 主键 |
| email | varchar | 255 | 否 | - | 邮箱（唯一） |
| password_hash | varchar | 255 | 否 | - | 密码哈希 |
| name | varchar | 100 | 否 | - | 用户名 |
| avatar | varchar | 500 | 是 | NULL | 头像 URL |
| status | enum | - | 否 | 'active' | 状态：active/inactive/banned |
| created_at | timestamp | - | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | - | 否 | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引：**
```sql
PRIMARY KEY (id)
UNIQUE KEY uk_email (email)
KEY idx_status (status)
KEY idx_created_at (created_at)
```

**约束：**
- `email` 必须唯一
- `password_hash` 必须非空
- `status` 只能是 'active', 'inactive', 'banned'

---

### 3.2 orders (订单表)

| 字段 | 类型 | 长度 | 可空 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| id | bigint | - | 否 | AUTO_INCREMENT | 主键 |
| order_no | varchar | 32 | 否 | - | 订单号（唯一） |
| user_id | bigint | - | 否 | - | 用户 ID |
| status | enum | - | 否 | 'pending' | 状态 |
| total_amount | decimal | 10,2 | 否 | 0.00 | 订单总额 |
| paid_amount | decimal | 10,2 | 否 | 0.00 | 已付金额 |
| shipping_address_id | bigint | - | 是 | NULL | 收货地址 ID |
| paid_at | timestamp | - | 是 | NULL | 支付时间 |
| shipped_at | timestamp | - | 是 | NULL | 发货时间 |
| completed_at | timestamp | - | 是 | NULL | 完成时间 |
| created_at | timestamp | - | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | - | 否 | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引：**
```sql
PRIMARY KEY (id)
UNIQUE KEY uk_order_no (order_no)
KEY idx_user_id (user_id)
KEY idx_status (status)
KEY idx_created_at (created_at)
```

**外键：**
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL
```

---

### 3.3 order_items (订单明细表)

| 字段 | 类型 | 长度 | 可空 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| id | bigint | - | 否 | AUTO_INCREMENT | 主键 |
| order_id | bigint | - | 否 | - | 订单 ID |
| product_id | bigint | - | 否 | - | 商品 ID |
| quantity | int | - | 否 | 1 | 数量 |
| unit_price | decimal | 10,2 | 否 | 0.00 | 单价 |
| total_price | decimal | 10,2 | 否 | 0.00 | 小计 |
| created_at | timestamp | - | 否 | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
```sql
PRIMARY KEY (id)
KEY idx_order_id (order_id)
KEY idx_product_id (product_id)
```

**外键：**
```sql
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
FOREIGN KEY (product_id) REFERENCES products(id)
```

---

### 3.4 products (商品表)

| 字段 | 类型 | 长度 | 可空 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| id | bigint | - | 否 | AUTO_INCREMENT | 主键 |
| name | varchar | 200 | 否 | - | 商品名称 |
| description | text | - | 是 | NULL | 商品描述 |
| price | decimal | 10,2 | 否 | 0.00 | 价格 |
| stock | int | - | 否 | 0 | 库存 |
| category_id | bigint | - | 是 | NULL | 分类 ID |
| status | enum | - | 否 | 'active' | 状态 |
| created_at | timestamp | - | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | - | 否 | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引：**
```sql
PRIMARY KEY (id)
KEY idx_category_id (category_id)
KEY idx_status (status)
KEY idx_created_at (created_at)
```

**外键：**
```sql
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
```

---

### 3.5 addresses (地址表)

| 字段 | 类型 | 长度 | 可空 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| id | bigint | - | 否 | AUTO_INCREMENT | 主键 |
| user_id | bigint | - | 否 | - | 用户 ID |
| recipient_name | varchar | 100 | 否 | - | 收货人 |
| phone | varchar | 20 | 否 | - | 电话 |
| province | varchar | 50 | 否 | - | 省 |
| city | varchar | 50 | 否 | - | 市 |
| district | varchar | 50 | 是 | NULL | 区 |
| address | varchar | 500 | 否 | - | 详细地址 |
| is_default | boolean | - | 否 | FALSE | 是否默认 |
| created_at | timestamp | - | 否 | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
```sql
PRIMARY KEY (id)
KEY idx_user_id (user_id)
```

**外键：**
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

---

## 4. 视图

### 4.1 v_order_summary (订单汇总视图)

```sql
CREATE VIEW v_order_summary AS
SELECT
    o.id,
    o.order_no,
    o.user_id,
    u.name as user_name,
    o.status,
    o.total_amount,
    COUNT(oi.id) as item_count,
    o.created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;
```

---

## 5. 存储过程

### 5.1 sp_create_order (创建订单)

```sql
CREATE PROCEDURE sp_create_order(
    IN p_user_id BIGINT,
    IN p_items JSON,
    OUT p_order_id BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 创建订单
    INSERT INTO orders (user_id, total_amount, status)
    VALUES (p_user_id, 0, 'pending');

    SET p_order_id = LAST_INSERT_ID();

    -- 处理订单明细
    SET @total_amount = 0;

    -- 这里应该解析 JSON 并插入明细
    -- 实际实现取决于数据库的 JSON 支持

    -- 更新订单总额
    UPDATE orders
    SET total_amount = @total_amount
    WHERE id = p_order_id;

    COMMIT;
END;
```

---

## 6. 触发器

### 6.1 tr_update_stock (更新库存触发器)

```sql
DELIMITER //
CREATE TRIGGER tr_update_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
END;
//
DELIMITER ;
```

---

## 7. 数据字典

### 7.1 状态枚举

| 表 | 字段 | 值 | 说明 |
|----|------|-----|------|
| users | status | active | 活跃 |
| users | status | inactive | 未激活 |
| users | status | banned | 已禁用 |
| orders | status | pending | 待支付 |
| orders | status | paid | 已支付 |
| orders | status | shipped | 已发货 |
| orders | status | completed | 已完成 |
| orders | status | cancelled | 已取消 |
| products | status | active | 上架 |
| products | status | inactive | 下架 |

---

## 8. 索引策略

### 8.1 主键索引

- 所有表使用 `id` 作为自增主键
- 关联表使用联合主键

### 8.2 唯一索引

- `users.email` - 用户邮箱唯一
- `orders.order_no` - 订单号唯一
- 其他业务唯一约束字段

### 8.3 普通索引

| 表 | 索引字段 | 索引类型 | 用途 |
|----|----------|----------|------|
| users | email | BTREE | 登录查询 |
| orders | user_id | BTREE | 用户订单查询 |
| orders | status | BTREE | 订单筛选 |
| orders | created_at | BTREE | 时间范围查询 |
| products | category_id | BTREE | 分类查询 |
| products | status | BTREE | 状态筛选 |

### 8.4 复合索引

| 表 | 索引字段 | 用途 |
|----|----------|------|
| orders | (user_id, created_at) | 用户订单时间查询 |
| products | (category_id, status) | 分类商品查询 |

---

## 9. 分库分表策略

### 9.1 分库策略

- 单库：[单表数据量 < 1000万]
- 分库：[用户 ID 取模分库]

### 9.2 分表策略

- 单表：[表数据量 < 500万]
- 分表：[按时间/ID 范围分表]

---

## 10. 数据迁移

### 10.1 迁移脚本

```sql
-- 迁移版本: 001_add_users_table.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10.2 回滚脚本

```sql
-- 回滚版本: 001_add_users_table.sql
DROP TABLE IF EXISTS users;
```

---

## 11. 备份策略

### 11.1 备份计划

| 类型 | 频率 | 保留时间 |
|------|------|----------|
| 全量备份 | 每天 | 7 天 |
| 增量备份 | 每小时 | 1 天 |
| 日志备份 | 实时 | 3 天 |

### 11.2 备份命令

```bash
# 全量备份
mysqldump -u user -p dbname > backup_$(date +%Y%m%d).sql

# 增量备份
mysqldump -u user -p --single-transaction --flush-logs dbname
```

---

## 12. 性能优化

### 12.1 查询优化建议

- 使用索引覆盖查询
- 避免使用 `SELECT *`
- 合理使用 JOIN
- 使用 EXPLAIN 分析查询计划

### 12.2 慢查询监控

```sql
-- 启用慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;
```

---

## 变更历史

| 版本 | 日期 | 修改人 | 变更内容 |
|------|------|--------|----------|
| v1.0 | [日期] | [作者] | 初始版本 |
