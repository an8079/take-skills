# Claude Code 开发助手配置

[![CI](https://github.com/YOUR_USERNAME/claude-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/claude-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **版本：** v3.0.0 | 更新日期：2026-03-23 | 个性化开发助手工作流

基于 Claude Code 的完整开发工作流配置，覆盖需求分析到项目交付的完整流程。

---

## 项目特性

| 特性 | 说明 |
|------|------|
| **核心访谈命令** | /deep-interview（苏格拉底式）、/auto-interview（双Agent辩论） |
| **产品审视命令** | /office-hours（gstack风格）、/find-product-remind（技能推荐） |
| **架构与设计** | /structure_thinking（架构分析）、/rag（RAG设计） |
| **测试团队** | /test-teams（3测试员+1资深）、/team（动态组队） |
| **执行引擎** | /autopilot、/ralph、/ultrawork、/ultraqa |
| **12+ 内置 Agent** | interviewer、architect、planner、executor、qa-tester、code-reviewer 等 |
| **通知系统** | /notify（集成 claude-notifications-go） |
| **激将激励** | /pua（竞争压力激励） |

---

## 快速开始

### 方式一：作为插件安装（推荐）

```bash
# 添加到 marketplace
/plugin marketplace add local F:/claude-studio/3.4/claude-studio/claude-studio

# 安装插件
/plugin install claude-dev-assistant@claude-studio
```

### 方式二：手动复制

```bash
# 复制所有组件到 Claude Code 配置目录
cp -r skills/agents/* ~/.claude/skills/
cp -r commands/*.md ~/.claude/commands/
```

---

## 命令索引

<!-- AUTO-COMMANDS -->
| 命令 | 用途 |
|------|------|
| `analyze` | |
| `auto-interview` | |
| `autopilot` | |
| `code` | |
| `debug` | |
| `deep-interview` | |
| `find-product-remind` | |
| `import` | |
| `interview` | |
| `notify` | |
| `office-hours` | |
| `plan` | |
| `pua` | |
| `rag` | |
| `ralph` | |
| `review` | |
| `scope` | |
| `spec` | |
| `structure-thinking` | |
| `tdd` | |
| `team` | |
| `test-teams` | |
| `test` | |
| `ultraqa` | |
| `ultrawork` | |
<!-- /AUTO-COMMANDS -->

---

## 工作流程

### 阶段一：需求分析

```bash
/interview              # 开始需求访谈
```

- interviewer agent 进行深度访谈
- 8 维度完整度检查（业务理解、功能边界、技术可行性、数据流、接口契约、异常处理、非功能需求、部署交付）
- KANO 需求分类
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

- 任务拆解与依赖分析
- 里程碑定义
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

- 测试用例生成与执行
- 单元/集成/E2E 测试
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

- 构建与部署
- 生成交付包
- 包含完整文档和配置

### 阶段八：迭代优化

```bash
/reflect                # 反思学习
/learn                  # 提取学习模式
```

- 分析项目表现
- 提取可复用模式
- 更新知识库

---

<!-- AUTO-AGENTS -->
| Agent | 专长 |
|-------|------|
| interviewer | Requirements interview specialist |
| architect | Architecture design specialist |
| explorer | Code exploration and search specialist |
| planner | Strategic planning specialist |
| executor | Code implementation specialist |
| reviewer | Code review specialist |
| code-reviewer | Detailed code review specialist |
| qa-tester | QA and verification specialist |
| security-engineer | Security review specialist |
| devops-automator | Build, release, and deployment specialist |
| technical-writer | Documentation and handoff specialist |
| debugger | Debugging specialist |
<!-- /AUTO-AGENTS -->

详细说明请参考 [docs/AGENTS.md](docs/AGENTS.md)

---

## 目录结构

```
claude-studio/
├── README.md                 # 项目说明
├── CLAUDE.md                 # 系统提示词（全局配置）
├── ARCHITECTURE.md           # 架构文档
│
├── commands/                 # 斜杠命令 (25个)
│   ├── deep-interview.md     # 苏格拉底式访谈
│   ├── auto-interview.md     # 双Agent辩论
│   ├── office-hours.md       # 产品审视
│   ├── find-product-remind.md # 技能推荐
│   ├── structure_thinking.md  # 架构分析
│   ├── rag.md               # RAG设计
│   ├── test-teams.md        # 测试团队
│   ├── team.md              # 动态组队
│   ├── autopilot.md          # 全自动执行
│   ├── ralph.md             # 持久循环
│   ├── ultrawork.md         # 最大并行
│   ├── ultraqa.md           # QA循环
│   ├── notify.md            # 通知配置
│   ├── pua.md               # 激将激励
│   └── ...                  # 更多命令
│
├── skills/                   # 技能库
│   ├── agents/              # 专家Agent (10个)
│   │   ├── software-architect/
│   │   ├── senior-developer/
│   │   ├── code-reviewer/
│   │   ├── security-engineer/
│   │   ├── backend-architect/
│   │   ├── frontend-developer/
│   │   ├── devops-automator/
│   │   ├── data-engineer/
│   │   ├── technical-writer/
│   │   └── sre/
│   ├── rag-design/          # RAG设计知识
│   ├── notifications/       # 通知系统
│   └── ...                  # 更多技能
│
├── docs/                     # 文档
│   ├── COMMANDS.md          # 命令索引
│   ├── AGENTS.md            # Agent索引
│   └── ...
│
└── .omc/                    # OMC配置
    └── specs/               # 规格文档
```

---

## 触发词速查

| 输入 | 行为 |
|------|------|
| `开始访谈` | 进入访谈模式 |
| `导入项目` | 导入现有项目 |
| `分析项目` | 分析项目架构 |
| `设置范围` | 管理开发边界 |
| `快速开始` | 跳过访谈进入规格阶段 |

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

---

## 跨平台支持

本插件完全支持 **Windows、macOS、Linux**。

所有脚本使用 Node.js 实现，兼容性最佳。

---

## 许可证

MIT License

---

## 相关文档

- [架构文档](ARCHITECTURE.md) - 系统架构详解
- [命令索引](docs/COMMANDS.md) - 所有命令快速参考
- [Agent 索引](docs/AGENTS.md) - 所有专家 Agent 目录
- [规格模板](docs/spec-template.md) - 规格文档模板
- [部署指南](docs/deployment-guide.md) - 部署配置指南
