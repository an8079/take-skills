# Agent 使用规则

正确使用各专业 Agent，发挥它们的专业能力。

## Agent 调用时机

| Agent | 调用时机 | 使用场景 |
|-------|-----------|----------|
| interviewer | 新项目启动、需求变更时 | 需求访谈 |
| architect | 输出规格文档前 | 架构设计 |
| planner | 编码开始前 | 任务拆解 |
| coder | 实现阶段 | 编写代码 |
| tester | 编码完成后 | 生成测试、运行测试 |
| reviewer | PR/commit 前 | 代码审查 |
| security-reviewer | 交付前 | 安全审计 |
| devops | 打包部署时 | 构建部署 |
| optimizer | 里程碑/项目结束 | 迭代优化 |
| debug-helper | 遇到错误时 | 调试问题 |

## Agent 调用方式

使用 Skill tool 调用对应 Agent：

```
/interview   → 调用 interviewer agent
/plan       → 调用 planner agent
/code       → 调用 coder agent
/review     → 调用 reviewer agent
/security   → 调用 security-reviewer agent
```

## Agent 协作模式

### 顺序协作

```
interviewer → architect → planner → coder → tester → reviewer → security-reviewer
```

适用于：标准的新功能开发流程

### 并行协作

```
        ├─ tester (单元测试)
coder ─┤
        ├─ reviewer (代码审查）
        └─ security-reviewer (安全审查）
```

适用于：编码后的质量检查阶段

### 反馈循环

```
planner → coder → tester → [失败] → debug-helper → coder → tester → [通过]
```

适用于：开发过程中遇到问题

## Agent 输入要求

### interviewer

- 用户的需求描述
- 项目的背景信息
- 技术栈偏好

### architect

- 访谈摘要
- 技术栈选择
- 约束条件

### planner

- 规格文档
- 技术架构
- 团队能力

### coder

- 任务描述
- 相关代码上下文
- 代码规范

### tester

- 新增/修改的代码
- 测试覆盖率要求
- 测试类型

### reviewer

- 改动的代码
- Git diff
- 项目规范

### security-reviewer

- 完整代码库
- 安全要求
- OWASP 标准

### devops

- 项目类型
- 部署环境
- CI/CD 配置

### optimizer

- 完整代码库
- 项目历史
- 性能指标

### debug-helper

- 错误信息
- 堆栈跟踪
- 相关代码

## Agent 输出规范

### interviewer

- 访谈摘要
- 8 维度完整度状态
- 待确认问题

### architect

- 架构图
- 技术选型
- 数据模型
- 接口定义

### planner

- 任务列表
- 依赖关系图
- 里程碑
- 风险矩阵

### coder

- 改动文件列表
- 每个文件的改动说明
- 验收标准检查

### tester

- 测试报告
- 覆盖率分析
- 失败测试详情

### reviewer

- 代码审查报告
- 按优先级组织的问题
- 修复建议

### security-reviewer

- 安全审计报告
- OWASP Top 10 检查
- 漏洞修复建议

### devops

- 构建报告
- 部署配置
- 部署文档

### optimizer

- 优化建议
- 可复用模式
- 技术债务清单

### debug-helper

- 问题诊断报告
- 根本原因分析
- 解决方案

## Agent 最佳实践

1. **明确目标** - 调用 Agent 前明确要解决的问题
2. **提供上下文** - 给 Agent 足够的上下文信息
3. **信任专业判断** - Agent 是各领域的专家，尊重其建议
4. **及时反馈** - Agent 输出后及时提供反馈
5. **协作而非替代** - Agent 是协助，不是完全替代人类决策

## Agent 限制

| 限制 | 说明 |
|------|------|
| 模型选择 | 不应频繁切换模型，根据任务类型合理选择 |
| 上下文长度 | 注意上下文窗口，复杂任务需要分步处理 |
| 执行权限 | Agent 不能直接执行危险操作，需要用户确认 |
| 责任 | 最终决策和责任由用户承担 |

---

**记住：** Agent 是强大的辅助工具，合理使用可以显著提高开发效率。
