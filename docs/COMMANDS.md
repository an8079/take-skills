# 命令索引

> **版本：** v3.1.0 | 更新日期：2026-03-24

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

## 增强命令 (takes-*)

| 命令 | 文件 | 用途 |
|------|------|------|
| `/takes-analyze` | takes-analyze.md | 项目分析 |
| `/takes-scope` | takes-scope.md | 范围管理 |
| `/takes-import` | takes-import.md | 导入项目 |

---

## 自动模式命令 (takes-*)

| 命令 | 文件 | 用途 |
|------|------|------|
| `/takes-autopilot` | takes-autopilot.md | 自动驾驶模式 |
| `/takes-ultraqa` | takes-ultraqa.md | QA 测试模式 |
| `/takes-ultrawork` | takes-ultrawork.md | 高效工作模式 |
| `/takes-team` | takes-team.md | 团队协作模式 |

---

## 专项命令 (takes-*)

| 命令 | 文件 | 用途 |
|------|------|------|
| `/takes-boss` | takes-boss.md | 老板督导 PUA 模式 |
| `/takes-reverse-architect` | takes-reverse-architect.md | 逆向思维架构师 |
| `/takes-po` | takes-po.md | 提示词优化器 |
| `/takes-imapo` | takes-imapo.md | AI 图像提示词工程师 |
| `/takes-qa` | takes-qa.md | 自动化 QA 测试与修复 |
| `/takes-qa-only` | takes-qa-only.md | 仅生成缺陷报告 |
| `/takes-deep-interview` | takes-deep-interview.md | 深度访谈模式 |
| `/takes-auto-interview` | takes-auto-interview.md | 自动访谈模式 |
| `/takes-notify` | takes-notify.md | 通知管理 |
| `/takes-rag` | takes-rag.md | RAG 检索增强 |
| `/takes-pua` | takes-pua.md | PUA 模式 |
| `/takes-office-hours` | takes-office-hours.md | 办公时间 |
| `/takes-structure-thinking` | takes-structure-thinking.md | 结构化思考 |
| `/takes-find-product-remind` | takes-find-product-remind.md | 产品提醒 |
| `/takes-test-teams` | takes-test-teams.md | 团队测试 |
| `/takes-ralph` | takes-ralph.md | Ralph 循环模式 |

---

## 命令分类索引

### 按阶段分类

**访谈阶段**
- `/interview` - 需求访谈
- `/takes-deep-interview` - 深度访谈
- `/takes-auto-interview` - 自动访谈

**规格阶段**
- `/spec` - 生成规格文档

**计划阶段**
- `/plan` - 创建实现计划
- `/takes-scope` - 范围管理

**编码阶段**
- `/code` - 编码模式
- `/tdd` - TDD 工作流
- `/takes-import` - 导入项目

**测试阶段**
- `/test` - 运行测试
- `/takes-qa` - 自动化 QA 测试与修复
- `/takes-qa-only` - 仅生成缺陷报告
- `/takes-ultraqa` - QA 测试模式

**审查阶段**
- `/review` - 代码审查

**分析阶段**
- `/takes-analyze` - 项目分析
- `/takes-structure-thinking` - 结构化思考

**特殊模式**
- `/takes-autopilot` - 自动驾驶
- `/takes-ultrawork` - 高效工作
- `/takes-team` - 团队协作
- `/takes-ralph` - Ralph 循环
- `/debug` - 调试模式

---

## 核心命令详细说明

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
| `调试` | /debug |
| `分析` | /takes-analyze |
| `范围` | /takes-scope |
| `导入` | /takes-import |
| `深度访谈` | /takes-deep-interview |
| `快速开始` | /interview 快速开始 |
| `pua` | /takes-pua |
| `团队` | /takes-team |
| `qa` | /takes-qa |
| `ultrawork` | /takes-ultrawork |
| `autopilot` | /takes-autopilot |
| `ultraqa` | /takes-ultraqa |
| `ralph` | /takes-ralph |
| `boss` | /takes-boss |
| `逆向` | /takes-reverse-architect |
| `po` | /takes-po |
| `imapo` | /takes-imapo |

---

## 相关文档

- [Agent 索引](AGENTS.md) - 所有专家 Agent 目录
- [架构文档](ARCHITECTURE.md) - 系统架构详解
- [规格模板](spec-template.md) - 规格文档模板
