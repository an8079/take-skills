---
name: lyd_team
description: 组建专家团队进行协作，支持分析师、监督者、执行者等多种角色协同工作
---

# /lyd-team - 团队协作命令

组建专家团队，通过多 Agent 协作解决复杂问题。支持完整的团队管道：plan → exec → verify → fix。

## 使用方式

```
/lyd-team "任务描述"
```

或

```
组队
团队协作
多 Agent 协作
```

## 团队角色

### 核心角色（自动分配）

| 角色 | Agent | 职责 |
|------|-------|------|
| **监督者** | team-lead | 协调团队、跟踪进度、生成报告 |
| **分析师** | analyst | 分析需求、设计方案、拆解任务 |
| **执行者** | executor | 实现功能、编写代码 |
| **验证者** | verifier | 验证结果、检查质量 |
| **批评者** | critic | 挑战方案、识别风险 |

### 可选角色

| 角色 | Agent | 职责 |
|------|-------|------|
| **协调者** | coordinator | 任务分发、优先级管理 |

## 团队管道

```
┌─────────────────────────────────────────────────────────┐
│                    团队协作管道                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  team-plan    →    team-exec    →    team-verify       │
│  (分析规划)         (执行任务)          (验证结果)        │
│       ↓                   ↓                ↓            │
│       └───────────────────┼────────────────┘            │
│                           ↓                             │
│                    team-fix (如需要)                      │
│                    (修复问题，最多3次)                    │
│                           ↓                             │
│                           ↓                             │
│                    complete / failed                     │
└─────────────────────────────────────────────────────────┘
```

## 工作流程

### 1. 团队组建
- 分析任务需求
- 分配团队角色
- 初始化团队状态

### 2. Plan 阶段
- analyst 分析需求
- 拆解任务列表
- 创建执行计划

### 3. Exec 阶段
- executor 并行执行任务
- coordinator 分发任务
- team-lead 跟踪进度

### 4. Verify 阶段
- verifier 验证结果
- critic 挑战方案
- 更新任务状态

### 5. Fix 循环（如需要）
- 修复失败的任务
- 最多 3 次循环
- 触发 fix-loop

## 输出内容

### 团队状态报告

```
# 团队协作报告

## 团队信息
- 团队名称: {team_name}
- 当前阶段: {phase}
- 迭代次数: {iteration}

## 任务进度
- 总任务数: {tasks_total}
- 已完成: {tasks_completed}
- 失败: {tasks_failed}
- 完成率: {completion_rate}%

## 团队健康
- 总成员: {total_workers}
- 活跃: {active_workers}
- 空闲: {idle_workers}
- 失联: {stale_workers}

## 制品
- 计划文档: {has_plan}
- PRD: {has_prd}
- 验证报告: {has_verify_report}

## Fix 循环
- 当前尝试: {fix_attempt}/{max_attempts}
- 已耗尽: {exhausted}
```

### 任务分配表

| 任务 ID | 描述 | 负责人 | 状态 | 依赖 |
|---------|------|--------|------|------|
| task-1 | 分析需求 | analyst | ✓ 完成 | - |
| task-2 | 实现功能 | executor-A | 进行中 | task-1 |
| task-3 | 编写测试 | executor-B | 待处理 | task-2 |

## 状态管理

团队状态存储在:
```
.omc/state/team/{team_name}/
  config.json         # 团队配置
  tasks/              # 任务列表
  shared-memory.json  # 共享内存
  events.jsonl        # 事件日志
```

## 团队成员通信

- 消息传递: 通过 inbox/outbox
- 心跳检测: 30 秒超时
- 广播消息: 发送给所有成员

## 示例

### 示例 1: 简单任务
```
/lyd-team "实现用户认证模块"
```

### 示例 2: 复杂项目
```
/lyd-team "构建完整的电商后端系统"
```

### 示例 3: 问题修复
```
/lyd-team "修复支付模块的高并发问题"
```

## 与其他命令的关系

| 命令 | 用途 | 团队角色 |
|------|------|---------|
| `/lyd-plan-review` | 计划审查 | CEO, Architect |
| `/lyd-code-review` | 代码审查 | Security, Performance |
| `/lyd-fro-review` | 前端审查 | GAN Evaluator |

---

**提示:** `/lyd-team` 适合复杂任务，需要多个专家协同工作。对于简单任务，使用单个 Agent 更高效。
