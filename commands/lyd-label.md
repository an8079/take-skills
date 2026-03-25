---
name: lyd-label
description: 基于关键词分析自动为 GitHub Issue 打标签。支持 priority/type/complexity/component 分类，使用 GitHub CLI (gh issue edit) 应用标签。
---

# /lyd-label - Issue 自动标签

基于 Issue 标题和内容中的关键词，自动为 GitHub Issue 打标签。

## 使用方式

```
/lyd-label <issue-number-or-url>
```

## 标签分类体系

### Priority（优先级）

| 标签 | 关键词 | 说明 |
|------|--------|------|
| `priority/P0` | crash, critical, urgent, blocker, production down, security | 最高优先级 |
| `priority/P1` | high, important, major, breaking, race condition | 高优先级 |
| `priority/P2` | normal, medium, default | 中优先级 |
| `priority/P3` | low, minor, trivial, nice-to-have, enhancement | 低优先级 |

### Type（类型）

| 标签 | 关键词 | 说明 |
|------|--------|------|
| `type/bug` | bug, crash, fix, error, wrong, incorrect, broken, fail | Bug 修复 |
| `type/feature` | feature, add, implement, new, support | 新功能 |
| `type/enhancement` | improve, enhance, optimize, refactor, performance | 改进优化 |
| `type/docs` | docs, documentation, readme, comment | 文档更新 |
| `type/test` | test, testing, coverage, unit, integration | 测试相关 |
| `type/chore` | chore, dependency, update, upgrade, config | 维护任务 |
| `type/question` | question, how, why, help, unsure | 问题咨询 |

### Complexity（复杂度）

| 标签 | 关键词 | 说明 |
|------|--------|------|
| `complexity/high` | complex, architecture, redesign, rewrite, distributed | 高复杂度 |
| `complexity/medium` | refactor, multiple files, api change, schema | 中复杂度 |
| `complexity/low` | simple, easy, one file, small, trivial | 低复杂度 |

### Component（组件）

| 标签 | 关键词 | 说明 |
|------|--------|------|
| `component/cli` | cli, command, arg, option, flag | 命令行接口 |
| `component/api` | api, endpoint, route, request, response | API 相关 |
| `component/auth` | auth, login, session, token, permission | 认证授权 |
| `component/ui` | ui, ui, visual, display, render, css, style | 界面相关 |
| `component/db` | database, db, query, migration, schema | 数据库相关 |
| `component/qa` | test, testing, coverage, validation | 测试相关 |
| `component/docs` | docs, documentation, readme | 文档相关 |
| `component/security` | security, xss, injection, auth, csrf | 安全相关 |
| `component/performance` | performance, optimize, cache, speed, latency | 性能相关 |

## 工作流程

1. **获取 Issue 信息** - 通过 `gh issue view` 获取标题和内容
2. **关键词分析** - 扫描标题和正文中的关键词
3. **标签匹配** - 根据关键词匹配分类标签
4. **应用标签** - 通过 `gh issue edit --add-label` 添加标签
5. **输出报告** - 显示应用的标签和分类依据

## 示例

```
/lyd-label 123
→ 获取 Issue #123 信息
→ 分析关键词: "crash", "login", "critical"
→ 应用标签: priority/P0, type/bug, component/auth
→ 标签应用成功

/lyd-label https://github.com/owner/repo/issues/456
→ 从 URL 提取 Issue #456
→ 分析关键词: "performance", "slow", "database"
→ 应用标签: priority/P2, type/enhancement, component/performance, complexity/medium
→ 标签应用成功
```

## 标签优先级规则

1. **Priority 标签互斥** - 只应用最高匹配的优先级
2. **Type 标签互斥** - 只应用第一个匹配的类别
3. **Complexity 标签互斥** - 只应用最高匹配的复杂度
4. **Component 标签可叠加** - 匹配的所有组件标签都会应用
5. **默认标签** - 未能匹配时添加 ` triage/needs-review`

## 错误处理

| 错误 | 处理方式 |
|------|----------|
| gh 未安装 | 提示安装 GitHub CLI |
| 未认证 | 提示运行 `gh auth login` |
| Issue 不存在 | 显示错误信息 |
| 网络错误 | 重试并提示 |

## 使用技能

- `scripts/gh-utils.ts` - GitHub CLI 封装
- `src/fix-loop/bug-to-task.ts` - 关键词分类参考

---

**提示：** `/lyd-label` 依赖 GitHub CLI (`gh`)。确保已安装并认证。
