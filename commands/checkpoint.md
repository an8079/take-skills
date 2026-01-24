---
name: checkpoint
description: 保存验证点，记录当前项目状态。
---

# /checkpoint - 保存验证点

保存当前项目状态，作为回滚或对比的基准。

## 使用方式

```
/checkpoint [描述]
```

示例：
```
/checkpoint "完成订单功能开发"
/checkpoint "V1.0.0 发布准备就绪"
```

## Checkpoint 包含的内容

| 内容 | 说明 |
|------|------|
| 时间戳 | Checkpoint 创建时间 |
| 描述 | Checkpoint 的简要描述 |
| Git 提交 SHA | 当前的 Git 提交 ID |
| 文件列表 | 项目文件列表 |
| 依赖列表 | 当前依赖版本 |
| 测试结果 | 最新测试结果 |
| 配置快照 | 环境变量配置（不含敏感信息） |

## Checkpoint 用途

| 用途 | 说明 |
|------|------|
| 回滚基准 | 出问题时快速恢复到已知良好状态 |
| 进度对比 | 对比不同阶段的差异 |
| 审计追踪 | 记录项目演进历史 |
| 分支点 | 从 Checkpoint 创建新的实验分支 |

## Checkpoint 文件

```json
{
  "id": "cp-20240124-001",
  "timestamp": "2024-01-24T10:00:00Z",
  "description": "完成订单功能开发",
  "git": {
    "commit": "a1b2c3d",
    "branch": "feature/orders"
  },
  "files": {
    "total": 156,
    "modified": 23,
    "added": 8,
    "deleted": 2
  },
  "dependencies": {
    "node": "18.17.0",
    "npm": "9.6.7",
    "packages": {
      "express": "^4.18.2",
      "typescript": "^5.2.2"
    }
  },
  "tests": {
    "total": 50,
    "passed": 50,
    "failed": 0,
    "coverage": 87
  },
  "status": "stable"
}
```

## Checkpoint 列表

```
/checkpoint list
```

输出：
```
📍 Checkpoint 列表

| ID | 时间 | 描述 | 状态 |
|----|------|------|------|
| cp-20240124-001 | 2024-01-24 10:00 | 完成订单功能开发 | stable |
| cp-20240124-002 | 2024-01-24 14:30 | 修复认证 bug | stable |
| cp-20240124-003 | 2024-01-24 16:00 | V1.0.0 发布准备 | ready |
```

## 恢复 Checkpoint

```
/checkpoint restore [ID]
```

示例：
```
/checkpoint restore cp-20240124-002
```

恢复操作：
1. 查找对应的 Git 提交
2. 恢复依赖版本
3. 提示用户确认

## 删除 Checkpoint

```
/checkpoint delete [ID]
```

## Checkpoint 最佳实践

| 建议 | 说明 |
|------|------|
| 完成功能后保存 | 每个功能完成后创建 Checkpoint |
| 重大变更前保存 | 重构或架构调整前创建 Checkpoint |
| 里程碑时保存 | 版本发布或重要里程碑时创建 |
| 描述要清晰 | Checkpoint 描述应包含关键信息 |

---

**提示：** Checkpoint 是项目的安全网。在重要变更前创建 Checkpoint 可以让你有信心地尝试新方案。
```

---

**提示：** 良好的 Checkpoint 习惯可以显著降低项目风险。
