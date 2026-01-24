# Claude Studio

> **版本：** v1.9.0 | 基于 Claude Code 的全流程 AI 结对开发工作站

融合了规格驱动开发、Agent 体系、自动化 Hooks、持续学习机制，覆盖从需求分析到项目交付的完整开发流程。

---

## 核心理念

**全流程驱动开发（Full-Stack Driven Development）**：

```
需求访谈 -> 需求规格 -> 实现计划 -> 编码实现 -> 测试验证 -> 代码审查 -> 打包交付 -> 迭代优化
     ↓          ↓            ↓             ↓              ↓             ↓            ↓            ↓           ↓
  interviewer  architect   planner  coder   tester   reviewer  devops  optimizer
```

---

## 快速开始

### 本地使用

本项目已作为本地工作区配置，无需安装插件。直接在当前目录下使用即可。

### 目录结构

```
claude-studio/
├── README.md                 # 项目说明
├── CLAUDE.md                 # 系统提示词（全局配置）
├── agents/                   # 专用 AI Agent
├── skills/                   # 技能库（领域知识）
├── projects/                 # 项目存放区
├── commands/                 # 斜杠命令
├── rules/                    # 全局规则
├── contexts/                 # 上下文注入
├── docs/                     # 文档
└── memory-bank/              # 记忆库
```

---

## 核心 Agents (10 个)

| Agent | 路径 | 职责 |
|-------|------|------|
| interviewer | `agents/interviewer.md` | 需求访谈专家 |
| architect | `agents/architect.md` | 架构设计专家 |
| planner | `agents/planner.md` | 实现计划专家 |
| coder | `agents/coder.md` | 编码专家 |
| tester | `agents/tester.md` | 测试专家 |
| reviewer | `agents/reviewer.md` | 代码审查专家 |
| security-reviewer | `agents/security-reviewer.md` | 安全审计专家 |
| devops | `agents/devops.md` | DevOps 交付专家 |
| optimizer | `agents/optimizer.md` | 迭代优化专家 |
| debug-helper | `agents/debug-helper.md` | 调试助手 |

---

## 可用 Skills (44 个)

### 核心工作流技能 (6 个)

| Skill | 用途 |
|-------|------|
| claude-skills | 创建/验证新 Skill |
| skill-creator | 智能 Skill 创建器 |
| requirement-analysis | 需求分析方法和模板 |
| spec-writing | 规格文档编写规范 |
| tdd-workflow | TDD 工作流程 |
| continuous-learning | 持续学习机制 |

### 领域技能 - 开发 (9 个)

| Skill | 用途 |
|-------|------|
| frontend-patterns | 前端开发模式 |
| frontend-design | 前端设计美学 |
| nextjs | Next.js 全栈框架 |
| backend-patterns | 后端开发模式 |
| fastapi-backend | FastAPI 后端开发 |
| java-spring | Java Spring Boot |
| go-patterns | Go 开发模式 |
| rust-patterns | Rust 开发模式 |
| database-design | 数据库设计 |

### 领域技能 - 架构与部署 (6 个)

| Skill | 用途 |
|-------|------|
| api-design | API 设计 |
| graphql | GraphQL API |
| mcp-builder | MCP 服务构建 |
| git-workflow | Git 工作流 |
| kubernetes | Kubernetes 部署 |
| devops-delivery | 应用交付 |

### 领域技能 - 数据处理 (4 个)

| Skill | 用途 |
|-------|------|
| ray-data | Ray 分布式数据处理 |
| preprocessing-data-with-automated-pipelines | 数据预处理管道 |
| vector-search | 向量检索（FAISS/Milvus/Qdrant） |
| graph-rag | 知识图谱与 RAG |

### 领域技能 - AI/ML (7 个)

| Skill | 用途 |
|-------|------|
| langchain-arch | LangChain 架构 |
| langgraph-workflows | LangGraph 工作流 |
| fine-tuning-with-trl | 模型微调（SFT/DPO/PPO） |
| agent-eval | AI Agent 评估体系 |
| nlp-pipeline | NLP 管道（分词/NER/摘要/情感/分类/关系抽取） |
| computer-vision | 计算机视觉（图像分类/检测/OCR/分割/风格迁移） |
| embedding-generation | Embedding 训练（文本/图像/多模态/对比学习） |

### 领域技能 - 推荐系统 (2 个)

| Skill | 用途 |
|-------|------|
| ecommerce-recommender | 电商推荐系统（协同过滤/向量检索/重排序） |
| user-profiling | 用户画像（行为分析/兴趣标签/RFM/分群） |

### 领域技能 - 质量与测试 (4 个)

| Skill | 用途 |
|-------|------|
| code-review | 代码审查 |
| security-review | 安全审查 |
| performance-tuning | 性能调优 |
| webapp-testing | Web 应用测试 |

### 领域技能 - 文档处理 (4 个)

| Skill | 用途 |
|-------|------|
| pdf-skills | PDF 读写、合并、OCR |
| docx | Word 文档创建、编辑 |
| scientific-writing | 科学写作（IMRAD/引用/图表） |
| bioinformatics-manuscript-reviewer | 生物信息学论文审稿 |

### 领域技能 - 其他 (2 个)

| Skill | 用途 |
|-------|------|
| prompt-engineering | 提示词工程 |
| customer-service-expert | 客服 UX 专家 |

---

## Projects 目录

`projects/` 目录用于存放独立项目，避免根目录混乱。

### 目录结构规范

```
projects/<project-name>/
├── README.md              # 项目说明
├── CLAUDE.md            # 项目级配置
├── .env.example         # 环境变量模板
├── docs/               # 设计文档/架构图
├── src/               # 源代码
├── tests/              # 测试代码
├── scripts/            # 构建脚本
├── data/               # 数据文件
├── models/              # 模型文件
├── outputs/            # 输出结果
└── logs/               # 运行日志
```

### 项目生命周期

```
启动阶段 -> 创建 projects/<name>/ 目录
开发阶段 -> 在 projects/<name>/src/ 中编码
交付阶段 -> 使用 devops-delivery 技能构建和部署
维护阶段 -> 使用 continuous-learning 技能从使用中学习
归档阶段 -> 项目完成后，使用 docx 或 pdf-skills 生成技术文档
```

---

## 触发词速查

### 约定触发（文本触发）

| 输入 | 行为 |
|------|------|
| `开始访谈` | 进入需求访谈模式 |
| `写规格` | 生成规格文档 |
| `做计划` | 创建实现计划 |
| `开始编码` | 进入编码模式 |
| `做测试` | 运行/生成测试 |
| `代码审查` | 代码审查 |
| `安全审查` | 安全审查 |
| `构建` | 构建项目 |
| `部署` | 部署项目 |
| `打包` | 打包交付 |
| `反思` | 反思学习 |
| `学习` | 提取学习模式 |
| `快速开始` | 跳过访谈，直接开始 |
| `跳过访谈` | 跳过访谈，直接开始 |
| `检查技能` | 检测新技能 |

### 内置命令（Claude Code 原生命令）

| 命令 | 说明 |
|--------|------|
| `/doctor` | 运行诊断检查 |
| `/help` | 显示帮助信息 |
| `/commit` | 创建 git commit |
| `/clear` | 清除对话历史 |

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

## 工作流程详解

### 阶段一：需求分析

```
开始访谈 -> interviewer agent 进行深度访谈 -> 8 维度完整度检查
```

### 阶段二：规格设计

```
写规格 -> architect agent 输出精细规格 -> 等待用户确认
```

### 阶段三：实现计划

```
做计划 -> planner agent 拆解任务 -> 识别依赖关系
```

### 阶段四：编码实现

```
开始编码 -> coder agent 按计划实现 -> 可选 TDD 模式
```

### 阶段五：测试验证

```
做测试 -> tester agent 生成测试 -> 执行单元/集成/E2E 测试
```

### 阶段六：代码审查

```
代码审查 + 安全审查 -> reviewer + security-reviewer -> 质量检查
```

### 阶段七：打包交付

```
构建 + 部署 + 打包 -> devops agent 处理构建部署
```

### 阶段八：迭代优化

```
反思 + 学习 -> optimizer agent 分析项目 -> 提取可复用模式
```

---

## 跨平台支持

本项目完全支持 **Windows、macOS、Linux**。

---

## 许可证

MIT License

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.9.0 | 2026-01-24 | 新增 8 个技能：vector-search、user-profiling、nlp-pipeline、computer-vision、time-series、embedding-generation、graph-rag |
| v1.0.0 | 初始版本 | 基础框架和核心技能 |
