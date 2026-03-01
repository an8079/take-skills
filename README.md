# Claude Code 开发助手配置

> **版本：** v1.0.0 | AI 软件开发助手配置

基于 Claude Code 的完整开发工作流配置，覆盖需求分析到项目交付的完整流程。

---

## 快速开始

### 方式一：作为插件安装（推荐）

```bash
# 添加到 marketplace
/plugin marketplace add local F:/claude-studio/2.22/opencode-z

# 安装插件
/plugin install opencode-z@opencode-z
```

### 方式二：手动安装

```bash
# 复制所有组件到 Claude Code 配置目录
cp -r agents/* ~/.claude-code/agents/
cp -r skills/* ~/.claude-code/skills/
cp -r commands/* ~/.claude-code/commands/
cp -r rules/* ~/.claude-code/rules/
cp -r contexts/* ~/.claude-code/contexts/

# 复制 hooks 配置（合并到 settings.json）
# 复制 CLAUDE.md 到你的项目根目录
```

---

## 目录结构

```
opencode-z/
├── README.md                 # 项目说明
├── CLAUDE.md                 # 系统提示词（全局配置）
├── .claude-code/             # Claude Code 配置
│   ├── agents/
│   ├── skills/
│   ├── commands/
│   ├── hooks/
│   └── contexts/
│
├── agents/                   # 专用 AI Agent
│   ├── interviewer.md        # 需求访谈专家
│   ├── architect.md          # 架构设计专家
│   ├── planner.md            # 实现计划专家
│   ├── coder.md              # 编码专家
│   ├── tester.md             # 测试专家
│   ├── reviewer.md           # 代码审查专家
│   ├── security-reviewer.md  # 安全审查专家
│   ├── devops.md             # DevOps 交付专家
│   ├── optimizer.md          # 迭代优化专家
│   └── debug-helper.md       # 调试助手
│
├── skills/                   # 技能库（领域知识）
│   ├── requirement-analysis/ # 需求分析技能
│   ├── spec-writing/         # 规格文档编写
│   ├── tdd-workflow/         # TDD 工作流
│   ├── frontend-patterns/    # 前端模式
│   ├── backend-patterns/     # 后端模式
│   ├── database-design/      # 数据库设计
│   ├── api-design/           # API 设计
│   ├── security-review/      # 安全审查
│   ├── performance-tuning/   # 性能调优
│   ├── langchain-arch/       # LangChain 架构
│   ├── langgraph-workflows/  # LangGraph 工作流
│   ├── continuous-learning/  # 持续学习
│   ├── prompt-engineering/   # 提示词工程
│   ├── mcp-builder/          # MCP 构建器
│   └── skill-creator/       # 技能创建器
│
├── commands/                 # 斜杠命令
│   ├── interview.md          # /interview - 开始需求访谈
│   ├── spec.md               # /spec - 生成规格文档
│   ├── plan.md               # /plan - 创建实现计划
│   ├── code.md               # /code - 编码模式
│   ├── tdd.md                # /tdd - TDD 工作流
│   ├── test.md               # /test - 运行测试
│   ├── review.md             # /review - 代码审查
│   ├── security.md           # /security - 安全审查
│   ├── build.md              # /build - 构建项目
│   ├── deploy.md             # /deploy - 部署项目
│   ├── package.md            # /package - 打包交付
│   ├── reflect.md            # /reflect - 反思学习
│   ├── learn.md              # /learn - 提取学习模式
│   ├── verify.md             # /verify - 验证循环
│   └── checkpoint.md         # /checkpoint - 保存验证点
│
├── rules/                    # 全局规则（始终遵守）
│   ├── workflow.md           # 工作流规则
│   ├── coding-style.md       # 代码风格
│   ├── security.md           # 安全规则
│   ├── testing.md            # 测试规则
│   ├── git-workflow.md       # Git 工作流
│   ├── performance.md        # 性能规则
│   └── agents.md             # Agent 使用规则
│
├── hooks/                    # 自动化 Hooks
│   ├── hooks.json            # Hooks 配置
│   ├── session-lifecycle/    # 会话生命周期
│   ├── quality-check/        # 质量检查
│   └── memory-persistence/   # 记忆持久化
│
├── contexts/                 # 上下文注入
│   ├── dev.md                # 开发模式
│   ├── review.md             # 审查模式
│   ├── research.md           # 研究模式
│   └── delivery.md           # 交付模式
│
├── mcp-configs/              # MCP 服务器配置
│   └── mcp-servers.json
│
├── examples/                 # 示例配置
│   ├── CLAUDE.md             # 项目级配置示例
│   └── sessions/             # 示例会话
│
├── memory-bank/              # 记忆库
│   ├── 项目进展.md           # 项目进展
│   ├── 学习记录.md           # 学习记录
│   └── 技术决策.md           # 技术决策
│
├── docs/                     # 文档
│   ├── spec-template.md      # 规格文档模板
│   ├── api-template.md       # API 文档模板
│   └── deployment-guide.md   # 部署指南
│
└── projects/                 # 项目存放区
    └── [项目名称]/
        ├── README.md
        ├── CLAUDE.md
        ├── .env.example
        ├── src/
        ├── tests/
        ├── docs/
        └── deploy/
```

---

## 工作流程

### 阶段一：需求分析

```bash
/interview              # 开始需求访谈
```

- interviewer agent 进行深度访谈
- 8 维度完整度检查
- 自动识别是否需要新技能

### 阶段二：规格设计

```bash
/spec                   # 生成规格文档
```

- architect agent 输出精细规格
- 包含功能规格、技术规格、非功能需求
- 用户确认后进入计划阶段

### 阶段三：实现计划

```bash
/plan                   # 创建实现计划
```

- planner agent 拆解任务
- 识别依赖关系
- 输出可执行的任务清单

### 阶段四：编码实现

```bash
/code                   # 进入编码模式
/tdd                    # TDD 工作流
```

- coder agent 按计划实现
- 可选 TDD 模式
- 实时代码风格检查

### 阶段五：测试验证

```bash
/test                   # 运行测试
/verify                 # 验证循环
```

- tester agent 生成测试
- 执行单元/集成/E2E 测试
- 验证通过标准

### 阶段六：代码审查

```bash
/review                 # 代码审查
/security               # 安全审查
```

- reviewer agent 质量检查
- security-reviewer agent 安全审计
- 审查通过后才能继续

### 阶段七：打包交付

```bash
/build                  # 构建项目
/deploy                 # 部署项目
/package                # 打包交付
```

- devops agent 处理构建部署
- 生成交付包
- 包含完整文档和配置

### 阶段八：迭代优化

```bash
/reflect                 # 反思学习
/learn                   # 提取模式
```

- optimizer agent 分析项目
- 提取可复用模式
- 更新知识库

---

## 触发词速查

| 命令 | 作用 |
|------|------|
| `/interview` | 开始需求访谈 |
| `/spec` | 生成规格文档 |
| `/plan` | 创建实现计划 |
| `/code` | 进入编码模式 |
| `/tdd` | TDD 工作流 |
| `/test` | 运行测试 |
| `/review` | 代码审查 |
| `/security` | 安全审查 |
| `/build` | 构建项目 |
| `/deploy` | 部署项目 |
| `/package` | 打包交付 |
| `/reflect` | 反思学习 |
| `/learn` | 提取学习模式 |
| `/verify` | 验证循环 |
| `/checkpoint` | 保存验证点 |

---

## 核心 Agents

| Agent | 职责 | 时机 |
|-------|------|------|
| interviewer | 需求访谈 | 新项目启动、需求变更 |
| architect | 架构设计 | 规格输出前 |
| planner | 计划拆解 | 编码开始前 |
| coder | 编码实现 | 实现阶段 |
| tester | 测试生成 | 编码完成后 |
| reviewer | 代码审查 | PR/commit 前 |
| security-reviewer | 安全审计 | 交付前 |
| devops | 构建部署 | 打包交付时 |
| optimizer | 迭代优化 | 里程碑/项目结束 |

---

## Hooks 自动化

Hooks 在以下时机自动触发：

| 时机 | 触发内容 |
|------|----------|
| Edit 工具后 | 检查代码风格、console.log |
| Bash 工具后 | 检查命令是否成功 |
| 会话开始时 | 加载项目记忆 |
| 会话结束时 | 保存状态、提取学习 |
| 编码模式 | 实时质量检查 |

---

## 记忆系统

### 项目记忆（memory-bank/）

- `项目进展.md` - 追踪项目各阶段进展
- `学习记录.md` - 记录用户纠正和经验
- `技术决策.md` - 记录重要技术决策

### 持续学习

- 会话结束自动提取模式
- `/reflect` 命令处理纠正
- `/learn` 命令手动提取
- 学习内容保存为 skills/learned/

---

## 跨平台支持

本插件完全支持 **Windows、macOS、Linux**。

所有脚本使用 Node.js 实现，兼容性最佳。

---

## 许可证

MIT License

---

## Star History

如果这个项目对你有帮助，请给个 Star
