# Claude Code 快速开始指南

> 让你在 5 分钟内上手 Claude Code 开发助手

---

## 第一步：安装配置

### 方式一：作为插件安装（推荐）

```bash
# 1. 复制项目到 Claude Code 插件目录
# Windows
xcopy /E /I opencode-z %USERPROFILE%\.claude-code\plugins\opencode-z

# macOS/Linux
cp -r opencode-z ~/.claude-code/plugins/opencode-z

# 2. 重启 Claude Code
```

### 方式二：手动配置

```bash
# 1. 将 CLAUDE.md 复制到你的项目根目录
cp opencode-z/CLAUDE.md your-project/

# 2. 将必要的文件按需复制到项目中
```

---

## 第二步：你的第一个项目

### 1. 进入你的项目目录

```bash
cd your-project
```

### 2. 开始需求分析

```bash
# 在 Claude Code 中输入
开始访谈
```

### 3. 我会引导你完成访谈

```
📋 **访谈进度**

**当前理解完整度：**
| 维度 | 状态 |
|------|------|
| 业务理解 | ⬜ |
| 功能边界 | ⬜ |
...

**我的理解：**
暂无

**本轮问题：**
1. 请简单描述这个项目要做什么？
2. 主要的用户是谁？
```

### 4. 回答问题

```
我做一个待办事项管理应用，主要面向个人用户。
需要支持添加、完成、删除任务，并且可以设置优先级。
```

### 5. 继续访谈直到所有维度完成

我会根据 8 个维度深入提问，确保需求完整。

### 6. 生成规格文档

访谈完成后说：

```
写规格
```

我会生成完整的规格文档到 `docs/spec.md`。

---

## 第三步：实现计划

规格文档确认后，创建实现计划：

```bash
claude /plan
```

我会输出可执行的任务列表：

```
📋 **实现计划**

| 任务 | 描述 | 优先级 |
|------|------|--------|
| T-01 | 创建项目结构 | P0 |
| T-02 | 实现数据模型 | P0 |
| T-03 | 实现 CRUD API | P0 |
...
```

---

## 第四步：开始编码

```bash
claude /code
```

我会按顺序执行任务，每个任务完成后等待你的确认。

---

## 常用命令速查

| 命令 | 用途 |
|------|------|
| `/interview` | 开始需求访谈 |
| `/spec` | 生成规格文档 |
| `/plan` | 创建实现计划 |
| `/code` | 开始编码 |
| `/tdd` | TDD 模式 |
| `/test` | 运行/生成测试 |
| `/review` | 代码审查 |
| `/build` | 构建项目 |
| `/deploy` | 部署项目 |
| `/reflect` | 反思学习 |

---

## 快速模式（跳过访谈）

如果你已经有了清晰的需求描述，可以直接快速开始：

```
跳过访谈
我做一个简单的 API，只有 GET /users 和 POST /users 两个接口，用 FastAPI + SQLite。
```

我会跳过完整访谈，直接输出实现计划。

---

## 项目级配置

在项目根目录创建 `CLAUDE.md` 来配置项目特定规则：

```markdown
# 项目名称

## 技术栈
- 前端: React + TypeScript
- 后端: FastAPI + Python 3.11
- 数据库: PostgreSQL

## 项目规则
- 所有 API 必须有测试
- 函数不超过 50 行
- 使用 Black 格式化
```

---

## 技能库使用

当项目涉及特定领域时，我会自动调用对应技能：

- **前端开发** → `frontend-patterns` 技能
- **后端开发** → `backend-patterns` 技能
- **数据库设计** → `database-design` 技能
- **API 设计** → `api-design` 技能
- **安全审查** → `security-review` 技能
- **性能调优** → `performance-tuning` 技能

你也可以手动调用：

```
使用 database-design 技能帮我设计用户表
```

---

## 常见问题

### Q: 如何查看项目进展？

A: 查看 `memory-bank/项目进展.md`

### Q: 如何让 AI 记住我的偏好？

A: 运行 `/reflect` 命令处理学习记录

### Q: 如何创建新技能？

A: 我会在检测到新模式时自动提示创建

### Q: 支持哪些语言？

A: 支持 Python、JavaScript/TypeScript、Go、Java、Rust 等

### Q: 如何使用 TDD 模式？

A: 在编码阶段输入 `/tdd`，AI 会按照 RED → GREEN → IMPROVE 流程工作

---

## 下一步

- 阅读 [README.md](./README.md) 了解完整功能
- 阅读 [examples/CLAUDE.md](./examples/CLAUDE.md) 查看项目配置示例
- 探索 `skills/` 目录中的各种技能

---

## 获取帮助

如果遇到问题，可以：

1. 查看项目文档
2. 运行 `/reflect` 查看学习记录
3. 在 Claude Code 中直接询问 "帮我调试这个问题"
