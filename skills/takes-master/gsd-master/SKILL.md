---
name: takes-master
description: takes (Take It Away, Ship It!) AI驱动开发框架主技能。当用户要求启动新项目、制定开发计划、执行任务、验证结果，或要求AI像CEO一样思考、进行苏格拉底式提问、使用团队协作等场景时触发。此技能将Claude Code转化为GSD驱动的专业开发Agent，自动最大化get-shit-done工作流的能力。适用场景：(1) 启动全新项目并制定路线图 (2) 对已有项目进行代码库分析和规划 (3) 分阶段执行开发任务 (4) 验证和修复问题 (5) 使用CEO/OM-team/苏格拉底等视角进行深度思考 (6) 将GSD工作流与oh-my-claude、gstack等辅助技能协同使用。
---

# GSD Master — AI驱动开发主技能

## 核心定位

本技能将 Claude Code 打造成 **GSD驱动的专业开发Agent**，以 get-shit-done (GSD) 工作流为核心方法论，oh-my-claude 和 gstack 为辅助插件，覆盖从项目启动到交付的完整开发周期。

**三层插件体系：**

```
primary:   GSD (get-shit-done)    — 结构化执行方法论，强制计划-执行-验证循环
secondary: oh-my-claude (omc)     — Claude Code原生能力增强，团队协作
tertiary:  gstack                 — 特定能力补充（Socratic/CEO等视角）
```

---

## 命令速查

### 新项目
- `/takes:new-project`        — 初始化项目，生成 PROJECT.md + ROADMAP.md
- `/takes:map-codebase`       — 扫描已有代码库，创建内部映射
- `/takes:help`               — 显示完整帮助

### 阶段管理
- `/takes:add-phase`          — 添加新阶段
- `/takes:plan-phase <N>`     — 为阶段N制定任务计划
- `/takes:execute-phase <N>`  — 执行阶段N
- `/takes:verify-work <N>`     — 验证阶段N是否满足要求
- `/takes:plan-fix <N>`       — 针对阶段N验证失败生成修复方案

### 进度与状态
- `/takes:progress`           — 查看整体项目进度
- `/takes:pause-work`         — 暂停工作并保存上下文
- `/takes:resume-work`        — 恢复暂停的工作
- `/takes:list-assumptions`   — 查看当前假设

### 团队协作
- `/takes:discuss-phase <N>`  — 团队深度讨论阶段N
- `/takes:set-ai <name>`      — 切换AI平台（Claude/Copilot等）

---

## GSD核心命令详解

### 1️⃣ 启动新项目

触发条件：用户要求开始一个全新开发项目，或在空白目录启动。

**执行流程：**

```
第一步：/takes:new-project
  → 分析用户需求，明确项目类型、目标、约束
  → 使用 gsd-project-researcher 并行研究4个方向
  → 使用 gsd-research-synthesizer 综合研究结果
  → 使用 gsd-roadmapper 生成 ROADMAP.md
  → 生成 PROJECT.md（项目概述、目标、技术栈）
  → 生成 .planning/STATE.md（初始状态）
  → Git commit: "feat: 项目初始化"

第二步：/takes:map-codebase（如已有代码）
  → 使用 gsd-codebase-mapper 扫描代码库
  → 生成 .planning/codebase/（ARCHITECTURE.md / STACK.md / CONVENTIONS.md）
  → 分析技术债务和风险点
  → Git commit: "docs: 代码库映射"

第三步：/takes:plan-phase 1
  → 使用 gsd-phase-researcher 研究阶段1技术实现
  → 使用 gsd-planner 生成详细任务计划
  → 使用 gsd-plan-checker 验证计划质量（10维度）
  → 生成 phases/1-name/PLAN.md
  → Git commit: "feat: 阶段1计划"
```

**PLAN.md 标准格式：**

```markdown
# 阶段1: [阶段名称]

## 成功标准（Goal-Backward）
必须TRUE的是什么？
1. [具体标准]

## 任务列表
- [ ] TASK-1.1: [任务名称] (wave: 1)
- [ ] TASK-1.2: [任务名称] (wave: 1, deps: TASK-1.1)

## 偏差处理规则
- 自己修：规则1-3（语法/逻辑/小bug）
- 停下来问：规则4（需求不清/架构决策）
```

---

### 2️⃣ 执行阶段

触发条件：用户要求开始执行，或阶段计划已制定完毕。

**标准执行流程：**

```
/takes:execute-phase <N>

第一步：读取阶段计划
  → 读取 .planning/phases/N-name/PLAN.md
  → 读取 .planning/ROADMAP.md

第二步：逐 wave 执行任务
  → wave内任务可并行（gsd-executor）
  → 每个任务完成后立即 git commit（原子提交）
  → checkpoint:human-verify（大任务后暂停等待确认）

第三步：偏差处理
  if 问题类型 in [语法错误, 逻辑bug, 小bug]:
      → gsd-executor 自主修复
  elif 问题类型 in [需求不清, 架构决策, 假设冲突]:
      → 暂停，询问用户决策 → 记录到 CONTEXT.md
  else:
      → gsd-debugger 介入

第四步：gsd-verifier 验证
  → 四层验证：存在性 → 实质性 → 连线 → 数据流
  → 生成 VERIFICATION.md

第五步（如需要）：gsd-nyquist-auditor 补全测试
  → 按覆盖率gap生成测试用例
  → 3次调试上限，超出则上报

Git commit: "feat: 完成阶段N"
```

---

### 3️⃣ 验证与修复

触发条件：用户要求验证阶段成果，或执行后自动触发。

**验证流程（gsd-verifier）：**

```markdown
## 四层验证

### L1: 存在性验证
必须存在的文件/功能是否都存在？

### L2: 实质性验证
每个文件/功能是否真正实现了计划要求？

### L3: 连线验证
各模块之间的接口调用是否正确连接？

### L4: 数据流验证
数据是否按预期正确流转？

## 输出格式
验证报告 → VERIFICATION.md
  - ✅ 通过项
  - ❌ 失败项：[具体问题] → [修复建议]
  - ⚠️ 警告项：[潜在风险]
```

---

### 4️⃣ 视角切换（gstack 辅助能力）

在特定场景自动切换视角，提升决策质量：

| 场景 | 视角 | gstack命令 |
|------|------|-----------|
| 架构决策前 | **CEO视角** | 成本/收益/风险/时间框 |
| 需求模糊时 | **苏格拉底提问** | 5个连续为什么 |
| 技术方案讨论 | **Socratic质疑** | 假设-证据-反驳 |
| 团队评审 | **omc-team** | 多角色并发讨论 |
| 错误调试 | **调查模式** | 5个为什么 + 证据链 |
| 项目回顾 | **KPT法** | Keep/Problem/Try |

**CEO视角 Prompt 模板：**

```
你是CEO视角。评估这个决策：
- 投入成本：开发时间/资源
- 预期收益：业务价值/用户增长
- 风险敞口：技术风险/依赖风险
- 时间窗口：上线deadline
- 竞争壁垒：护城河是什么

给出明确结论：[采用/否决/暂缓]+理由
```

**苏格拉底提问 Prompt 模板：**

```
使用苏格拉底提问法深入分析这个问题：
1. [基础问题] 这个说法的依据是什么？
2. [假设问题] 我们假设了什么前提？这些前提成立吗？
3. [证据问题] 支持这个结论的证据是什么？
4. [替代问题] 有没有其他可能的解释？
5. [后果问题] 如果错了，后果是什么？

结论：经过苏格拉底质疑后的核心认识。
```

---

### 5️⃣ 团队协作模式（oh-my-claude扩展）

当阶段复杂度高或存在多个技术方案时，启动omc-team协作：

```
/takes:omc-team <phase>

1. 任命3个角色并发讨论：
   - 激进派：提出创新方案，追求速度
  . 保守派：审查风险，提出质疑
   - 务实派：平衡前两者，给出折中建议

2. 各角色独立思考后，合并观点

3. 达成共识或提交用户决策

4. 决策记录到 CONTEXT.md
```

---

### 6️⃣ Checkpoint协议

长任务或关键节点暂停，等待人工确认：

```markdown
## Checkpoint 类型

checkpoint:human-verify
  → 暂停，显示当前状态
  → 等待用户确认后继续

checkpoint:decision
  → 暂停，列出决策选项
  → 用户选择后继续

checkpoint:commit
  → 立即git commit，保存状态
  → 等待继续指令
```

---

## 与 oh-my-claude / gstack 的协同策略

### 何时使用 oh-my-claude（omc）

| 场景 | omc能力 |
|------|---------|
| 需要多角色并发讨论 | omc-team |
| 需要Claude原生技能增强 | /om:review, /om:explain |
| 需要特定工具（如浏览器/MCP） | 内置工具直接使用 |
| 需要团队知识库 | omc-knowledge |

### 何时使用 gstack

| 场景 | gstack能力 |
|------|-----------|
| 复杂问题根源分析 | investigate（5个为什么）|
| 项目/周/Sprint回顾 | retro（KPT法）|
| 问题探索和方案评估 | office-hours |
| CEO视角成本评估 | role:CEO |
| Socratic质疑 | role:Socratic |

---

## 状态文件规范

```
.planning/                          # GSD状态根目录
├── STATE.md                        # 当前状态：位置/性能/决策
├── ROADMAP.md                      # 阶段路线图
├── REQUIREMENTS.md                  # 需求可追溯性
├── CLAUDE.md                       # 项目规范（自动生成）
├── phases/
│   ├── 1-name/
│   │   ├── PLAN.md                 # 任务计划
│   │   ├── SUMMARY.md              # 执行总结
│   │   ├── VERIFICATION.md          # 验证报告
│   │   ├── CONTEXT.md               # 用户决策锁定
│   │   └── RESEARCH.md             # 研究资料
│   └── 2-name/
│       └── ...
└── codebase/
    ├── ARCHITECTURE.md
    ├── STACK.md
    ├── CONVENTIONS.md
    └── CONCERNS.md
```

---

## 参考文件

详细命令用法、视角模板、验证标准请查看 references/ 目录：

- **references/commands.md** — 所有GSD命令的完整用法和示例
- **references/perspectives.md** — CEO/苏格拉底/Socratic等视角的完整Prompt模板
- **references/verification.md** — 四层验证标准的详细检查清单
- **references/gsd-vs-harness.md** — GSD工作流 vs 传统Harness工程的对比和使用场景
