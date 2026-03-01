# 更新日志 (Changelog)

本文档记录 Claude Code 开发助手配置的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

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
