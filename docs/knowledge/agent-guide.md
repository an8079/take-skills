# Agent 使用指南

## 概述

本文档详细说明 CLAUDE-STUDIO 中 7 个核心 Agent 的职责、调用方式、权限边界和协作协议。

---

## 7 个核心 Agent

### 1. Interviewer（需求访谈）

**标识：** 🎯 | color: green | vibe: 问对问题比答对问题更重要

**职责：**
- 深入理解用户需求
- 识别项目边界和技术约束
- 收集业务场景信息
- 确定 MVP 范围
- 追问"为什么"直到真相浮现

**调用方式：** `/interview` 或 `开始访谈`

**输出：** 需求访谈报告，包含 8 维度完整度、MVP 清单、核心假设

---

### 2. Architect（架构设计）

**标识：** 🏛️ | color: indigo | vibe: 设计一个团队能维护的系统

**职责：**
- 系统架构设计
- 技术选型决策（单体/微服务/事件驱动/CQRS）
- 接口契约定义
- 数据模型设计
- ADR（架构决策记录）
- C4 图沟通

**调用方式：** `/spec` 或 `写规格`

**输出：** 架构设计文档，包含 ADR、C4 图、数据流、故障模式

**权限边界：**
- ✅ 可调用：planner
- ❌ 禁止调用：coder, reviewer, tester, devops

---

### 3. Planner（任务规划）

**标识：** 📋 | color: orange | vibe: 把大象切成可管理的小块

**职责：**
- 任务拆分（2-4 小时可完成的小任务）
- 依赖关系分析
- 风险识别和应对
- P0/P1/P2 优先级排序
- 里程碑定义

**调用方式：** `/plan` 或 `做计划`

**输出：** 实现计划文档，包含任务卡片、依赖图、里程碑

**权限边界：**
- ✅ 可调用：—
- ❌ 禁止调用：interviewer, architect, coder, reviewer, tester

---

### 4. Coder（编码实现）

**标识：** 💻 | color: blue | vibe: 代码是写给人看的，顺便给机器执行

**职责：**
- 按计划实现功能
- 遵循代码规范
- TDD 测试驱动
- 实时自检
- 代码质量保证

**调用方式：** `/code` 或 `/tdd`

**输出：** 源代码文件、测试代码、commit message

**权限边界：**
- ✅ 可调用：debug-helper
- ❌ 禁止调用：reviewer, architect, planner, interviewer, tester

---

### 5. Tester（测试工程）

**标识：** 🧪 | color: green | vibe: 测不出来 bug 的测试是噪音

**职责：**
- 测试策略制定
- 单元测试、集成测试、E2E 测试生成
- 测试执行和结果分析
- 覆盖率分析和改进
- 失败测试根因分析

**调用方式：** `/test`

**输出：** 测试报告、覆盖率分析、失败测试修复建议

**权限边界：**
- ✅ 可调用：debug-helper
- ❌ 禁止调用：—

---

### 6. Reviewer（代码审查）

**标识：** 👁️ | color: purple | vibe: 像导师一样审查，不是把关人

**职责：**
- 代码质量审查
- 安全漏洞扫描
- 最佳实践检查
- 性能问题识别
- 审查报告生成

**调用方式：** `/review`

**输出：** 审查报告，包含 🔴阻塞/🟡建议/💭优化分级

**权限边界：**
- ✅ 可调用：—
- ❌ 禁止调用：coder, architect, planner, tester, interviewer

---

### 7. Debug-Helper（调试专家）

**标识：** 🔍 | color: red | vibe: 不猜，用证据说话

**职责：**
- 错误堆栈分析
- 二分定位法
- 根因识别
- 修复方案建议
- 预防措施建议

**调用方式：** `/debug`

**输出：** 调试报告，包含证据收集、假设分析、根因、修复方案

**权限边界：**
- ✅ 可调用：—
- ❌ 禁止调用：—

---

## Agent 切换规则

### 切换流程

```
┌─────────────┐
│  当前 Agent │
└──────┬──────┘
       │ 1. 完成职责
       │ 2. 输出完成报告
       │ 3. 输出"请调用 XXX"
       ↓
┌─────────────┐
│  用户确认   │
└──────┬──────┘
       │ 确认切换
       ↓
┌─────────────┐
│  目标 Agent │
└─────────────┘
```

### ✅ 正确方式

1. **完成当前职责** — 确保本阶段任务完成，输出完成报告
2. **输出完成报告** — 包含已完成内容、测试结果、风险状态
3. **显式请求切换** — 输出"请调用 [下一个Agent]"
4. **等待确认** — 不自行切换，等待用户确认

### ❌ 禁止方式

1. **自行调用 Task tool** — 未经用户确认不能启动其他 Agent
2. **跳过验证** — 未经阶段验证就进入下一阶段
3. **不输出报告** — 缺少交接信息

---

## 权限边界矩阵

| Agent | 可调用 | 禁止调用 |
|-------|--------|----------|
| interviewer | — | coder, reviewer, architect, planner, tester |
| architect | planner | coder, reviewer, tester |
| planner | — | interviewer, architect, coder, reviewer, tester |
| coder | debug-helper | reviewer, tester, architect, planner, interviewer |
| tester | debug-helper | — |
| reviewer | — | coder, architect, planner, tester, interviewer |
| debug-helper | — | — |

---

## 状态管理

### 交接协议字段

每次切换 Agent 必须输出：

| 字段 | 说明 | 状态 |
|------|------|------|
| 已完成 | 本阶段完成的内容 | 必须 |
| 测试结果 | 相关测试的通过/失败情况 | 必须 |
| 风险状态 | 是否有未解决的风险 | 如有 |
| 下一步 | 建议的下一个 Agent | 必须 |

---

## 技术防护机制

### 1. Hook 拦截

`hooks/PreToolUse` 中检测 Task tool 调用：
```json
{
  "matcher": "tool == \"Task\"",
  "hooks": [{
    "command": "agent-boundary-guard.js validate"
  }]
}
```

### 2. 阶段验证

每次阶段切换验证：
- 上一阶段是否完成验证
- 必需文件是否存在
- 测试是否通过

### 3. 边界检查

开发边界保护：
- 只能在允许范围内修改
- 锁定区域禁止修改

---

## 常见问题

### Q1: coder 遇到技术难题怎么办？
A: 使用 `/debug` 调用 debug-helper 进行调试，或者输出"请调用 architect"请求架构支持。

### Q2: 可以跳过某个阶段吗？
A: 可以说"跳过 [阶段名]"，但必须显式跳过，不能默认跳过。

### Q3: 如何知道当前是哪个 Agent？
A: 查看对话开头或者最近的消息，确认当前在哪个阶段。

### Q4: 测试失败了怎么办？
A: 使用 `/debug` 协助定位问题根因，修复后重新运行测试。
