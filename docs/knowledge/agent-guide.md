# Agent 使用指南

## 概述

本文档详细说明 CLAUDE-STUDIO 中 5 个核心 Agent 的职责、调用方式、权限边界和协作协议。

---

## 5 个核心 Agent

### 1. Interviewer（需求访谈）

**职责：**
- 深入理解用户需求
- 识别项目边界和技术约束
- 收集业务场景信息
- 确定 MVP 范围

**使用场景：**
- 新项目启动
- 需求变更
- 项目重新启动

**交付物：**
- 需求摘要（包含 8 维度分析）
- 项目边界定义

**调用方式：**
```
/interview
开始访谈
```

**Memory Bank 更新：**
- `项目进展.md` - 项目名称、描述、开始时间
- `学习记录.md` - 用户偏好、反馈

---

### 2. Architect（架构设计）

**职责：**
- 系统架构设计
- 技术选型决策
- 接口契约定义
- 数据模型设计
- 性能/安全规划

**使用场景：**
- 需要设计系统架构
- 技术选型争议
- 重构规划

**交付物：**
- `docs/spec.md` - 完整规格文档
- `memory-bank/技术决策.md` - 技术决策记录

**调用方式：**
```
/spec
请调用 architect 继续
```

**Memory Bank 更新：**
- `技术决策.md` - 技术选型、架构决策

**权限边界：**
- ✅ 可调用：planner, researcher
- ❌ 禁止调用：coder, reviewer, tester, devops

---

### 3. Coder（编码实现）

**职责：**
- 按计划实现功能
- 遵循代码规范
- 编写可测试代码
- 处理开发问题

**使用场景：**
- 功能开发
- Bug 修复
- 代码重构

**交付物：**
- 源代码文件
- 测试代码（如 TDD 模式）

**调用方式：**
```
/code
开始编码
/tdd
```

**Memory Bank 更新：**
- `项目进展.md` - 当前任务、任务进度
- `变更日志` - 改动文件列表

**权限边界：**
- ✅ 可调用：debug-helper
- ❌ 禁止调用：reviewer, tester, security-reviewer, devops, architect, planner

**代码规范：**
```typescript
// 函数设计
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// 错误处理
try {
  await saveData(data);
} catch (error) {
  logger.error('保存失败', { error });
  throw new ValidationError('数据验证失败');
}
```

---

### 4. Reviewer（代码审查）

**职责：**
- 代码质量审查
- 最佳实践检查
- 安全漏洞扫描
- 性能问题识别
- 生成审查报告

**使用场景：**
- 代码提交前
- 合并分支前
- 交付前

**交付物：**
- 审查报告
- 问题清单
- 修复建议

**调用方式：**
```
/review
代码审查
```

**Memory Bank 更新：**
- `项目进展.md` - 审查结果

**权限边界：**
- ✅ 可调用：（无）
- ❌ 禁止调用：coder, architect, planner, tester, devops

**审查清单：**
- [ ] 代码可读性
- [ ] 命名有意义
- [ ] 错误处理完善
- [ ] 无硬编码密钥
- [ ] SQL 参数化
- [ ] 输入验证
- [ ] 性能考虑

---

### 5. Debug-Helper（调试助手）

**职责：**
- 分析错误堆栈
- 定位问题根因
- 提供修复建议
- 协助排查问题

**使用场景：**
- 编译错误
- 运行时异常
- 逻辑错误

**调用方式：**
```
/debug
开始调试
```

**调试流程：**
1. 收集错误信息
2. 分析堆栈跟踪
3. 定位问题代码
4. 提供修复方案

**权限边界：**
- ✅ 可调用：（无限制）
- ❌ 禁止调用：（无）

---

## Agent 切换规则

### 切换流程

```
┌─────────────┐
│  当前 Agent │
└──────┬──────┘
       │ 1. 完成职责
       │ 2. 更新 Memory Bank
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

1. **完成当前职责**
   - 确保本阶段任务完成
   - 输出完成报告

2. **更新 Memory Bank**
   - 填写交接协议字段
   - 更新任务状态

3. **显式请求切换**
   ```typescript
   // 在输出中说明
   请调用 architect 继续
   ```

4. **等待确认**
   - 不自行切换
   - 等待用户确认

### ❌ 禁止方式

1. **自行调用 Task tool**
   ```typescript
   // ❌ 禁止
   await task('reviewer', {...});
   ```

2. **跳过验证**
   - 未经阶段验证就进入下一阶段

3. **不更新 Memory Bank**
   - 缺少交接信息

---

## 权限边界矩阵

| Agent | 可调用 | 禁止调用 |
|-------|--------|----------|
| interviewer | (无) | coder, reviewer, architect, planner, tester, devops |
| architect | planner, researcher | coder, reviewer, tester, devops |
| coder | debug-helper | reviewer, tester, security-reviewer, devops, architect, planner, interviewer |
| reviewer | (无) | coder, architect, planner, tester, devops, interviewer |
| debug-helper | (无) | (无) |

---

## 状态管理

### Memory Bank 文件

| 文件 | 内容 | 更新者 |
|------|------|--------|
| `项目进展.md` | 任务进度、阶段状态 | 所有 Agent |
| `技术决策.md` | 技术选型、架构决策 | architect, coder |
| `学习记录.md` | 用户反馈、偏好 | interviewer |
| `当前任务.md` | 当前任务详情 | coder |
| `任务历史.md` | 完成任务历史 | 所有 Agent |

### 交接协议字段

每次切换 Agent 必须填写：

| 字段 | 说明 | 状态 |
|------|------|------|
| 任务状态 | 当前任务 ID 和进度 | 必须 |
| 关键决策 | 技术选型、架构决策 | 必须 |
| 阻塞问题 | 遇到的阻塞问题 | 如有 |
| 上下文摘要 | < 500 tokens | 必须 |

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
- 上一阶段是否完成
- 必需文件是否存在
- Memory Bank 是否更新

### 3. 边界检查

开发边界保护：
- 只能在允许范围内修改
- 锁定区域禁止修改

---

## 常见问题

### Q1: coder 遇到技术难题怎么办？
A: 可以调用 debug-helper 进行调试，或者输出"请调用 architect"请求架构支持。

### Q2: 可以跳过某个阶段吗？
A: 不可以。每个阶段必须完成验证后才能进入下一阶段。

### Q3: 如何知道当前是哪个 Agent？
A: 查看 `memory-bank/项目进展.md` 中的"当前阶段"字段。

### Q4: Memory Bank 满了怎么办？
A: 系统会自动截断（保留头部元数据），并创建版本备份。
