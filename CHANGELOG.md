# 更新日志 (Changelog)

本文档记录 Claude Code 开发助手配置的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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
