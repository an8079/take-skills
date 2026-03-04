# API 设计规范

## 概述

本文档定义 CLAUDE-STUDIO 项目的 RESTful API 设计标准和最佳实践。

---

## URL 设计

### 1. 资源命名

| 规则 | 示例 |
|------|------|
| 使用名词，非动词 | `/users` 而非 `/getUsers` |
| 复数形式 | `/orders` 而非 `/order` |
| 小写字母 | `/user-profiles` |
| 层级结构 | `/users/{id}/orders` |

### 2. URL 结构

```
https://api.example.com/v1/users/123/orders?status=active&limit=10

┌────────────────┬──────────────────┬────────────────┬─────────────────┐
│   基础 URL      │     版本        │    资源路径    │    查询参数     │
└────────────────┴──────────────────┴────────────────┴─────────────────┘
```

### 3. 常用端点

```http
# 资源 CRUD
GET    /users              # 列表
POST   /users              # 创建
GET    /users/{id}         # 获取单个
PUT    /users/{id}         # 完整更新
PATCH  /users/{id}         # 部分更新
DELETE /users/{id}          # 删除

# 关联资源
GET    /users/{id}/orders # 用户的订单
POST   /users/{id}/orders # 创建订单

# 动作
POST   /users/{id}/activate   # 激活用户
POST   /orders/{id}/cancel    # 取消订单
```

---

## HTTP 方法

### 方法语义

| 方法 | 语义 | 幂等 | 典型用途 |
|------|------|------|----------|
| GET | 读取 | ✅ | 获取资源 |
| POST | 创建 | ❌ | 创建资源 |
| PUT | 完整更新 | ✅ | 完整替换 |
| PATCH | 部分更新 | ❌ | 部分更新 |
| DELETE | 删除 | ✅ | 删除资源 |

### 正确使用示例

```http
# ✅ 创建资源
POST /users
{ "name": "John" }

# ✅ 获取资源
GET /users/123

# ✅ 更新整个资源
PUT /users/123
{ "name": "John", "email": "john@example.com" }

# ✅ 更新部分资源
PATCH /users/123
{ "name": "Jane" }

# ✅ 删除资源
DELETE /users/123
```

---

## 请求格式

### 1. Content-Type

```http
# JSON（默认）
Content-Type: application/json

# 表单数据
Content-Type: application/x-www-form-urlencoded

# 文件上传
Content-Type: multipart/form-data
```

### 2. 请求体

```json
{
  "data": {
    "id": "123",
    "type": "user",
    "attributes": {
      "name": "John",
      "email": "john@example.com"
    },
    "relationships": {
      "orders": {
        "data": [
          { "type": "order", "id": "456" }
        ]
      }
    }
  },
  "meta": {
    "requestId": "abc-123"
  }
}
```

### 3. 命名风格

```json
{
  "userName": "John",           // ❌ camelCase
  "user_name": "John",          // ❌ snake_case
  "user-name": "John",          // ❌ kebab-case
  "userName": "John"            // ✅ JSON 标准 camelCase
}
```

---

## 响应格式

### 1. 成功响应

```json
{
  "data": {
    "id": "123",
    "type": "user",
    "attributes": {
      "name": "John",
      "email": "john@example.com",
      "createdAt": "2026-03-01T00:00:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-03-01T12:00:00Z"
  }
}
```

### 2. 列表响应

```json
{
  "data": [
    { "id": "123", "type": "user", "attributes": {...} },
    { "id": "456", "type": "user", "attributes": {...} }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  },
  "links": {
    "self": "/users?page=1",
    "next": "/users?page=2",
    "prev": null
  }
}
```

### 3. 错误响应

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      },
      {
        "field": "password",
        "message": "密码长度必须至少 8 位"
      }
    ]
  },
  "meta": {
    "requestId": "abc-123"
  }
}
```

### 4. HTTP 状态码

| 状态码 | 含义 | 用途 |
|--------|------|------|
| 200 | OK | 成功获取/更新资源 |
| 201 | Created | 成功创建资源 |
| 204 | No Content | 成功删除（无返回体） |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 业务逻辑错误 |
| 429 | Too Many Requests | 请求频率限制 |
| 500 | Internal Server Error | 服务器错误 |

---

## 认证与授权

### 1. 认证方式

```http
# Bearer Token
Authorization: Bearer <token>

# API Key
X-API-Key: <api-key>

# Basic Auth
Authorization: Basic base64(email:password)
```

### 2. 错误响应

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "认证凭证无效或已过期"
  }
}
```

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "无权访问此资源"
  }
}
```

---

## 分页

### 1. 页码分页

```http
GET /users?page=1&pageSize=20
```

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "links": {
    "self": "/users?page=1&pageSize=20",
    "next": "/users?page=2&pageSize=20",
    "last": "/users?page=5&pageSize=20"
  }
}
```

### 2. 游标分页

```http
GET /users?cursor=abc123&limit=20
```

```json
{
  "data": [...],
  "meta": {
    "nextCursor": "def456",
    "hasMore": true
  }
}
```

---

## 速率限制

### 1. 响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648742400
```

### 2. 限流响应

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超限，请稍后再试",
    "retryAfter": 60
  }
}
```

---

## 版本控制

### 1. URL 版本

```http
GET /v1/users
GET /v2/users
```

### 2. 响应版本

```http
Accept: application/vnd.example.v1+json
Accept: application/vnd.example.v2+json
```

---

## 缓存

### 1. ETag

```http
GET /users/123
ETag: "abc123"

# 下次请求
GET /users/123
If-None-Match: "abc123"
```

### 2. 缓存响应

```http
Cache-Control: max-age=3600, s-maxage=86400
```

---

## 超媒体

### 1. HATEOAS

```json
{
  "data": {
    "id": "123",
    "attributes": { ... }
  },
  "links": {
    "self": "/users/123",
    "orders": "/users/123/orders",
    "activate": {
      "href": "/users/123/activate",
      "method": "POST"
    }
  }
}
```

---

## 设计反模式

### 1. 动词而非名词

```http
# ❌ 错误
GET /getUsers
POST /createUser
PUT /updateUser
DELETE /deleteUser

# ✅ 正确
GET /users
POST /users
PUT /users/{id}
DELETE /users/{id}
```

### 2. 嵌套过深

```http
# ❌ 嵌套过深
GET /users/123/orders/456/items/789

# ✅ 扁平化
GET /items/789?orderId=456&userId=123
```

### 3. 不一致的命名

```http
# ❌ 不一致
GET /users
GET /allOrders
POST /createUser
DELETE /removeUserById

# ✅ 一致
GET /users
GET /orders
POST /users
DELETE /users/{id}
```
