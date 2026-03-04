# 阶段工作流

## 概述

本文档详细说明 CLAUDE-STUDIO 的完整阶段工作流，包括每个阶段的职责、交付物、验证条件和状态管理。

---

## 完整流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  需求访谈   │────▶│  规格设计   │────▶│  实现计划   │
│ /interview  │     │   /spec     │     │   /plan     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  编码实现   │────▶│  测试验证   │────▶│  代码审查   │
│   /code     │     │   /test     │     │   /review   │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 阶段详解

### 1. 需求访谈 (/interview)

**阶段 ID:** `interview`

**目标:** 深入理解用户需求，识别项目边界

**职责:**
- 8 维度需求分析
- 业务场景收集
- 技术约束识别
- MVP 范围定义

**交付物:**
- 需求摘要（8 维度）
- 项目边界文档

**必需文件:** 无

**Memory Bank 更新:**
- `项目进展.md` - 项目名称、描述、开始时间
- `学习记录.md` - 用户偏好

**验收标准:**
- [ ] 需求文档包含 8 维度
- [ ] 项目边界清晰
- [ ] MVP 范围明确

---

### 2. 规格设计 (/spec)

**阶段 ID:** `spec`

**目标:** 设计系统架构，制定技术选型

**职责:**
- 系统架构设计
- 技术栈选型
- 接口契约定义
- 数据模型设计

**交付物:**
- `docs/spec.md` - 完整规格文档

**必需文件:** 无（但依赖 interview 交付物）

**Memory Bank 更新:**
- `技术决策.md` - 技术选型、架构决策
- `项目进展.md` - 规格文档位置

**验收标准:**
- [ ] 架构设计完整
- [ ] 技术选型有理由
- [ ] 接口定义清晰

---

### 3. 实现计划 (/plan)

**阶段 ID:** `plan`

**目标:** 将规格文档拆解为可执行任务

**职责:**
- 任务拆分
- 依赖分析
- 优先级排序
- 工作量估算

**交付物:**
- 任务清单（JSON/ Markdown）
- 里程碑计划

**必需文件:** `docs/spec.md`

**Memory Bank 更新:**
- `项目进展.md` - 任务统计、任务列表
- `当前任务.md` - 任务详情

**验收标准:**
- [ ] 所有规格项都有对应任务
- [ ] 任务依赖关系清晰
- [ ] 优先级合理

---

### 4. 编码实现 (/code)

**阶段 ID:** `code`

**目标:** 按计划实现功能代码

**职责:**
- 按优先级实现功能
- 遵循代码规范
- 编写单元测试
- 更新项目文档

**交付物:**
- 源代码文件
- 测试代码
- 更新的文档

**必需文件:** 任务清单（从 plan 阶段）

**Memory Bank 更新:**
- `项目进展.md` - 当前任务、任务进度、变更日志
- `当前任务.md` - 任务状态

**验收标准:**
- [ ] 代码通过 lint 检查
- [ ] 单元测试通过
- [ ] 无安全漏洞

---

### 5. 测试验证 (/test)

**阶段 ID:** `test`

**目标:** 确保代码质量达标

**职责:**
- 编写集成测试
- 执行测试套件
- 检查测试覆盖率
- 生成测试报告

**交付物:**
- 测试报告
- 覆盖率报告

**必需文件:** 源代码（从 code 阶段）

**Memory Bank 更新:**
- `项目进展.md` - 测试统计（单元/集成/覆盖率）

**验收标准:**
- [ ] 单元测试 >= 80%
- [ ] 集成测试通过
- [ ] 无测试失败

---

### 6. 代码审查 (/review)

**阶段 ID:** `review`

**目标:** 代码质量最终把关

**职责:**
- 代码质量审查
- 安全漏洞扫描
- 性能检查
- 生成审查报告

**交付物:**
- 审查报告
- 问题清单
- 修复建议

**必需文件:** 测试报告（从 test 阶段）

**Memory Bank 更新:**
- `项目进展.md` - 审查结果

**验收标准:**
- [ ] 无 Critical 问题
- [ ] 无 High 问题
- [ ] 代码质量评分 >= 8/10

---

## 阶段门禁

每个阶段切换必须通过以下验证：

### 1. 前置条件验证

```
┌─────────────────────────────────────┐
│         阶段切换验证                  │
├─────────────────────────────────────┤
│ 1. 上一阶段状态 = "已完成"          │
│ 2. 必需交付物存在                   │
│ 3. Memory Bank 字段完整             │
│ 4. 开发边界检查通过                 │
└─────────────────────────────────────┘
```

**验证流程:**
1. 检查 `.phase-state.yaml`
2. 检查交付物文件是否存在
3. 检查 `memory-bank/项目进展.md` 字段
4. 检查 `.claude/scope.yaml`

### 2. 验证失败处理

| 错误 | 原因 | 解决 |
|------|------|------|
| 阶段未完成 | 上一阶段状态不是 completed | 完成上一阶段 |
| 交付物缺失 | 必需文件不存在 | 创建交付物 |
| 字段缺失 | Memory Bank 未更新 | 填写字段 |
| 边界违规 | 修改了锁定区域 | 还原修改 |

---

## 状态管理

### 状态文件

| 文件 | 内容 | 格式 |
|------|------|------|
| `.phase-state.yaml` | 阶段状态 | YAML |
| `.claude/scope.yaml` | 开发边界 | YAML |
| `.claude/iterate-state.json` | 迭代状态 | JSON |
| `memory-bank/项目进展.md` | 项目进度 | Markdown |
| `memory-bank/技术决策.md` | 技术决策 | Markdown |

### Phase State 格式

```yaml
project:
  name: 项目名称
  start_time: 2026-01-01T00:00:00Z
  last_update: 2026-01-02T00:00:00Z

current_phase:
  id: code
  name: 编码实现
  status: in_progress

phases:
  - id: interview
    name: 需求访谈
    status: completed
    start_time: ...
    end_time: ...

  - id: spec
    name: 规格设计
    status: completed
    ...
```

---

## 快捷操作

### CLI 命令

```bash
# 查看当前状态
node scripts/phase-manager.js status

# 开始阶段
node scripts/phase-manager.js start interview

# 完成阶段
node scripts/phase-manager.js complete interview

# 查看下一步
node scripts/phase-manager.js next

# 验证阶段
node scripts/phase-manager.js validate code

# 跳过阶段
node scripts/phase-manager.js skip interview

# 重置所有阶段
node scripts/phase-manager.js reset
```

### Phase CLI

```bash
# 交互式 CLI
node scripts/phase-cli.js status
node scripts/phase-cli.js init "我的项目"
node scripts/phase-cli.js start interview
node scripts/phase-cli.js complete
node scripts/phase-cli.js next
```

---

## 异常处理

### 1. 阶段回退

如果后续阶段发现问题，可以回退：

```bash
# 回退到上一阶段
node scripts/phase-manager.js complete <previous-phase-id>
```

### 2. 阶段跳过

某些情况下可以跳过阶段：

```bash
# 跳过当前阶段
node scripts/phase-cli.js skip interview
```

**注意:** 跳过阶段可能导致依赖缺失，需谨慎使用。

### 3. 强制重置

极端情况下可以重置：

```bash
# 重置所有阶段
node scripts/phase-manager.js reset
```

---

## 最佳实践

1. **不要跳过阶段** - 每个阶段都有其价值
2. **及时更新 Memory Bank** - 保持状态同步
3. **验证后再切换** - 确保前置条件满足
4. **记录关键决策** - 便于回顾和审计
5. **保持边界清晰** - 遵守开发边界规则
