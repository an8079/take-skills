---
name: api-design
description: API 设计技能。RESTful API 设计、接口契约、文档。
tags: [api, rest, documentation]
---

# API 设计技能

## When to Use This Skill

- 设计 RESTful API 时
- 编写 API 文档时
- 接口版本管理时
- 需要 API 最佳实践时

## Quick Reference

### RESTful 原则

| 原则 | 说明 |
|------|------|
| 资源导向 | URL 表示资源 |
| 统一接口 | 使用标准 HTTP 方法 |
| 无状态 | 请求包含所有信息 |
| 可缓存 | GET 请求可缓存 |
| 分层系统 | 可添加代理层 |
| 统一响应 | 标准响应格式 |

### HTTP 方法使用

| 方法 | 语义 | 幂等 | 示例 |
|------|------|------|------|
| GET | 获取资源 | 是 | `GET /users` |
| POST | 创建资源 | 否 | `POST /users` |
| PUT | 完全更新 | 是 | `PUT /users/1` |
| PATCH | 部分更新 | 否 | `PATCH /users/1` |
| DELETE | 删除资源 | 是 | `DELETE /users/1` |

### 状态码使用

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 OK | 请求成功 | GET、PUT、PATCH、DELETE 成功 |
| 201 Created | 创建成功 | POST 创建资源 |
| 204 No Content | 成功无返回 | DELETE 成功 |
| 400 Bad Request | 请求错误 | 参数验证失败 |
| 401 Unauthorized | 未认证 | 缺少 token |
| 403 Forbidden | 无权限 | token 有效但无权限 |
| 404 Not Found | 资源不存在 | GET 资源 |
| 409 Conflict | 冲突 | 资源已存在 |
| 422 Unprocessable Entity | 验证失败 | 业务规则验证失败 |
| 429 Too Many Requests | 请求过多 | 超过速率限制 |
| 500 Internal Server Error | 服务器错误 | 未知错误 |

### URL 设计规范

```typescript
// 资源集合
GET    /users          // 列表
POST   /users          // 创建

// 单个资源
GET    /users/:id      // 获取单个
PUT    /users/:id      // 更新
PATCH  /users/:id      // 部分更新
DELETE /users/:id      // 删除

// 嵌套资源
GET    /users/:id/orders     // 用户的订单
POST   /users/:id/orders     // 创建订单
GET    /orders/:id/items     // 订单的商品

// 操作（动作）
POST   /users/:id/activate  // 激活用户
POST   /orders/:id/cancel    // 取消订单
```

### 分页设计

```typescript
// 请求
GET /users?page=1&limit=20&sort=created_at&order=desc

// 响应
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 过滤和搜索

```typescript
// 简单过滤
GET /users?status=active&role=admin

// 范围过滤
GET /products?price_min=100&price_max=500

// 搜索
GET /users?q=john

// 组合
GET /users?status=active&q=john&page=1&limit=20
```

### 统一响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 成功响应
{
  "success": true,
  "data": { "id": "1", "email": "user@example.com" }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "field": "email" }
  }
}
```

### API 版本管理

```typescript
// URL 版本
GET /v1/users
GET /v2/users

// Header 版本
GET /users
Headers: {
  "API-Version": "v1"
}
```

### 认证设计

```typescript
// JWT Bearer Token
GET /protected-resource
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}

// API Key
GET /protected-resource
Headers: {
  "X-API-Key": "your-api-key"
}

// Session Cookie
GET /protected-resource
Headers: {
  "Cookie": "session_id=abc123"
}
```

## Examples

### Example 1: 用户管理 API

```typescript
// 获取用户列表
GET /api/v1/users
Query: {
  page: number;      // 页码，默认 1
  limit: number;     // 每页数量，默认 20
  status: 'active' | 'inactive';
  role: 'admin' | 'user';
  q: string;        // 搜索关键词
}
Response: ApiResponse<PaginatedUsers>

// 获取单个用户
GET /api/v1/users/:id
Response: ApiResponse<User>

// 创建用户
POST /api/v1/users
Body: {
  email: string;
  password: string;
  name?: string;
}
Response: ApiResponse<User> // 201

// 更新用户
PATCH /api/v1/users/:id
Body: {
  name?: string;
  email?: string;
}
Response: ApiResponse<User>

// 删除用户
DELETE /api/v1/users/:id
Response: ApiResponse<null> // 204
```

### Example 2: 订单管理 API

```typescript
// 创建订单
POST /api/v1/orders
Body: {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    zip: string;
    country: string;
  };
}
Response: ApiResponse<{
  id: string;
  status: string;
  total: number;
  items: OrderItem[];
}>

// 获取订单状态
GET /api/v1/orders/:id/status
Response: ApiResponse<{
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  status_history: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}>

// 取消订单
POST /api/v1/orders/:id/cancel
Response: ApiResponse<Order>
```

### Example 3: 文件上传 API

```typescript
// 上传文件
POST /api/v1/upload
Content-Type: multipart/form-data
Body: {
  file: File;
  category?: string;
}
Response: ApiResponse<{
  url: string;
  filename: string;
  size: number;
}>

// 批量上传
POST /api/v1/upload/batch
Content-Type: multipart/form-data
Body: {
  files: File[];
}
Response: ApiResponse<{
  files: Array<{
    url: string;
    filename: string;
  }>;
  failed: Array<{
    filename: string;
    error: string;
  }>;
}>
```

## API 文档

### OpenAPI/Swagger 示例

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
  description: User management API

paths:
  /users:
    get:
      summary: Get users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'

    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
              required:
                - email
                - password
      responses:
        '201':
          description: Created

  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
```

## References

- RESTful API 设计最佳实践: https://restfulapi.net/
- API Design Best Practices: https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design

## Maintenance

- 来源：结合两个项目的 API 设计经验
- 最后更新：2026-01-24
