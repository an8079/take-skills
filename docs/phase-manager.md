# 阶段管理系统使用指南

> 版本：v1.0 | 更新日期：2026-02-27

---

## 概述

阶段管理系统用于跟踪项目开发的 8 个阶段进度，解决以下问题：

- ✅ **阶段可见性** - 每次会话自动显示当前阶段
- ✅ **前置验证** - 自动检查阶段依赖关系
- ✅ **进度跟踪** - 自动更新阶段状态
- ✅ **智能提示** - 自动显示下一步操作

---

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                 阶段管理系统                        │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────────┐   │
│  │  .phase-state.yaml                        │   │
│  │  - 阶段状态文件                        │   │
│  │  - 自动维护                             │   │
│  └──────────────────────────────────────────────┘   │
│                        │                        │
│         ┌──────────────┼──────────────┐       │
│         ▼              ▼              ▼       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Manager │  │ Validator │  │   CLI    │ │
│  │  核心    │  │  验证器   │  │  命令行  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 8 个开发阶段

| ID | 阶段 | 命令 | 描述 |
|----|------|------|------|
| interview | 需求访谈 | `/interview` | 深入理解项目需求和用户期望 |
| spec | 规格设计 | `/spec` | 设计系统架构，制定技术选型 |
| plan | 实现计划 | `/plan` | 拆解任务清单，识别依赖关系 |
| code | 编码实现 | `/code` | 按计划实现功能 |
| test | 测试验证 | `/test` | 生成并执行测试 |
| review | 代码审查 | `/review` | 代码质量检查和安全审计 |
| package | 打包交付 | `/package` | 构建项目，生成交付包 |
| optimize | 迭代优化 | `/reflect` | 分析项目，提取可复用模式 |

---

## 自动化功能

### 1. 会话开始时自动显示阶段

每次启动 Claude Code 会话时，系统会自动显示：

```
═══════════════════════════════════════
🎯 项目：项目名称  |  进度：0/8 (0%)
═══════════════════════════════════════

📋 当前阶段：需求访谈  [⬜]

═══════════════════════════════════════

阶段进度：

⬜ 需求访谈      [待开始]
⬜ 规格设计      [待开始]
   依赖: 需求访谈
⬜ 实现计划      [待开始]
   依赖: 规格设计
...
```

### 2. 命令执行前自动验证

执行阶段命令前，系统会自动检查前置条件：

```bash
/interview
```

如果依赖未满足，会显示：

```
═══════════════════════════════════════
⚠️  阶段前置条件不满足
═══════════════════════════════════════

目标阶段: 规格设计 (/spec)

需要先完成的阶段:

⬜ 需求访谈 (/interview)
     深入理解项目需求和用户期望

═══════════════════════════════════════

💡 建议:

请先执行: /interview
```

### 3. 命令执行后显示下一步

完成阶段后，系统会自动显示下一步：

```
📋 下一步: 规格设计
   命令: /spec
   描述: 设计系统架构，制定技术选型
```

---

## 命令行工具

### phase-manager.js - 核心管理器

```bash
# 显示当前阶段进度
node scripts/phase-manager.js status

# 开始指定阶段
node scripts/phase-manager.js start <phase-id>

# 完成指定阶段
node scripts/phase-manager.js complete <phase-id>

# 显示下一步
node scripts/phase-manager.js next

# 验证是否可执行阶段
node scripts/phase-manager.js validate <phase-id>

# 输出当前阶段ID
node scripts/phase-manager.js current
```

### phase-cli.js - 友好交互工具

```bash
# 显示当前状态（简写）
node scripts/phase-cli.js s

# 初始化项目
node scripts/phase-cli.js init <项目名称>

# 开始阶段
node scripts/phase-cli.js start <phase-id>

# 完成当前阶段
node scripts/phase-cli.js complete

# 赳过阶段
node scripts/phase-cli.js skip <phase-id>

# 显示下一步（简写）
node scripts/phase-cli.js n

# 列出所有阶段
node scripts/phase-cli.js list

# 重置所有进度
node scripts/phase-cli.js reset

# 跳转到指定阶段
node scripts/phase-cli.js jump <phase-id>

# 显示帮助
node scripts/phase-cli.js help
```

---

## 工作流示例

### 标准流程

```bash
# 1. 查看当前状态
node scripts/phase-cli.js status

# 2. 初始化项目
node scripts/phase-cli.js init "我的项目"

# 3. 开始需求访谈
/interview
# → 系统自动开始 interview 阶段

# 4. 访谈完成后，进入下一阶段
/spec
# → 系统验证依赖，自动开始 spec 阶段

# 5. 继续下一阶段
/plan
/code
/test
/review
/package
/reflect
```

### 快速跳过阶段

如果你已经完成某些阶段，可以跳过：

```bash
# 跳过需求访谈
node scripts/phase-cli.js skip interview

# 或者直接跳转到指定阶段
node scripts/phase-cli.js jump plan
# → 会自动跳过之前的所有阶段
```

### 查看进度

任何时候都可以查看当前进度：

```bash
node scripts/phase-cli.js status
```

---

## 文件说明

### .phase-state.yaml

阶段状态文件，包含：

```yaml
project:
  name: "项目名称"
  start_time: null
  end_time: null
  last_update: null

current_phase:
  id: "interview"
  name: "需求访谈"
  status: "in_progress"
  start_time: "2026-02-27T00:00:00Z"
  end_time: null
  notes: []

phases:
  - id: "interview"
    name: "需求访谈"
    command: "/interview"
    description: "深入理解项目需求和用户期望"
    depends: []
    status: "in_progress"
    start_time: "2026-02-27T00:00:00Z"
    end_time: null
  # ... 其他阶段

version: "1.0"
```

**重要：**
- 此文件由系统自动维护
- 不要手动编辑（除非你非常清楚自己在做什么）
- 建议将其添加到 `.gitignore`（每个项目独立）

---

## Hooks 配置

阶段管理系统通过 Hooks 自动运行：

```json
{
  "Start": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node scripts/phase-manager.js status"
        }
      ]
    }
  ],
  "PreCommandUse": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node scripts/phase-validator.js $command"
        }
      ]
    }
  ],
  "PostCommandUse": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node scripts/phase-manager.js next"
        }
      ]
    }
  ]
}
```

---

## 故障排查

### 问题：阶段状态不显示

**可能原因：**
- `.phase-state.yaml` 文件不存在
- `scripts/phase-manager.js` 文件不存在
- Node.js 未安装

**解决方案：**
```bash
# 检查文件
ls -la .phase-state.yaml
ls -la scripts/phase-manager.js

# 检查 Node.js
node --version

# 手动测试
node scripts/phase-manager.js status
```

### 问题：阶段验证失败但应该可以执行

**可能原因：**
- 依赖阶段状态不正确
- 阶段ID拼写错误

**解决方案：**
```bash
# 查看当前状态
node scripts/phase-cli.js status

# 列出所有阶段
node scripts/phase-cli.js list

# 如果状态不对，可以重置
node scripts/phase-cli.js reset
```

### 问题：想要重置项目进度

```bash
node scripts/phase-cli.js reset
# 确认 yes
```

---

## 高级用法

### 手动管理阶段状态

如果你需要手动控制阶段状态：

```javascript
const PhaseManager = require('./scripts/phase-manager');
const manager = new PhaseManager();

// 开始阶段
manager.startPhase('interview');

// 完成阶段
manager.completePhase('interview');

// 检查是否可执行
const check = manager.canExecutePhase('spec');
console.log(check.can, check.reason);

// 获取当前阶段
const current = manager.getCurrentPhase();
console.log(current);

// 保存状态
manager.saveState();
```

### 集成到自定义脚本

```javascript
const PhaseManager = require('./scripts/phase-manager');

class MyCustomScript {
  constructor() {
    this.phaseManager = new PhaseManager();
  }

  async run() {
    // 开始前检查
    const check = this.phaseManager.canExecutePhase('code');
    if (!check.can) {
      console.log(`❌ 无法执行: ${check.reason}`);
      return;
    }

    // 执行任务
    await this.doWork();

    // 完成阶段
    this.phaseManager.completePhase('code');
  }
}
```

---

## 更新日志

### v1.0 (2026-02-27)

- ✅ 初始版本
- ✅ 实现 8 个阶段管理
- ✅ 自动阶段显示
- ✅ 前置条件验证
- ✅ CLI 工具
- ✅ Hooks 集成

---

## 支持与反馈

如有问题或建议，请通过以下方式反馈：

- 查看项目文档
- 使用 `/reflect` 命令记录反馈
- 直接询问 Claude Code 帮助调试
