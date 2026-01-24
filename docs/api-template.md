# API 文档模板

> 版本：v1.0 | 日期：[日期]

---

## 概述

本文档描述 [项目名称] 的 API 接口。

### 基础信息

| 项目 | 内容 |
|------|------|
| API 名称 | [API 名称] |
| 版本 | v1.0 |
| 基础 URL | `https://api.example.com/v1` |
| 认证方式 | JWT Bearer Token |
| 内容类型 | `application/json` |

---

## 通用信息

### 认证

大部分接口需要 JWT Token 认证：

```http
Authorization: Bearer <token>
```

### 响应格式

所有接口遵循统一的响应格式：

```json
{
  "success": true,
  "data": {
    // 返回数据
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 OK | 请求成功 |
| 201 Created | 资源创建成功 |
| 204 No Content | 请求成功，无返回内容 |
| 400 Bad Request | 请求参数错误 |
| 401 Unauthorized | 未认证 |
| 403 Forbidden | 无权限 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突 |
| 422 Unprocessable Entity | 业务规则验证失败 |
| 429 Too Many Requests | 请求过于频繁 |
| 500 Internal Server Error | 服务器内部错误 |

### 错误码

| 错误码 | 说明 |
|--------|------|
| VALIDATION_ERROR | 参数验证失败 |
| UNAUTHORIZED | 未认证 |
| FORBIDDEN | 无权限 |
| NOT_FOUND | 资源不存在 |
| CONFLICT | 资源冲突 |
| INTERNAL_ERROR | 服务器内部错误 |

---

## API 接口

### 1. 用户管理

#### 1.1 获取用户列表

**接口描述**：获取用户列表，支持分页和过滤

**请求**

```
GET /users
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| page | integer | 否 | 页码 | 1 |
| limit | integer | 否 | 每页数量 | 20 |
| status | string | 否 | 用户状态 | - |
| q | string | 否 | 搜索关键词 | - |

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "email": "user@example.com",
      "name": "User Name",
      "status": "active",
      "createdAt": "2024-01-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 1.2 获取单个用户

**接口描述**：根据 ID 获取用户信息

**请求**

```
GET /users/{userId}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户 ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "user@example.com",
    "name": "User Name",
    "status": "active",
    "createdAt": "2024-01-24T10:00:00Z"
  }
}
```

#### 1.3 创建用户

**接口描述**：创建新用户

**请求**

```
POST /users
Content-Type: application/json
```

**请求体**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |
| name | string | 否 | 用户名 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "user@example.com",
    "name": "User Name",
    "createdAt": "2024-01-24T10:00:00Z"
  }
}
```

**错误示例**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱已注册"
  }
}
```

---

## 数据模型

### User 用户模型

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### Error 错误模型

```typescript
interface Error {
  code: string;
  message: string;
  details?: any;
}
```

---

## 示例代码

### JavaScript/TypeScript

```typescript
// 获取用户列表
async function getUsers(page = 1, limit = 20) {
  const response = await fetch(
    `https://api.example.com/v1/users?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return await response.json();
}

// 创建用户
async function createUser(userData) {
  const response = await fetch(
    'https://api.example.com/v1/users',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    }
  );

  return await response.json();
}
```

### Python

```python
import requests

BASE_URL = "https://api.example.com/v1"
TOKEN = "your-token-here"

def get_users(page=1, limit=20):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    params = {"page": page, "limit": limit}

    response = requests.get(f"{BASE_URL}/users", headers=headers, params=params)
    return response.json()

def create_user(user_data):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.post(f"{BASE_URL}/users", headers=headers, json=user_data)
    return response.json()
```

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | [日期] | 初始版本 |
