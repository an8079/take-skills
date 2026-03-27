# take-skills Claude Code 每日调研团队

> 每天凌晨0点自动执行，多Agent协作完成技能更新

## 团队角色

### 🎯 首席调研员（Lead Researcher）
- 负责整体调研方向和进度把控
- 协调各调研员的工作
- 质量审核所有输出
- **Prompt参考**：见 `agents/lead-researcher.md`

### 📊 竞品分析师（Competitor Analyst）
- 监控 oh-my-claude 新增技能
- 监控 gstack 最新功能
- 监控 clawhub 热门技能
- **Prompt参考**：见 `agents/competitor-analyst.md`

### 🔍 技术趋势研究员（Tech Trend Researcher）
- 调研 LangChain/LangGraph 新特性
- 调研 AI Agent 技能趋势
- 分析大合爱AI日报最新内容
- **Prompt参考**：见 `agents/tech-trend-researcher.md`

### ⚙️ 技能工程师（Skill Engineer）
- 根据调研结果编写/更新技能文件
- 确保技能文件格式规范
- 遵循 SKILL.md 标准模板
- **Prompt参考**：见 `agents/skill-engineer.md`

## 协作流程

```
0:00  cron触发
  ↓
首席调研员：分配任务，设定优先级
  ↓
竞品分析师 ─┐
技术趋势研究员─┼─→ 并行调研
  ↓
技能工程师：根据调研结果更新技能
  ↓
首席调研员：审核并推送GitHub
  ↓
推送微信汇报
```

## 技能文件标准模板

```markdown
# [技能名称]

## 角色定义
你是一个[角色]，专注于[领域]。

## 核心能力
- 能力1
- 能力2
- 能力3

## 使用场景
[具体使用场景描述]

## 工作流程
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 质量标准
- [标准1]
- [标准2]

## 禁止事项
- [禁止事项1]
- [禁止事项2]
```

## 技能分类（参考SKILLS_INDEX.md）

### Agents（10个）
系统架构设计 / 高级开发专家 / 代码审查 / 安全工程 / DevOps自动化 / 数据工程 / 技术写作 / SRE / 后端架构 / 前端开发

### Development（20个）
API设计 / TDD / 代码审查 / 安全审查 / 规格编写 / 需求分析 / 数据库设计 / 后端模式 / 前端模式 / 提示工程 / 错误恢复 / 上下文管理 / 自我迭代 / 技术栈检测 / 进度跟踪 / 持续学习 / 自动评审 / 反思总结 / 技能选择 / 技能创建

### Infrastructure（5个）
K8s / MCP服务器构建 / DevOps交付 / 自动构建 / 通知系统

### AI/ML（14个）
NLP流水线 / 计算机视觉 / 向量生成 / 知识图谱RAG / RAG设计 / 向量搜索 / 用户画像 / 电商推荐 / 生物信息学 / Agent评估 / 模型微调 / 分布式数据

## 行业标杆
- **oh-my-claude**：`~/.claude/skills/` - Claude Code技能标准
- **gstack**：https://github.com/garrytan/gstack - Agent协作框架

## 更新日志格式（CHANGELOG.md）
```markdown
## [日期] 自动更新

### 调研摘要
- 数据来源：xxx
- 技能总数：xxx

### 新增技能
- [技能名称]：xxx

### 更新技能
- [技能名称]：xxx
```
