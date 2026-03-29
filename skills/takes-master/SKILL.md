---
name: takes-master
description: orchestration-service 项目主技能。当用户说"更新项目"、"推送代码"、"检查状态"、"制定计划"、"执行任务"时触发。此技能将Agent打造为orchestration-service的专业开发助手，覆盖：代码更新→Git管理→质量审核→部署推送完整流程。
triggers:
  - "更新代码"
  - "takes"
  - "推送项目"
  - "检查orchestration"
  - "项目状态"
---

# takes-master — orchestration-service 专业开发助手

## 核心定位

本技能是 orchestration-service 项目的专属开发助手，以 **takes** (Take It Away, Ship It!) 为方法论，驱动代码从开发到交付的完整流程。

**方法论：4步交付**

```
1. 检查(CHECK)    → git status + 构建验证
2. 决策(DECIDE)   → 4问筛选：值得提交吗？
3. 上传(UPLOAD)   → commit + push，质量优先
4. 汇报(REPORT)   → WeChat通知结果
```

---

## 命令速查

### 核心（每次开发必用）
- `/takes:update`           — 更新代码：检查→决策→上传→汇报
- `/takes:status`          — 查看项目Git状态和构建状态
- `/takes:check`           — 快速质量检查（语法+构建）

### Git管理
- `/takes:log [N]`          — 查看最近N条commit历史
- `/takes:diff`            — 查看当前未提交的变更
- `/takes:cleanup`         — 清理Git临时文件

### 项目信息
- `/takes:project`         — 显示orchestration-service项目概览
- `/takes:architecture`    — 显示架构文档路径
- `/takes:prd`            — 显示PRD需求文档状态

### 帮助
- `/takes:help`           — 显示完整帮助

---

## takes:update 详解

**触发条件：** 用户说"更新代码"、"推送"、"上传"

### 4问筛选（每次上传前必问）

```
❌ 这个commit改了什么？
   → 如果说不清楚，说明改动混乱，合并后再说

❌ 是否有重复内容（和上一个commit对比文件列表）？
   → 如果文件列表几乎相同，先squash再上传

❌ 是增量还是覆盖？
   → 和上一个commit文件完全一样，跳过或squash

❌ commit信息是否自解释？
   → 不能用"feat: 更新"，改为 "feat(report): 新增章节级streaming"
```

### 执行流程

```
STEP 1: 检查
  - git status（确认变更文件）
  - Python: py_compile语法验证
  - Java: mvn compile -q
  - Frontend: cd frontend && npm run build

STEP 2: 决策（4问）
  - 通过全部4问？→ 继续
  - 任一未通过？→ 先修复再上传

STEP 3: 上传
  - commit信息格式：type(scope): 描述
  - type: feat | fix | docs | refactor | chore
  - 后台git push（避免超时）

STEP 4: 汇报
  - 发送WeChat通知：commit SHA + 变更摘要 + 结果
```

### commit信息规范

```
feat(orchestrator): 新增LangGraph状态机
fix(frontend): 修复OutlineEditor样式问题
docs(prd): 更新需求文档v2
refactor(agents): 重构BaseAgent抽象
chore(deps): 升级FastAPI依赖版本
```

---

## takes:status 详解

**触发条件：** 用户说"项目状态"、"检查一下"

```
输出格式：
📊 orchestration-service 状态

🌿 Git
  - HEAD: abc1234
  - 分支: master
  - 未提交: X个文件变更
  - 最新commit: feat(report): ...

🔨 构建
  - Python: ✅/❌
  - Java: ✅/❌
  - Frontend: ✅/❌

📦 关键文件
  - agents/: X个Agent
  - services/: X个Service
  - skills/: X个Skills

⚠️  注意
  - [如有] 待处理变更
```

---

## takes:check 详解

**触发条件：** 用户说"快速检查"、"语法验证"

```
检查项：
✅ Python语法（py_compile）
✅ Java构建（mvn compile）
✅ 前端构建（npm run build）
✅ 无TODO/FIXME遗留（可选）
✅ 无硬编码凭证（可选）
```

---

## 项目信息

**orchestration-service 路径：**
```
/workspace/erkai/erkai-web/二开/orchestration-service/
```

**关键路径：**
- 后端Java: `backend/src/main/java/com/gov/ai/`
- 前端React: `frontend/src/`
- Python Agent: `app/agents/`
- 状态机: `app/agents/orchestrator/graph.py`
- 报告Agent: `app/agents/report/agent.py`
- PRD文档: `docs/PRD_REPORT_GENERATION_SYSTEM.md`

**Git远程：**
```
origin → https://github.com/an8079/orchestration-service
```

---

## 健康门槛

**每次takes:update必须满足：**
1. `py_compile` 全部.py文件通过
2. Maven编译通过（Java）
3. 前端构建通过
4. commit信息符合规范
5. 无重复commit（检查上一个commit的文件列表）
