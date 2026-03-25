# Claude-Studio：让 AI 成为真正的开发搭档

> **版本：** v3.1.0 | 更新日期：2026-03-25 | 多智能体软件开发工作台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 核心理念

Claude-Studio 不只是一个 AI 编程助手，而是一个完整的**开发流程管理系统**：

> **记忆系统 + 团队协作 + 质量门禁 + 流程引擎**

---

## 核心功能（30+ 命令）

### 创意工具箱

这些是在实践中摸索出来的独特工具：

| 命令 | 功能 | 亮点 |
|------|------|------|
| `/lyd-boss` | PUA 督导模式 | 任务追踪、进度激励、不达标不放行 |
| `/lyd-plan-review` | GAN 风格计划审查 | CEO + Architect 双视角，量化打分，80分门槛 |
| `/lyd-fro-review` | 前端对抗性审查 | Generator vs Evaluator，原创性 checklist |
| `/lyd-code-review` | 多角色代码审查 | 安全/性能/可维护性/架构，四维度独立评审 |
| `/lyd-reverse-architect` | 魔鬼代言人 | 挑战所有假设，识别隐藏风险 |
| `/lyd-cleaner` | AI Slop 清理器 | 回归安全，删除工作流 |

### 深度思考

| 命令 | 功能 | 亮点 |
|------|------|------|
| `/lyd-structure-thinking` | 架构思维分析 | 直接扫描代码，6 维度评估 |
| `/lyd-deep-interview` | 苏格拉底式访谈 | 数学模糊度门槛，需求结晶 |
| `/lyd-auto-interview` | 双 Agent 辩论 | 攻防交锋，暴露隐藏假设 |

### 执行引擎

| 命令 | 功能 | 亮点 |
|------|------|------|
| `/lyd-autopilot` | 全自动驾驶 | 零干预，idea 到代码 |
| `/lyd-ralph` | Ralph 循环 | 自我反思迭代，目标验证 |
| `/lyd-ultrawork` | 最大并行 | 高吞吐任务完成 |
| `/lyd-ultraqa` | QA 循环 | test→verify→fix 迭代 |
| `/lyd-sandbox` | 容器隔离执行 | 安全执行未知代码 |

### 团队协作

| 命令 | 功能 | 亮点 |
|------|------|------|
| `/lyd-team` | 动态组队 | analyst + executor + verifier 协同 |
| `/lyd-test-teams` | 测试团队 | 3 测试员 + 1 资深 |

### 开发者工具

| 命令 | 功能 | 亮点 |
|------|------|------|
| `/lyd-po` | 提示词优化器 | 自动调优提示词 |
| `/lyd-imapo` | 图片提示词工程师 | Midjourney/DALL-E 优化 |
| `/lyd-label` | GitHub Issue 自动标签 | P0/P1/P2 + bug/feature |
| `/lyd-sandbox` | 容器隔离 | Docker 容器安全执行 |

### 产品与需求

| 命令 | 功能 | 亮点 |
|------|------|------|
| `/lyd-office-hours` | 产品审视 | gstack 风格，深度拷问 |
| `/lyd-find-product-remind` | 技能推荐 | 智能检测缺失技能 |

---

## 团队协作管道

```
┌─────────────────────────────────────────────────────────┐
│                  团队协作管道                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  team-plan    →    team-exec    →    team-verify     │
│  (分析规划)         (执行任务)          (验证结果)        │
│       ↓                   ↓                ↓            │
│       └───────────────────┼────────────────┘            │
│                           ↓                             │
│                    team-fix (如需要)                      │
│                    (修复问题，最多3次)                    │
│                           ↓                             │
│                    complete / failed                     │
└─────────────────────────────────────────────────────────┘
```

### 团队角色

| 角色 | Agent | 职责 |
|------|-------|------|
| 监督者 | team-lead | 协调团队、跟踪进度 |
| 分析师 | analyst | 拆解需求、设计方案 |
| 执行者 | executor | 实现功能 |
| 验证者 | verifier | 检查质量 |
| 批评者 | critic | 挑战方案 |

---

## 状态与记忆系统

### 跨 Session 持久化

```
.omc/state/
├── sessions/{sessionId}/   # Session 级状态
└── team/{teamName}/        # 团队状态
    ├── tasks/              # 任务列表
    ├── workers/            # Worker 信息
    ├── shared-memory.json  # 共享内存
    └── events.jsonl        # 事件日志
```

### Notepad 共享笔记本

团队知识沉淀三区域：

- **Priority** - 高优先级上下文（自动加载）
- **Working** - 工作日志（7 天自动清理）
- **Manual** - 永久笔记

### 心跳与健康检测

- 30 秒心跳超时检测
- Worker 失联自动告警
- 任务重新分配

---

## 质量门禁

| 阶段 | 门槛 | 失败处理 |
|------|------|---------|
| plan→exec | 需要计划文档 | 阻塞直到达标 |
| exec→verify | 所有任务完成 | Fix 循环 |
| verify→complete | 80 分门槛 | 最多 3 次修复 |

### 代码审查评分

```
P0 (Critical): 安全漏洞、性能灾难、数据丢失风险
P1 (Important): 内存泄漏、并发问题、边界条件
P2 (Suggestion): 代码风格、重复代码、文档缺失
P3 (Info): 优化建议
```

---

## 为什么选择 Claude-Studio？

| 对比项 | 传统 AI | Claude-Studio |
|--------|---------|---------------|
| 上下文 | 单次会话 | 跨 Session 持久化 |
| 协作 | 单打独斗 | 团队分工 |
| 质量 | 依赖自觉 | 强制门禁 |
| 记忆 | 无 | 完整项目记忆 |
| 流程 | 随意 | 8 阶段管道 |
| 审查 | 自评 | 多角色对抗 |
| 迭代 | 手动 | 自动 Fix 循环 |

---

## 适用场景

### 复杂项目开发

多模块、多技术栈的项目需要：
1. 分析师拆解需求
2. 架构师设计方案
3. `/lyd-plan-review` 双视角审查
4. 团队并行实现
5. `/lyd-code-review` 多维度审查
6. Fix 循环直到达标

### 遗留项目维护

没有文档的老代码：
1. `/lyd-structure-thinking` 直接分析代码
2. 生成架构文档
3. `/lyd-reverse-architect` 识别风险

### 高要求代码审查

AI 自评有 bias，需要对抗：
1. `/lyd-fro-review` 前端 GAN 审查
2. `/lyd-code-review` 四角色独立评审
3. P0 问题必须修复

---

## 快速开始

```bash
# 安装
/plugin install claude-studio

# 团队协作
/lyd-team "构建电商后端"

# 计划审查
/lyd-plan-review

# 代码审查
/lyd-code-review

# 架构分析
/lyd-structure-thinking
```

---

## 目录结构

```
Claude-Studio/
├── commands/              # 30+ 斜杠命令
│   ├── lyd-*.md          # 18 个 lyd 系列命令
│   └── ...
├── agents/               # Agent 定义
│   └── team-agents.md    # 6 个团队 Agent
├── src/team/             # 团队协作核心
│   ├── pipeline.ts        # 5 阶段管道
│   ├── task-manager.ts    # 任务分发
│   ├── message-router.ts  # 消息传递
│   ├── heartbeat.ts       # 健康检测
│   ├── notepad.ts        # 共享笔记本
│   └── shared-memory.ts   # 共享内存
├── src/mcp/              # MCP 工具
│   └── state-tools.ts     # 状态管理
└── scripts/              # 工程化脚本
```

---

## Roadmap

- [ ] Web UI 可视化团队状态
- [ ] 更多专业化 Agent
- [ ] Git 深度集成
- [ ] 图形化流程配置

---

## 许可证

MIT License

---

**GitHub**: https://github.com/an8079/take-skills
