# 命令索引

> 项目路径: `F:\claude-studio\3.4\claude-studio\claude-studio`
> 生成日期: 2026-03-23

## 核心命令

| 命令 | 文件 | 用途 |
|------|------|------|
| /interview | commands/interview.md | 需求访谈模式 |
| /spec | commands/spec.md | 生成规格文档 |
| /plan | commands/plan.md | 创建实现计划 |
| /code | commands/code.md | 编码实现模式 |
| /tdd | commands/tdd.md | TDD 测试驱动开发 |
| /test | commands/test.md | 运行测试 |
| /review | commands/review.md | 代码审查 |

## 触发方式

| 类型 | 说明 |
|------|------|
| 斜杠命令 | `/interview`, `/spec`, `/plan` 等 |
| 关键词触发 | `开始访谈`, `写规格`, `做计划` 等 |

## 命令 YAML Frontmatter 格式

每个命令文件包含 YAML frontmatter：

```yaml
---
name: 命令名
description: 命令描述
---
```

## 流程关系

```
/interview → /spec → /plan → /code → /test → /review
     ↓          ↓        ↓        ↓        ↓        ↓
  需求访谈    规格文档   任务计划   编码     测试     审查
```

## 阶段钩子配置

命令触发受 `hooks/hooks.json` 控制：

| 钩子类型 | 触发时机 | 脚本 |
|---------|---------|------|
| PreCommandUse | 命令执行前 | phase-validator.js |
| PostCommandUse | 命令执行后 | phase-manager.js next |

## 查看单个命令详情

```bash
# 读取命令文件
cat commands/interview.md
cat commands/spec.md
cat commands/plan.md
cat commands/code.md
cat commands/tdd.md
cat commands/test.md
cat commands/review.md
```
