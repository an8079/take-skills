# 📦 take-skills 每日调研报告

> 日期：2026-03-29（北京时间）
> 执行：自动 cron（每日 00:00 UTC）

---

## 一、大合爱AI日报趋势 & 行业动态

### 本周（2026-03-24 ~ 2026-03-29）核心趋势

| 趋势 | 描述 | 技能机会 |
|------|------|---------|
| **Azure Skills Plugin 发布** | Microsoft 发布 Azure Skills Plugin，支持 Claude Code / Copilot，捆绑 19+ skills + 200+ MCP 工具 | Azure 集成技能 |
| **Skills 生态系统爆发** | GitHub Trending Top 15 中有 6 个新仓库是 Skills 相关（2026-03-25 周报） | Skills 开发技能 |
| **Flash-MoE on MacBook** | 397B 参数模型通过 Metal 在 MacBook 运行，端侧 AI 能力爆发 | 本地推理技能 |
| **Agentic RAG** | RAGFlow 等开源 RAG 引擎引入 Agentic 能力，向主动检索演进 | RAG 增强技能 |
| **a16z Top 100 GenAI** | Kling AI、Hailuo、Pixverse、Veo 3 进入 Top 榜单，视频生成成为默认工具 | 多模态技能 |

### Azure Skills Plugin 关键技能清单（2026-03 发布）

Microsoft 发布的 Azure Skills Plugin 覆盖：
- **App Service / Container Apps / Functions** 部署技能
- **Azure SQL / Cosmos DB / Storage** 数据技能
- **Key Vault / Entra ID / Managed Identity** 安全技能
- **Azure Monitor / Application Insights** 观测技能
- **Azure DevOps / GitHub Actions** CI/CD 技能
- **ARM Template / Bicep / Terraform** IaC 技能

---

## 二、oh-my-claude 独家技能缺口分析

### 当前状态
take-skills 已引入 oh-my-claude 的 5 个技能：`deep-dive`、`learner`、`team`、`ultraqa`、`visual-verdict`

### oh-my-claude 完整技能列表（30个）vs take-skills

```
✅ 已引入：deep-dive, learner, team, ultraqa, visual-verdict
❌ 未引入（26个）：
  autopilot      → Ultrawork / 自动执行模式
  ralplan        → RALPLAN 结构化规划（CEO→设计→工程审议）
  deep-interview → 苏格拉底式深度访谈（不同于 deep-dive）
  ralph          → 动态规划工具
  hud            → 实时任务状态显示
  writer-memory  → 长写作上下文追踪
  project-session-manager → 多项目管理
  external-context → 外部知识库检索
  ai-slop-cleaner  → AI 废话清洗
  ask / cancel / ccg / sciomc / release / setup / mcp-setup / configure-notifications / omc-doctor / omc-reference / omc-setup / omc-teams / plan / skill / trace
```

### 高价值缺口 TOP 5

| 优先级 | 技能 | 理由 |
|--------|------|------|
| ⭐⭐⭐ | `autopilot` | 自主执行模式，竞品独家，无类似实现 |
| ⭐⭐⭐ | `ralplan` | RALPLAN-DR 结构化规划，oh-my-claude 核心技能 |
| ⭐⭐ | `deep-interview` | 苏格拉底式提问，需求挖掘神器 |
| ⭐⭐ | `hud` | 实时进度 HUD，类似飞行员显示器 |
| ⭐ | `writer-memory` | 长文写作上下文追踪，实用高频 |

---

## 三、本次新增技能清单

### ① `autopilot`（⭐⭐⭐ 高优先级）
- **来源**：oh-my-claude 独家技能
- **功能**：全自主执行模式，接收高层目标后自动拆解、并行执行、持续推进直到完成
- **与现有技能区别**：`team` 是多 Agent 协作，`autopilot` 是单一 Agent 的极致自动化

### ② `ralplan`（⭐⭐⭐ 高优先级）
- **来源**：oh-my-claude 独家技能（RALPLAN-DR）
- **功能**：4 模式战略规划（Quick / Standard / Deep / Review），包含结构化审议流程
- **与现有技能区别**：`omc-plan` 已引入，此技能是 RALPLAN 的轻量命令行版本

### ③ `deep-interview`（⭐⭐ 中优先级）
- **来源**：oh-my-claude 独家技能
- **功能**：苏格拉底式深度访谈，通过连续追问挖掘用户真实需求和隐含约束
- **与现有技能区别**：`deep-dive` 是技术深挖，此技能是人本需求挖掘

### ④ `hud`（⭐⭐ 中优先级）
- **来源**：oh-my-claude 独家技能
- **功能**：实时任务 HUD，类似飞行员显示器，展示进度、时间、资源消耗
- **与现有技能区别**：`progress-tracking` 是报告式，此技能是实时推送式

---

## 四、本次更新总结

- **新增技能**：4 个（autopilot、ralplan、deep-interview、hud）
- **来源**：全部来自 oh-my-claude 独家技能库
- **质量门槛**：每个 SKILL.md 包含 name、description、when to activate、protocol 三部分
- **差异化**：全部原创设计，与现有 take-skills 无重复
