---
name: json-generator
description: 根据描述或模板自动生成真实感测试JSON数据，支持faker模式、边界条件测试数据、负数/空值等异常数据构造
triggers:
  - "生成测试数据"
  - "JSON数据"
  - "mock数据"
  - "测试fixture"
  - "fake数据"
---

# json-generator — 测试数据生成器

> 写测试时需要一堆假数据？不想手写？这个skill帮你生成真实感的JSON测试数据。

## 触发条件
- 用户需要生成测试数据、mock数据、fixture
- 需要大量JSON样本进行测试
- 需要边界条件测试数据（空值、负数、超长字符串等）

## 工具列表
无特殊工具，主要靠Python脚本或LLM生成

## 常见模式

### 基础用户数据
```json
{
  "id": 10001,
  "username": "zhang_san_2024",
  "email": "zhangsan@example.com",
  "phone": "+86-138-0013-8000",
  "age": 28,
  "registered_at": "2024-01-15T08:30:00Z",
  "is_vip": false,
  "balance": 9999.99
}
```

### 分页响应
```json
{
  "page": 1,
  "page_size": 20,
  "total": 100,
  "total_pages": 5,
  "data": []
}
```

### 错误响应
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "参数page必须为正整数",
    "field": "page",
    "request_id": "req_abc123"
  }
}
```

### 数组（多条记录）
```json
[
  { "id": 1, "name": "北京分公司", "status": "active" },
  { "id": 2, "name": "上海分公司", "status": "active" },
  { "id": 3, "name": "深圳分公司", "status": "inactive" }
]
```

## 异常数据构造

### 边界值测试
```json
{
  "age": 0,
  "balance": -0.01,
  "name": "",
  "email": "not-an-email",
  "phone": "12345",
  "quantity": 999999999
}
```

### 超长字符串
```json
{
  "description": "字符串超长（>1000字符）...",
  "comment": "包含特殊字符：\n换行\t制表\"引号'单引号\\反斜杠"
}
```

### 空值/缺失字段
```json
{
  "optional_field": null,
  "description": ""
}
```

### 数组边界
```json
{
  "items": [],
  "max_items": "超过10000条记录的数组"
}
```

## Faker模式（Python示例）

```python
from faker import Faker
import json

fake = Faker('zh_CN')

# 生成单条用户记录
def generate_user():
    return {
        "id": fake.random_int(min=1, max=999999),
        "name": fake.name(),
        "address": fake.address(),
        "company": fake.company(),
        "job": fake.job(),
        "phone": fake.phone_number(),
        "email": fake.email(),
        "birthdate": fake.date_of_birth(minimum_age=18, maximum_age=65).isoformat(),
        "created_at": fake.iso8601()
    }

print(json.dumps(generate_user(), ensure_ascii=False, indent=2))
```

## 常用Faker字段

| 字段 | 方法 | 示例 |
|------|------|------|
| 姓名 | `fake.name()` | 张三 |
| 地址 | `fake.address()` | 北京市朝阳区... |
| 公司 | `fake.company()` | 腾讯科技有限公司 |
| 邮箱 | `fake.email()` | user@example.com |
| 手机 | `fake.phone_number()` | 138-0013-8000 |
| 网址 | `fake.url()` | https://example.com |
| 日期 | `fake.date()` | 2024-03-15 |
| UUID | `fake.uuid4()` | 550e8400-... |

## 使用场景

**用户**: 生成10条用户测试数据
→ 直接输出JSON数组，或Python faker脚本

**用户**: 生成一个订单的完整JSON，包含所有字段
→ 按业务逻辑生成完整订单结构（含商品、地址、支付信息）

**用户**: 帮我生成边界测试数据，要有空值、负数、超长字符串
→ 构造覆盖所有异常情况的JSON
