---
name: qa-only
description: 仅生成缺陷报告（不修复）。系统性测试 Web 应用，产出结构化报告含健康评分和截图，但不修改任何代码。
---

# /qa-only - 仅报告模式

对 Web 应用进行系统性 QA 测试，生成带证据的结构化报告。**绝不修复任何代码。**

## 使用方式

```
/qa-only                              # 标准报告
/qa-only https://example.com          # 测试指定 URL
/qa-only --quick                      # 快速冒烟测试（30秒）
```

---

## Phase 1: 初始化

**检测项目运行时：**

```bash
[ -f package.json ] && echo "RUNTIME:node"
[ -f Gemfile ] && echo "RUNTIME:ruby"
[ -f requirements.txt ] || [ -f pyproject.toml ] && echo "RUNTIME:python"
[ -f go.mod ] && echo "RUNTIME:go"
[ -f Cargo.toml ] && echo "RUNTIME:rust"
```

**检测测试框架：**

```bash
ls jest.config.* vitest.config.* playwright.config.* .rspec pytest.ini pyproject.toml phpunit.xml 2>/dev/null
ls -d test/ tests/ spec/ __tests__/ cypress/ e2e/ 2>/dev/null
```

**创建输出目录：**

```bash
mkdir -p .claude-studio/qa-reports/screenshots
```

---

## Phase 2: 目标 URL

**优先从用户请求中解析 URL：**
- 用户提供了 URL → 直接使用
- 用户未提供 URL → 检查本地端口（`localhost:3000/4000/8080`）
- 无法检测 → 询问用户

**检查 git 分支（diff-aware 模式）：**

```bash
git branch --show-current
git diff main...HEAD --name-only
git log main..HEAD --oneline
```

如果提供了 URL 但在特性分支上，优先测试受分支变更影响的页面。

---

## Phase 3: 探索

### Orient - 应用地图

1. 访问目标 URL
2. 获取导航结构（`links` 或 `snapshot -i`）
3. 检查控制台错误
4. 检测框架：
   - HTML 含 `__next` → Next.js
   - 含 `csrf-token` → Rails
   - 含 `wp-content` → WordPress
   - 客户端路由无页面重载 → SPA

### Explore - 系统性遍历

**每个页面：**
1. 截图存档（`screenshot`）
2. 检查控制台错误（`console --errors`）
3. 点击所有按钮/链接，验证响应
4. 填写表单并提交（空提交、无效数据、边界值）
5. 检查导航路径
6. 检查各状态（空状态、加载状态、错误状态、溢出状态）
7. 响应式检查（移动端 viewport）

**优先级：** 核心功能（首页、仪表盘、结账、搜索）多花时间，次要页面（关于页、条款页）少花时间。

### Quick 模式
仅访问首页 + 顶部 5 个导航目标。检查：页面加载？控制台错误？可见的失效链接？无详细问题文档。

---

## Phase 4: 记录

**每个问题立即记录，不要批量。**

**截图证据要求：**
- 交互式 bug：操作前截图 → 执行操作 → 结果截图
- 静态 bug（布局问题、错字）：单张带标注截图

**使用 Read 工具展示截图给用户。**

---

## Phase 5: 健康评分

计算各类别分数（0-100），取加权平均。

### 评分规则

| 类别 | 权重 |
|------|------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

### Console（权重 15%）
- 0 错误 → 100
- 1-3 错误 → 70
- 4-10 错误 → 40
- 10+ 错误 → 10

### Links（权重 10%）
- 0 失效链接 → 100
- 每增加 1 个失效链接 → -15（最低 0）

### Per-Category（Visual, Functional, UX, Content, Performance, Accessibility）
每类初始 100 分，按问题扣减：
- Critical → -25
- High → -15
- Medium → -8
- Low → -3

**最终分数：** `score = Σ (category_score × weight)`

---

## Phase 6: 最终报告

写入 `.claude-studio/qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`

```markdown
# QA Report: {APP_NAME}

| Field | Value |
|-------|-------|
| **Date** | {DATE} |
| **URL** | {URL} |
| **Branch** | {BRANCH} |
| **Health Score** | {SCORE}/100 |
| **Issues Found** | {N} |

## Top 3 Things to Fix

1. **{ISSUE-NNN}**: {title} — {一句话描述}
2. **{ISSUE-NNN}**: {title} — {一句话描述}
3. **{ISSUE-NNN}**: {title} — {一句话描述}

## Console Health

| Error | Count | First seen |
|-------|-------|------------|
| {error} | {N} | {URL} |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Issues

### ISSUE-001: {Short title}

| Field | Value |
|-------|-------|
| **Severity** | critical / high / medium / low |
| **Category** | visual / functional / ux / content / performance / console / accessibility |
| **URL** | {page URL} |

**Description:** {What's wrong, expected vs actual.}

**Repro Steps:**
1. Navigate to {URL}
   ![Step 1](screenshots/issue-001-step-1.png)
2. {Action}
   ![Step 2](screenshots/issue-001-step-2.png)
3. **Observe:** {what goes wrong}
   ![Result](screenshots/issue-001-result.png)
```

---

## 严重级别定义

| 级别 | 定义 | 示例 |
|------|------|------|
| **Critical** | 阻断核心流程、数据丢失或崩溃 | 表单提交报错页、结账流程断裂 |
| **High** | 主要功能损坏且无 workaround | 搜索返回错误结果、文件上传静默失败 |
| **Medium** | 功能可用但有明显问题 | 加载慢（>5s）、表单验证缺失 |
| **Low** | 轻微的 cosmetic 问题 | 页脚错字、1px 对齐问题 |

---

## 问题分类

### Visual/UI
布局断裂、图片失效、字体/颜色不一致、动画故障、对齐问题

### Functional
失效链接、死按钮、表单验证缺陷、重定向错误、状态不持久、搜索结果错误

### UX
导航困惑、缺少加载指示器、交互慢（>500ms 无反馈）、错误信息不清晰

### Content
错字语法错误、过时文本、占位符文本残留、标签错误

### Performance
页面加载慢（>3s）、滚动卡顿、布局偏移（CLS）、大图未优化

### Console/Errors
JavaScript 异常、请求失败（4xx/5xx）、CORS 错误、混合内容警告

### Accessibility
图片缺 alt 文本、表单无标签、键盘导航断裂、颜色对比度不足

---

## 重要规则

1. **证据为王** —— 每个问题至少一张截图
2. **验证后再记录** —— 重试一次确认可复现
3. **绝不包含凭证** —— 密码写 `[REDACTED]`
4. **增量写入** —— 发现一个问题立即记录，不要批量
5. **用用户视角测试** —— 不要读源码
6. **每次交互后检查控制台** —— 视觉上不可见的 JS 错误仍是 bug
7. **像用户一样测试** —— 使用真实数据，走完整流程
8. **深度优于广度** —— 5-10 个有证据的详细问题 > 20 个模糊描述
9. **只报告，不修复** —— 你的职责是找出问题，不是修复问题
10. **使用 WebSearch 补充** —— 当无法用浏览器测试时，通过搜索验证功能是否正常
