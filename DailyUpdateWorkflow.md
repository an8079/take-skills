# take-skills 每日更新工作流

> 每天凌晨0点自动执行，调研最新技能需求，更新项目并推送GitHub

## 行业标杆
- **oh-my-claude**：`~/.claude/skills/` 技能定义规范
- **gstack**：Agent协作框架，https://github.com/garrytan/gstack

## 每日调研方向

### 1. 热门技能趋势（来源：大合爱AI日报/小红书/即刻/Github Trending）
- 最近7天最热门的AI Agent技能
- 新兴的提示词工程技术
- LangChain/LangGraph新特性

### 2. 竞品监控
- **oh-my-claude**：新增了哪些技能？
- **gstack**：新增了哪些能力？
- **clawhub**：热门技能有哪些？

### 3. 用户需求挖掘
- orchestration-service项目需要什么新技能？
- DeerFlow-X项目需要什么新技能？
- 省级中标项目需要什么专项技能？

### 4. 技能更新类型
- **新增技能**：新发现的高价值技能
- **技能迭代**：现有技能的优化
- **技能翻译**：中文版本更新

## 每日输出
1. 更新 `skills/SKILLS_INDEX.md`（技能索引）
2. 新增/更新 `skills/` 下的具体技能文件
3. 更新 `CHANGELOG.md`（记录每日变更）
4. 推送到 GitHub

## Claude Code 团队分工

### 调研员（Researcher）
- 调研最新AI技能趋势
- 分析竞品新功能
- 整理调研报告

### 技能工程师（Skill Engineer）
- 根据调研结果编写新技能
- 优化现有技能
- 确保技能质量

### 主编（Editor）
- 汇总所有更新
- 撰写 CHANGELOG
- 质量审核

## 推送消息格式
```
📦 take-skills 每日更新

🆕 新增技能：X个
🔄 更新技能：X个
📝 更新内容：[简要说明]

GitHub: https://github.com/an8079/take-skills
```
