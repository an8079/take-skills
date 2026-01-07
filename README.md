# 规格驱动开发工作站

一个基于 Claude Code 的 AI 结对编程项目模板，采用「先访谈 → 再规格 → 最后编码」的工作流程。

## 核心理念

**规格驱动开发（Spec-Driven Development）**：在写任何代码之前，先通过结构化访谈明确需求，输出完整规格文档，然后按任务清单逐步实现。

## 快速开始

### 1. 启动 Claude Code

```bash
cd my-project
npx @anthropic-ai/claude-code
```

### 2. 开始新项目

输入 `开始访谈`，AI 会像项目经理一样引导你完成需求沟通。

### 3. 工作流程

```
开始访谈 → 回答问题 → 写规格 → 确认规格 → 开始编码 → 下一个任务 → 反思
```

## 目录结构

```
my-project/
├── CLAUDE.md              # AI 系统提示词（核心配置）
├── .env                   # 环境变量（用户手动创建）
├── .gitignore             # Git 忽略配置
├── docs/                  # 规格文档输出目录
├── src/                   # 源代码
├── tests/                 # 测试代码
├── memory-bank/           # 项目记忆
│   ├── 项目进展.md        # 进展追踪
│   └── 学习记录.md        # AI 学习记录
└── skills/                # 技能库
    ├── claude-skills/     # 技能创建元技能
    ├── skill-creator/     # 智能技能创建器
    ├── frontend-design/   # 前端设计专家
    ├── webapp-testing/    # Web 应用测试
    ├── mcp-builder/       # MCP 服务构建
    └── prompt-engineer/   # 提示词工程专家
```

## 触发词

| 触发词 | 作用 |
|--------|------|
| `开始访谈` | 进入需求访谈模式 |
| `继续访谈` | 继续下一轮提问 |
| `写规格` | 输出规格文档 |
| `开始编码` | 按规格开始实现 |
| `下一个任务` | 继续下一个任务 |
| `反思` | 处理 AI 学习记录 |
| `查看学习` | 查看学习摘要 |

## 技能库

项目内置 6 个可复用技能，AI 会根据项目需求自动调用：

| 技能 | 用途 |
|------|------|
| claude-skills | 创建和验证新技能 |
| skill-creator | 智能判断并创建项目所需技能 |
| frontend-design | UI/UX 设计、组件规范 |
| webapp-testing | 单元测试、集成测试、E2E 测试 |
| mcp-builder | MCP Server 开发 |
| prompt-engineer | 提示词设计与优化 |

## 反思机制

项目集成了自学习能力：

1. AI 自动捕获用户的纠正
2. 记录到 `memory-bank/学习记录.md`
3. 运行 `/reflect` 确认并应用学习
4. 重要规则写入 `CLAUDE.md`

## 环境变量

复制 `.env.example` 为 `.env` 并填入真实值：

```env
# LLM 配置
LLM_BASE_URL="https://your-llm-endpoint/v1"
LLM_API_KEY="your-api-key"
LLM_MODEL_NAME="model-name"

# 数据库配置（如需要）
POSTGRES_SERVER="127.0.0.1:5432"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your-password"
POSTGRES_DB="your-database"
```

## 许可证

MIT
