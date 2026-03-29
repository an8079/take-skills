# takes-master 命令参考

## 完整命令列表

| 命令 | 触发条件 | 输出 |
|------|---------|------|
| `/takes:update` | "更新"、"推送"、"上传" | WeChat汇报结果 |
| `/takes:status` | "项目状态"、"检查一下" | 状态卡片 |
| `/takes:check` | "快速检查"、"语法验证" | 检查结果 |
| `/takes:log [N]` | "查看历史"、"commit记录" | N条commit |
| `/takes:diff` | "变更了什么"、"未提交内容" | diff摘要 |
| `/takes:project` | "项目概览"、"显示信息" | 项目信息 |
| `/takes:architecture` | "架构"、"目录结构" | 架构文档 |
| `/takes:prd` | "PRD"、"需求文档" | PRD状态 |
| `/takes:cleanup` | "清理"、"删除临时文件" | 清理结果 |
| `/takes:help` | "help"、"帮助" | 帮助信息 |

## takes:update 详细流程

### 输入
用户说"更新代码"或"/takes:update"

### 输出
```
✅ takes:update 完成

📋 本次变更：
  - 文件: X个新增/修改
  - 类型: feat|fix|docs|refactor|chore

🌿 Git
  - Commit: abc1234
  - 信息: feat(orchestrator): ...

📊 质量检查
  - Python: ✅/❌
  - Java: ✅/❌  
  - Frontend: ✅/❌

🚀 推送: ✅/❌
```

## takes:status 详细流程

### 输入
用户说"项目状态"或"/takes:status"

### 执行检查
```bash
cd /workspace/erkai/erkai-web/二开/orchestration-service
git log -3 --oneline
git status --short
find app/agents -name "agent.py" | wc -l  # Agent数
```

### 输出卡片
```
📊 orchestration-service 状态

🌿 Git
  - HEAD: abc1234
  - 未提交: X个文件
  - 最新: feat(report): ...

📦 代码统计
  - Agents: X个
  - Services: X个
  - Skills: X个
  - 总文件: X个

🔨 构建状态
  - Python: ✅/❌
  - Java: ✅/❌
  - Frontend: ✅/❌
```

## 4问质量门槛

每次 takes:update 前必须自问：

1. **改了什么？** → 说不清楚则不提交
2. **有重复吗？** → 文件列表相似则先squash
3. **是增量吗？** → 完全覆盖则跳过
4. **信息自解释？** → 不能是"feat: 更新"

→ 4问全部通过才上传
