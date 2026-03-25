---
name: orchestrate
description: 多容器会话编排引擎，支持并行/串行/DAG依赖图执行
---

# /orchestrate - 会话编排命令

多容器并行/串行执行，依赖图编排，智能任务分解。

## 使用方式

```
/orchestrate create <name> [strategy]
/orchestrate add <graphId> <nodeId> --type <type> --depends <deps>
/orchestrate execute <graphId>
/orchestrate status <graphId>
/orchestrate list
```

## 执行策略

| 策略 | 说明 |
|------|------|
| `parallel` | 所有独立任务并行执行 |
| `sequential` | 按顺序逐个执行 |
| `dag` | DAG依赖图执行（推荐） |
| `wait_for_core` | 先核心后边缘 |

## 会话类型

| 类型 | 用途 |
|------|------|
| `analysis` | 需求分析、架构设计 |
| `implementation` | 代码实现 |
| `testing` | 测试编写 |
| `review` | 代码审查 |
| `coordination` | 编排协调 |

## 示例

### 全栈开发工作流

```
/orchestrate create fullstack dag
/orchestrate add fullstack analysis --type analysis --requirements "设计REST API架构"
/orchestrate add fullstack backend --type implementation --depends analysis --requirements "实现Express后端"
/orchestrate add fullstack frontend --type implementation --depends analysis --requirements "实现React前端"
/orchestrate add fullstack test --type testing --depends backend,frontend --requirements "集成测试"
/orchestrate execute fullstack
```

### Bug修复工作流

```
/orchestrate create bugfix dag
/orchestrate add bugfix analysis --type analysis --requirements "分析登录Bug"
/orchestrate add bugfix fix --type implementation --depends analysis --requirements "修复JWT验证"
/orchestrate add bugfix test --type testing --depends fix --requirements "验证修复"
/orchestrate execute bugfix
```

## 触发词

- `编排会话`
- `多容器执行`
- `DAG执行`
- `并行任务`
