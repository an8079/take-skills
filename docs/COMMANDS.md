# 命令索引

> **版本：** v2.0.0 | 更新日期：2026-03-01

本文档提供所有命令的快速参考。

---

## 核心工作流命令

| 命令 | 文件 | 用途 | 阶段 |
|------|------|------|------|
| `/interview` | interview.md | 开始需求访谈 | 访谈 |
| `/spec` | spec.md | 生成规格文档 | 规格 |
| `/plan` | plan.md | 创建实现计划 | 计划 |
| `/code` | code.md | 进入编码模式 | 编码 |
| `/tdd` | tdd.md | TDD 工作流 | 编码 |
| `/test` | test.md | 运行测试 | 测试 |
| `/review` | review.md | 代码审查 | 审查 |
| `/debug` | debug.md | 调试模式 | 调试 |

---

## 交付命令

| 命令 | 文件 | 用途 |
|------|------|------|
| `/build` | build.md | 构建项目 |
| `/deploy` | deploy.md | 部署项目 |
| `/package` | package.md | 打包交付 |

---

## 增强命令

| 命令 | 文件 | 用途 |
|------|------|------|
| `/analyze` | analyze.md | 项目分析 |
| `/scope` | scope.md | 范围管理 |
| `/import` | import.md | 导入项目 |
| `/reflect` | reflect.md | 反思学习 |
| `/learn` | learn.md | 提取学习模式 |
| `/verify` | verify.md | 验证循环 |
| `/checkpoint` | checkpoint.md | 保存验证点 |

---

## 自动模式命令

| 命令 | 文件 | 用途 |
|------|------|------|
| `/autopilot` | autopilot.md | 自动驾驶模式 |
| `/ultraqa` | ultraqa.md | QA 测试模式 |
| `/ultrawork` | ultrawork.md | 高效工作模式 |
| `/team` | team.md | 团队协作模式 |

---

## 专项命令

| 命令 | 文件 | 用途 |
|------|------|------|
| `/security` | security.md | 安全审查 |
| `/deep-interview` | deep-interview.md | 深度访谈模式 |
| `/auto-interview` | auto-interview.md | 自动访谈模式 |
| `/notify` | notify.md | 通知管理 |
| `/rag` | rag.md | RAG 检索增强 |
| `/pua` | pua.md | PUA 模式 |
| `/office-hours` | office-hours.md | 办公时间 |
| `/structure-thinking` | structure_thinking.md | 结构化思考 |
| `/find-product-remind` | find-product-remind.md | 产品提醒 |
| `/test-teams` | test-teams.md | 团队测试 |

---

## 命令分类索引

### 按阶段分类

**访谈阶段**
- `/interview` - 需求访谈
- `/deep-interview` - 深度访谈
- `/auto-interview` - 自动访谈

**规格阶段**
- `/spec` - 生成规格文档

**计划阶段**
- `/plan` - 创建实现计划
- `/scope` - 范围管理

**编码阶段**
- `/code` - 编码模式
- `/tdd` - TDD 工作流
- `/import` - 导入项目

**测试阶段**
- `/test` - 运行测试
- `/verify` - 验证循环
- `/ultraqa` - QA 测试

**审查阶段**
- `/review` - 代码审查
- `/security` - 安全审查

**部署阶段**
- `/build` - 构建项目
- `/deploy` - 部署项目
- `/package` - 打包交付

**优化阶段**
- `/reflect` - 反思学习
- `/learn` - 提取学习模式
- `/checkpoint` - 保存验证点

**分析阶段**
- `/analyze` - 项目分析
- `/structure-thinking` - 结构化思考

**特殊模式**
- `/autopilot` - 自动驾驶
- `/ultrawork` - 高效工作
- `/team` - 团队协作
- `/debug` - 调试模式

---

## 命令详细说明

### /interview

```
用途: 开始需求访谈
阶段: 访谈
Agent: interviewer
```

**功能:**
- 系统化访谈理解用户需求
- 8 维度完整度检查
- KANO 需求分析
- 主动发现隐含需求

**使用:**
```bash
/interview                    # 开始标准访谈
/interview 快速开始           # 跳过完整访谈
```

---

### /spec

```
用途: 生成规格文档
阶段: 规格
Agent: architect
```

**功能:**
- 输出完整技术规格
- 功能规格与验收标准
- 技术选型决策
- 数据模型设计

---

### /plan

```
用途: 创建实现计划
阶段: 计划
```

**功能:**
- 任务拆解
- 依赖分析
- 里程碑定义

---

### /code

```
用途: 进入编码模式
阶段: 编码
Agent: coder
```

**功能:**
- 按计划实现功能
- 代码风格检查
- 实时质量监控

---

### /tdd

```
用途: TDD 工作流
阶段: 编码
```

**功能:**
- 测试先行开发
- 红-绿-重构循环
- 测试覆盖率跟踪

---

### /test

```
用途: 运行测试
阶段: 测试
Agent: tester
```

**功能:**
- 单元测试
- 集成测试
- E2E 测试

---

### /review

```
用途: 代码审查
阶段: 审查
Agent: reviewer
```

**功能:**
- 代码质量检查
- 最佳实践验证
- 可维护性评估

---

### /debug

```
用途: 调试模式
Agent: debug-helper
```

**功能:**
- 问题定位
- 错误分析
- 解决方案建议

---

### /autopilot

```
用途: 自动驾驶模式
```

**功能:**
- 端到端自动化
- 智能决策
- 状态保持

---

### /ultraqa

```
用途: QA 测试模式
```

**功能:**
- 测试用例生成
- 测试执行
- 质量报告

---

### /ultrawork

```
用途: 高效工作模式
```

**功能:**
- 专注工作流
- 减少中断
- 高吞吐量

---

### /team

```
用途: 团队协作模式
```

**功能:**
- 多 Agent 协作
- 任务分配
- 进度追踪

---

## 触发词映射

| 触发词 | 对应命令 |
|--------|----------|
| `开始访谈` | /interview |
| `写规格` | /spec |
| `做计划` | /plan |
| `开始编码` | /code |
| `TDD` | /tdd |
| `跑测试` | /test |
| `审查代码` | /review |
| `安全审查` | /security |
| `构建` | /build |
| `部署` | /deploy |
| `打包` | /package |
| `分析` | /analyze |
| `范围` | /scope |
| `导入` | /import |
| `调试` | /debug |
| `反思` | /reflect |
| `学习` | /learn |
| `验证` | /verify |
| `检查点` | /checkpoint |
| `自动驾驶` | /autopilot |
| `QA` | /ultraqa |
| `高效` | /ultrawork |
| `团队` | /team |
| `深度访谈` | /deep-interview |
| `快速开始` | /interview 快速开始 |

---

## 相关文档

- [Agent 索引](AGENTS.md) - 所有专家 Agent 目录
- [架构文档](ARCHITECTURE.md) - 系统架构详解
- [规格模板](spec-template.md) - 规格文档模板
