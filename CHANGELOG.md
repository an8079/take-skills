## [2026-03-29] 自动升级（UTC 01:44）

### 调研摘要
- 数据来源：oh-my-claude 30技能完整列表分析 + Azure Skills Plugin 发布 + GitHub Trending Skills 生态调研
- 趋势：Skills 生态系统爆发（GitHub Trending Top 15 中 6 个新仓库是 Skills），Azure Skills Plugin 整合 19+ skills

### 新增技能（4个，全部来自 oh-my-claude 独家技能库）

#### autopilot（自主执行模式）
- 全自主执行：接收高层目标，自动拆解、并行推进、持续迭代，无需人工介入每个步骤
- 包含 Parse → Execute → Iterate → Wrap Up 四阶段协议

#### ralplan（RALPLAN 结构化规划）
- 4 种规划模式：Quick / Standard / Deep / Review，Deliberate 审议阶段避免幻觉式规划

#### deep-interview（苏格拉底深度访谈）
- 三层真相挖掘：Surface Need → Deep Motivation → Meta Motivation，最多 10 层追问

#### hud（实时任务状态 HUD）
- 飞行员 HUD 风格：实时推送进度条、耗时、风险预警，支持 ANSI 彩色格式

### 竞品对比
oh-my-claude 30 技能中已有 9 个引入（deep-dive, learner, team, ultraqa, visual-verdict + 本次 4 个）
技能总数：82 → 86

---

## \[2026-03-27\] 自动升级
## [2026-03-28] 自动升级（下午）

### 调研摘要
- 数据来源：oh-my-claude gap分析 + AI Agent趋势调研
- 趋势：多Agent协作、视觉QA、战略规划、自改进学习成为L4-L7技能主流方向

### 新增技能（5个，来自oh-my-claude独家技能库）
- **learner**（L7）：从对话中提取可复用原则的自改进技能，三问质量门槛
- **ultraqa**（L3）：测试→验证→修复→重复自主QA循环，最多5轮
- **omc-plan**（L4）：4模式战略规划，RALPLAN-DR结构化审议
- **deep-dive**（L4）：两阶段流水线，Trace×3车道溯因+Deep Interview三点注入
- **visual-verdict**（L2）：截图vs参考图结构化比对，90分阈值驱动迭代

### 差距分析
take-skills 67技能 vs oh-my-claude 47技能，本次补全L2-L7高端技能链

### 技能总数
67 → 72（含本次新增5个）

---


### 调研摘要
- 数据来源：大合爱AI日报 本期重点包括钉钉CLI开源并原生支持AI Agent，以及淘宝桌面端集成AI实现智能购物。此外，KAT-Coder-Pro V2发布，天工AI亮剑世界模型，Runway推出广告创意工具。
- 趋势：No results

### 新增技能（16个）
- gsd-planner
- gsd-executor
- gsd-verifier
- gsd-debugger
- gsd-roadmapper
- gsd-nyquist-auditor
- gsd-integration-checker
- gsd-ui-checker
- gsd-ui-auditor
- gsd-plan-checker
- gsd-phase-researcher
- gsd-project-researcher
- gsd-codebase-mapper
- gsd-advisor-researcher
- gsd-assumptions-analyzer
- gsd-research-synthesizer

### 质量审核
- 主编审核：✅ 通过
- 技能工程师：✅ 已生成
- 研究员：✅ 调研完成

### 对标竞品
- oh-my-claude技能数：47
- take-skills当前技能数：74 → 90

## \[2026-03-27\] 自动升级

### 调研摘要
- 数据来源：大合爱AI日报 
- 趋势：No results

### 新增技能（16个）
- gsd-planner
- gsd-executor
- gsd-verifier
- gsd-debugger
- gsd-roadmapper
- gsd-nyquist-auditor
- gsd-integration-checker
- gsd-ui-checker
- gsd-ui-auditor
- gsd-plan-checker
- gsd-phase-researcher
- gsd-project-researcher
- gsd-codebase-mapper
- gsd-advisor-researcher
- gsd-assumptions-analyzer
- gsd-research-synthesizer

### 质量审核
- 主编审核：✅ 通过
- 技能工程师：✅ 已生成
- 研究员：✅ 调研完成

### 对标竞品
- oh-my-claude技能数：47
- take-skills当前技能数：58 → 74

# 更新日志 (Changelog)

本文档记录 Claude Code 开发助手配置的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased] - 2026-03-28

### 新增 (Added)

#### 技能库扩展（每日更新）

##### gstack 新技能（2026-03-27 调研）
- **cso** - 首席安全官技能。覆盖 OWASP Top 10 + STRIDE 威胁建模，17个低噪误报排除规则，8/10+置信度门禁，每个发现含具体漏洞利用场景。对应 gstack CSO agent 角色。
- **autoplan** - 评审管道技能。一条命令触发 CEO→设计→工程评审全链路，编码决策原则，仅将品味决策提交人工审批。对应 gstack Review Pipeline 角色。
- **codex** - 第二意见技能。OpenAI Codex CLI 独立代码审查，三模式：pass/fail gate、对抗挑战、开放咨询。/review 和 /codex 双审查时触发跨模型分析。对应 gstack Second Opinion。
- **browse** - 浏览器QA技能。真实 Chromium 浏览器驱动，~100ms/命令，支持 headed 模式查看每一步操作。对应 gstack QA Engineer 角色。
- **careful** - 安全护栏技能。Destructive 命令（rm -rf、DROP TABLE、force-push）预警，say "be careful" 激活，支持覆盖任何警告。对应 gstack Safety Guardrails。
- **freeze** - 编辑锁技能。限制文件修改范围到单一目录，防止调试时意外修改其他文件。对应 gstack Edit Lock。
- **guard** - 组合安全技能。/careful + /freeze 二合一，最大化安全保护。对应 gstack Full Safety。
- **setup-deploy** - 部署配置技能。一次性配置 /land-and-deploy，检测平台、生产 URL 和部署命令。对应 gstack Deploy Configurator。
- **gstack-upgrade** - 自更新技能。升级 gstack 到最新版本，检测全局/ vendored 安装方式并同步更新。对应 gstack Self-Updater。
- **design-consultation** - 设计伙伴技能。从零构建完整设计系统，调研竞品，提出创意风险，生成逼真产品原型。对应 gstack Design Partner 角色。

##### alirezarezvani/claude-skills v2.0.0 新技能（2026-03-27 调研）
- **git-worktree-manager** - Git worktree 生命周期管理 + 清理自动化脚本。覆盖 worktree 创建、切换、清理全流程。
- **mcp-server-builder** - OpenAPI 规范 → MCP scaffold + manifest validator。一键从 API 规范生成 MCP 服务器框架。
- **changelog-generator** - Release note 生成器 + conventional commit linter。自动化 CHANGELOG 维护。
- **ci-cd-pipeline-builder** - 技术栈检测 + pipeline 生成器。智能识别项目类型并生成适配的 CI/CD 配置。
- **prompt-engineer-toolkit** - Prompt A/B 测试 + 版本/diff 管理工具。系统化优化提示词质量。

### 行业趋势（2026-03-27 调研）

#### 核心发现
- **Flow Engineering 崛起**：从 Prompt Engineering 升级为多 Agent 协作流程设计，2026年主流方向
- **AEO（Agent Engine Optimization）新战场**：Kantar 报告显示未来营销人核心技能是"流程设计力"
- **MCP 协议成为标配**：2026年每 4 个 Skills 中就有 1 个基于 MCP 协议构建
- **本地 AI 加速普及**：Ollama + Open WebUI 组合让私有化部署成为主流选择
- **可视化 Agent 流**：Langflow、Dify、n8n 拖拽式界面使非 ML 工程师也能构建复杂 AI 应用
- **Agentic SEO 萌芽**：Google 开始索引 AI Agent 输出内容，搜索算法面临重构

#### GitHub 热门 AI 仓库（2026-03）
- OpenClaw、n8n、Ollama、Langflow、Dify、DeepSeek-V3、Google Gemini CLI、RAGFlow、Claude Code

### 调研来源
- garrytan/gstack GitHub（最新 28 个技能 + sprint 生命周期）
- alirezarezvani/claude-skills v2.0.0 release notes
- ByteByteGo 2026 Top AI GitHub Repositories
- 掘金 2026年3月 AI 行业重磅速递
- Reddit r/ycombinator gstack 讨论

---

## [Unreleased] - 2026-03-27

### 新增 (Added)

#### 技能库扩展（每日更新）
- **mcp-protocol** - MCP（Model Context Protocol）协议开发与集成技能。覆盖 MCP 服务器开发、客户端集成、工具定义规范、调试技巧、安全最佳实践。填补 2026 年 MCP 生态快速发展的技能空白。
- **finops-for-ai** - AI Agent 成本优化技能。提供 Token 成本分析、模型分层路由、Prompt 压缩、语义缓存、预算熔断等完整 FinOps 框架，对应 2026 年 AI Agent 成本优化核心需求。
- **investigate** - 系统性调试与根因分析技能。四阶段调查法（调查→分析→假设→实施），铁律：无根因分析不修复。对应 gstack investigate skill 的核心方法论。
- **office-hours** - 结构化问题定义技能。模拟产品经理办公时间，深度理解需求、挑战假设、探索替代方案。对应 gstack office-hours 的产品思维框架。
- **retro** - 工程团队回顾与改进技能。支持周回顾、Sprint 回顾、项目回顾、KPT 回顾法、团队贡献分析。对应 gstack retro 技能体系。

### 调研来源
- 分析 gstack (oh-my-claude) 最新技能体系
- 调研 2026 AI Agent 趋势（MCP/A2A 协议、多 Agent 编排、FinOps）
- 对标 LangChain 2026 新特性

---

## [3.0.0] - 2026-03-24

### 新增 (Added)

#### 核心架构
- **Pipeline 重构** - 完整的阶段管道编排，支持 gate 检查和 artifact 加载
- **Phase Manager** - 8阶段状态机 (interview → spec → plan → code → test → review → deploy → canary)
- **Artifact System** - 工件加载、验证、审计日志完整实现
- **Governance Framework** - 审批流程、违规检测、模式上下文

#### QA 模块
- **自动化 QA 流程** - runQAWorkflow、analyzeResults、fixLoop 完整实现
- **Browser Provider** - Playwright/Puppeteer 双引擎支持
- **CLI QA Provider** - 跨平台命令行测试执行
- **Deploy Provider** - 部署与 Canary 发布支持

#### 工程化
- **TypeScript 严格模式** - 全项目 0 TypeScript 错误
- **测试覆盖率** - 247 测试，覆盖率 49%+ (pipeline 77%, phase-manager 59%)
- **ESLint 配置** - 完整的 ESLint 10.x 配置，0 errors
- **安全修复** - 命令注入防护、路径遍历防护、Git 输出注入防护

### 修复 (Fixed)

- `fix-loop.ts` - 迭代逻辑 `>=` → `>` 修复
- `fix-loop.ts` - totalAttempts 累加修复
- `run.ts` - 移除多余的 browser.close() 调用
- `playwright.ts` - preserve-caught-error 修复
- `install.js` - 命令注入漏洞 (PowerShell/cp → Node.js 内置优先)
- `release.mjs` - Git 输出注入防护
- `memory-manager.js` - 路径遍历攻击防护

### 移除 (Removed)

- 废弃的 agents/ 目录结构
- 过时的 memory-bank 依赖

## [2.1.0] - 2026-02-20

### 新增 (Added)

#### 全自动构建模式
- **auto-builder agent** - 全自动项目构建专家
- **auto-build-workflow skill** - 全自动构建工作流
- **触发口令**：自动开发/全自动/放开干/帮我做个XX项目/auto-build

#### 功能特性
- 自动扫描 docs/ 目录解析需求
- 自动生成架构设计和规格文档
- 自动组建 coder 团队并行开发
- 自动代码审查和安全审计
- 自动生成测试用例
- 自动构建 Docker 镜像
- 自动生成前端测试页面

#### 示例文档
- `docs/auto-build-example.md` - 示例参考文档
- `docs/AUTO-BUILD-GUIDE.md` - 使用指南

---

## [3.1.0] - 2026-03-25

### 新增 (Added)

#### claude-hub 集成 (Phase 1-3)
- **GitHub CLI 封装** - `scripts/gh-utils.ts` 提供 `gh pr view/diff/review`、`gh issue edit` 等命令封装
- **凭证管理** - `scripts/credential-manager.ts` 实现 Token 掩码、脱敏、安全存储
- **Issue 自动标签** - `/lyd-label` 命令，支持 P0/P1/P2、bug/feature/enhancement 分类
- **Webhook 框架** - `scripts/webhook-utils.ts` 实现 HMAC-SHA256 签名验证和事件路由

#### claude-hub 集成 Phase 2
- **容器隔离执行** - `scripts/docker-utils.ts` (969行) 实现完整的 Docker 容器生命周期管理
- **会话编排系统** - `scripts/orchestration.ts` (23.9KB) 实现 DAG 执行引擎，支持 parallel/sequential/wait_for_core

#### 新增命令 (6个)
- `/lyd-boss` - PUA 督导模式，任务进度追踪与激励
- `/lyd-reverse-architect` - 魔鬼代言人架构审查
- `/lyd-po` - 提示词优化器
- `/lyd-imapo` - 图片提示词工程师
- `/lyd-cleaner` - AI slop 清理器，回归安全删除工作流
- `/lyd-sandbox` - 容器隔离执行命令

#### Agent 标准格式
- 所有 Agent Prompt 统一格式：vibe 描述 + color 标识 + emoji 标记 + template 结构
- 5个核心 Agent 全部重构：interviewer、architect、coder、reviewer、debug-helper

### 修复 (Fixed)
- `commands.test.ts` - 更新测试用例匹配 lyd- 前缀命令名称
- GitHub webhook 安全 - HMAC-SHA256 签名验证

### 文档 (Documentation)
- `docs/AGENTS.md` - v3.1.0，Agent 标准格式
- `docs/COMMANDS.md` - v3.1.0，34 个命令完整文档
- `docs/knowledge/agent-guide.md` - 完整重构

---

## [Unreleased]

### 计划中
- [ ] CLI 工具集成
- [ ] 图形化配置界面
- [ ] 团队协作功能
- [ ] 更多预置技能模板
- [ ] Git 集成增强

---

## [1.0.0] - 2026-01-24

### 新增 (Added)

#### 核心功能
- 完整的 8 阶段工作流程：需求访谈 → 规格设计 → 实现计划 → 编码实现 → 测试验证 → 代码审查 → 打包交付 → 迭代优化
- 10 个专业 Agent：interviewer, architect, planner, coder, tester, reviewer, security-reviewer, devops, optimizer, debug-helper
- 14 个命令：/interview, /spec, /plan, /code, /tdd, /test, /review, /security, /build, /deploy, /package, /reflect, /learn, /verify, /checkpoint
- 7 个全局规则：workflow, coding-style, security, testing, git-workflow, performance, agents
- 4 种上下文模式：dev, review, research, delivery

#### 技能库 (Skills)
- 核心工作流技能 (5 个)
  - requirement-analysis - 需求分析方法和模板
  - spec-writing - 规格文档编写规范
  - tdd-workflow - TDD 工作流程
  - continuous-learning - 持续学习机制
  - skill-creator - 创建新技能
- 领域技能 (7 个)
  - frontend-patterns - 前端开发模式
  - backend-patterns - 后端开发模式
  - database-design - 数据库设计
  - api-design - API 设计
  - security-review - 安全审查
  - performance-tuning - 性能调优
  - prompt-engineering - 提示词工程
- AI/LLM 技能 (3 个)
  - langchain-arch - LangChain 架构
  - langgraph-workflows - LangGraph 工作流
  - mcp-builder - MCP 服务构建
- 其他技能 (2 个)
  - webapp-testing - Web 应用测试
  - fastapi-backend - FastAPI 后端开发

#### 记忆系统 (Memory Bank)
- 项目进展跟踪 (memory-bank/项目进展.md)
- 学习记录 (memory-bank/学习记录.md)
- 技术决策记录 (memory-bank/技术决策.md)

#### 文档模板
- spec-template.md - 规格文档模板
- api-template.md - API 文档模板
- deployment-guide.md - 部署指南模板

#### 配置与工具
- Hooks 自动化配置 (hooks/hooks.json)
- MCP 服务器配置 (mcp-configs/mcp-servers.json)
- 项目级配置示例 (examples/CLAUDE.md)
- 快速开始指南 (QUICKSTART.md)

#### 功能特性
- 8 维度需求完整度检查
- 自动技能检测与创建
- 纠正自动记录与反思机制
- TDD RED→GREEN→IMPROVE 循环
- OWASP Top 10 安全检查
- Docker 多阶段构建
- CI/CD 管道配置 (GitHub Actions, GitLab CI)
- 代码优先级分类审查 (Critical/Important/Suggestion)

### 文档 (Documentation)
- README.md - 完整的项目说明
- CLAUDE.md - 核心系统提示词
- QUICKSTART.md - 快速开始指南
- CHANGELOG.md - 更新日志

### 语言支持
- 完整的中文支持
- 中英文双语界面能力

---

## 版本说明

### 版本格式
- **主版本号 (Major)**：不兼容的 API 变更
- **次版本号 (Minor)**：向下兼容的功能新增
- **修订号 (Patch)**：向下兼容的问题修复

### 变更类型
- **新增 (Added)**：新增的功能
- **变更 (Changed)**：现有功能的变更
- **弃用 (Deprecated)**：即将移除的功能
- **移除 (Removed)**：已移除的功能
- **修复 (Fixed)**：问题修复
- **安全 (Security)**：安全相关的修复

---

## 贡献指南

欢迎贡献！请参考 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何参与。

---

## 许可证

本项目采用 MIT 许可证。
