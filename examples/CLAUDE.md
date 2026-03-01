# 项目示例配置

这是 Claude Code 的项目级配置文件示例。将此文件复制到你的项目根目录并修改。

---

## 项目信息

- **项目名称：** [填写项目名称]
- **项目描述：** [简短描述项目功能]
- **技术栈：** [如：React + TypeScript + FastAPI + PostgreSQL]

---

## 核心配置

### 可用 Agents

项目可能用到的 Agents：

| Agent | 用途 |
|-------|------|
| planner | 创建实现计划 |
| coder | 编码实现 |
| tester | 测试相关 |
| reviewer | 代码审查 |
| debug-helper | 调试问题 |

### 可用 Commands

| 命令 | 用途 |
|------|------|
| /interview | 开始需求访谈 |
| /plan | 创建实现计划 |
| /code | 进入编码模式 |
| /tdd | TDD 工作流 |
| /test | 运行测试 |
| /review | 代码审查 |
| /build | 构建项目 |
| /deploy | 部署项目 |
| /reflect | 反思学习 |

---

## 项目结构

```
[项目名称]/
├── src/                  # 源代码
│   ├── api/             # API 层
│   ├── services/        # 业务逻辑层
│   ├── models/          # 数据模型
│   ├── utils/           # 工具函数
│   └── main.py/main.ts  # 入口文件
├── tests/               # 测试代码
│   ├── unit/            # 单元测试
│   ├── integration/     # 集成测试
│   └── e2e/             # E2E 测试
├── docs/                # 文档
│   ├── spec.md          # 规格文档
│   ├── api.md           # API 文档
│   └── deployment.md    # 部署指南
├── scripts/             # 脚本
├── deploy/              # 部署配置
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example         # 环境变量模板
└── README.md            # 项目说明
```

---

## 项目规则

### 编码风格

- 语言：[如：TypeScript / Python]
- 格式化工具：[如：Prettier / Black]
- Lint 工具：[如：ESLint / Flake8]
- 最大行数：[如：200]
- 最大文件行数：[如：800]

### 测试要求

- 测试框架：[如：Jest / Pytest]
- 覆盖率要求：[如：80%]
- 单元测试要求：[如：每个函数都要有测试]
- 集成测试要求：[如：每个 API 端点都要有测试]

### Git 工作流

- 主分支：`main`
- 开发分支：从 `main` 创建功能分支
- 分支命名：`feature/功能名`、`fix/问题描述`
- 提交信息格式：Conventional Commits

---

## 环境变量

复制 `.env.example` 为 `.env` 并填入真实值：

```env
# 应用配置
APP_NAME=[应用名称]
APP_ENV=[development/production]
PORT=[端口]

# 数据库配置
DATABASE_URL=[数据库连接字符串]

# API 密钥
API_KEY=[API 密钥]

# 其他配置
[其他配置项]
```

---

## 快速开始

### 安装依赖

```bash
# Node.js 项目
npm install

# Python 项目
pip install -r requirements.txt

# 或使用 Docker
docker-compose up -d
```

### 启动开发服务器

```bash
# Node.js 项目
npm run dev

# Python 项目
python -m uvicorn main:app --reload

# 或使用 Docker
docker-compose up
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率
npm run test:coverage
```

### 构建项目

```bash
# 开发环境构建
npm run build

# 生产环境构建
npm run build:prod
```

---

## 常用任务

### 添加新功能

```bash
# 1. 开始需求访谈
claude /interview

# 2. 生成规格文档
claude /spec

# 3. 创建实现计划
claude /plan

# 4. 开始编码
claude /code

# 5. 运行测试
claude /test

# 6. 代码审查
claude /review

# 7. 构建项目
claude /build
```

### 修复 Bug

```bash
# 1. 使用调试助手
claude /debug

# 2. 运行测试验证
claude /test

# 3. 代码审查
claude /review

# 4. 反思学习
claude /reflect
```

### 部署项目

```bash
# 1. 构建项目
claude /build

# 2. 部署到服务器
claude /deploy

# 3. 验证部署
curl https://your-domain.com/health
```

---

## 技能调用

### 什么时候调用什么

| 情况 | 调用的技能 |
|------|------------|
| 设计 API 接口时 | api-design |
| 设计数据库时 | database-design |
| 需要前端最佳实践时 | frontend-patterns |
| 需要后端最佳实践时 | backend-patterns |
| 需要编写测试时 | tdd-workflow, webapp-testing |
| 需要代码审查时 | code-review, security-review |
| 需要优化性能时 | performance-tuning |
| 需要设计提示词时 | prompt-engineering |

---

## 自定义配置

### 禁用某些 Agents

如果项目不需要某些 agents，可以在这里指定：

```
禁用：optimizer, devops
```

### 启用特定 Skills

指定项目需要额外关注的技能：

```
关注：security, performance
```

---

## 备注

[其他需要说明的项目配置信息]
