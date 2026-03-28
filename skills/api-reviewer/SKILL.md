# api-reviewer

> API 质量专项审查技能 — RESTful/GraphQL/WebSocket 接口规范性、安全性、性能审查

## 触发词
`api review`, `接口审查`, `API质量`, `接口安全`, `api-review`

## 概述

作为 api-reviewer，专注于 API 的质量审查，涵盖 RESTful 设计规范、GraphQL schema 设计、WebSocket 协议、安全性和性能问题。

## 核心审查维度

### 1. API 设计规范
- RESTful 路由规范（名词复数、层级嵌套限制）
- HTTP 方法正确使用（GET/POST/PUT/DELETE/PATCH）
- 状态码标准使用（200/201/400/401/403/404/500）
- 错误响应格式一致性（error object 结构）
- GraphQL schema 规范（Query/Mutation/Subscription 分离）

### 2. 接口安全性
- 认证授权检查（JWT 验证、权限校验）
- 敏感数据暴露（密码、token 不应在响应中返回）
- SQL/NoSQL 注入风险
- 参数校验（类型、范围、格式）
- CORS 配置检查
- Rate Limiting 实现检查

### 3. 接口性能
- N+1 查询问题检测
- 不必要的全量查询
- 分页实现检查
- 缓存头部设置（Cache-Control/ETag）
- 响应体大小（是否压缩）

### 4. 版本管理
- API 版本控制规范（URL versioning vs Header versioning）
- 破坏性变更标识
- 废弃 API 标识

### 5. 文档完整性
- OpenAPI/Swagger 文档存在性
- 请求/响应示例完整性
- 字段说明完整性
- 错误码文档

## 审查检查清单

```
[ ] RESTful 规范
    - [ ] 路由使用名词复数 /users, /orders
    - [ ] 正确 HTTP 方法
    - [ ] 状态码标准使用
    - [ ] 嵌套路由不超过 2 层

[ ] GraphQL（如适用）
    - [ ] Query 不应有副作用
    - [ ] Mutation 返回有意义数据
    - [ ] 避免深度嵌套查询
    - [ ] N+1 问题（DataLoader）

[ ] 安全审查
    - [ ] 所有变更操作用 POST/PUT/PATCH/DELETE
    - [ ] 敏感字段已过滤（password, token）
    - [ ] 输入参数校验存在
    - [ ] SQL 注入风险评估

[ ] 性能审查
    - [ ] 大列表有分页
    - [ ] 无 N+1 查询
    - [ ] 响应有 ETag/Cache-Control

[ ] 文档审查
    - [ ] OpenAPI 文档存在且最新
    - [ ] 所有端点有示例
    - [ ] 错误码有说明
```

## 执行流程

### Step 1: 定位 API 代码
```bash
# 查找 API 路由文件
find . -name "*.ts" -path "*/routes/*" -o -name "*.py" -path "*/endpoints/*"
find . -name "*.ts" -path "*/api/*" -o -name "*.go" -path "*/handlers/*"
# 查找 GraphQL
find . -name "schema.*" -o -name "*.graphqls"
# 查找 OpenAPI
find . -name "openapi.*" -o -name "swagger.*" -o -name "*.yaml" -path "*/api/*"
```

### Step 2: 分析 API 结构
- 读取路由定义
- 分析输入输出模型
- 检查中间件链
- 审查认证逻辑

### Step 3: 安全扫描
- 敏感数据流分析
- 权限模型检查
- 输入验证覆盖度

### Step 4: 输出报告
```markdown
## API 审查报告

### 端点统计: X 个
- RESTful: X | GraphQL: X | WebSocket: X

### 发现问题: X个
| 严重度 | 端点 | 问题 | 建议 |
|--------|------|------|------|
| 🔴 Critical | POST /api/users | 密码明文返回 | 过滤 password 字段 |
| 🟡 Warning | GET /api/orders | 无分页参数 | 添加 ?page=&limit= |
```

## 输出标准

1. **端点全覆盖**: 列出所有审查的端点
2. **问题具体化**: 端点 + HTTP方法 + 问题描述
3. **安全第一**: 安全隐患必须高亮
4. **可执行建议**: 提供修复代码示例

## 工具推荐
- `eslint-plugin-security` — JavaScript 安全扫描
- `sobelow` — Elixir API 安全
- `bandit` — Python 安全扫描
- `OWASP ZAP` — API 渗透测试
