# 全自动构建 - 示例文档

本文件展示如何在 `docs/` 目录中放置参考资料，以便启动全自动构建。

## 示例项目：AI智能客服系统

### 1. 需求文档 (requirements.md)

```markdown
# 项目名称：AI智能客服系统

## 项目描述
基于大语言模型的智能客服系统，支持多轮对话、意图识别、工单管理等功能。

## 功能需求

### 核心功能
1. 智能问答 - 基于RAG的向量检索问答
2. 多轮对话 - 支持上下文的多轮对话管理
3. 意图识别 - 自动识别用户意图并路由
4. 工单管理 - 创建、分配、跟踪工单
5. 客服分配 - 智能分配客服人员
6. 数据分析 - 客服数据分析报表

### API需求
- 用户认证 (JWT)
- 对话管理
- 知识库管理
- 工单系统
- 统计报表
```

### 2. API定义 (api-spec.md)

```markdown
# API 接口定义

## 用户认证
- POST /api/v1/auth/login - 用户登录
- POST /api/v1/auth/register - 用户注册
- POST /api/v1/auth/refresh - 刷新Token

## 对话管理
- POST /api/v1/chat/send - 发送消息
- GET /api/v1/chat/history/{session_id} - 获取历史
- DELETE /api/v1/chat/session/{id} - 删除会话

## 工单系统
- POST /api/v1/tickets - 创建工单
- GET /api/v1/tickets - 列表工单
- PUT /api/v1/tickets/{id} - 更新工单
- GET /api/v1/tickets/{id} - 工单详情
```

### 3. 数据库结构 (database.md)

```markdown
# 数据库设计

## 用户表 (users)
- id: 主键
- username: 用户名
- email: 邮箱
- password_hash: 密码
- role: 角色 (admin/agent/user)
- created_at: 创建时间

## 对话表 (conversations)
- id: 主键
- user_id: 用户ID
- session_id: 会话ID
- message: 消息内容
- role: 角色 (user/assistant)
- created_at: 创建时间

## 工单表 (tickets)
- id: 主键
- title: 标题
- description: 描述
- status: 状态 (open/in_progress/resolved/closed)
- priority: 优先级 (low/medium/high/urgent)
- assigned_to: 分配给
- created_by: 创建人
- created_at: 创建时间
```

### 4. 技术栈 (tech-stack.md)

```markdown
# 技术栈选择

## 后端
- Python 3.11
- FastAPI
- PostgreSQL
- Redis (缓存/Session)
- LangChain (LLM集成)
- FAISS (向量数据库)

## 前端
- Vue 3 + Composition API
- Vite
- TailwindCSS

## 部署
- Docker
- Nginx
```

## 使用步骤

1. 在 `docs/` 目录创建上述文档
2. 对着AI说出触发口令
3. AI会自动完成整个开发流程

## 触发口令

- "自动开发"
- "全自动"
- "帮我做个XX项目"
- "放开干"
