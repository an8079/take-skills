# GSD 命令完整参考

## 命令速查表

| 命令 | 用途 | 触发频率 |
|------|------|---------|
| `/takes:new-project` | 初始化新项目 | 每项目1次 |
| `/takes:map-codebase` | 扫描已有代码库 | 每项目1次 |
| `/takes:add-phase <name>` | 添加新阶段 | 按需 |
| `/takes:insert-phase N <name>` | 在N前插入阶段 | 按需 |
| `/takes:plan-phase <N>` | 为阶段N制定计划 | 每阶段1次 |
| `/takes:execute-phase <N>` | 执行阶段N | 每阶段多次 |
| `/takes:verify-work <N>` | 验证阶段N | 每阶段1次 |
| `/takes:plan-fix <N>` | 修复阶段N验证失败 | 按需 |
| `/takes:progress` | 查看进度 | 按需 |
| `/takes:pause-work` | 暂停 | 按需 |
| `/takes:resume-work` | 恢复 | 按需 |
| `/takes:discuss-phase <N>` | 团队讨论阶段N | 按需 |
| `/takes:list-assumptions <N>` | 列出阶段N的假设 | 按需 |
| `/takes:export-roadmap` | 导出ROADMAP.md | 按需 |
| `/takes:set-ai <name>` | 切换AI平台 | 按需 |

---

## 详细命令说明

### /takes:new-project

**触发**：用户说"开始新项目"、"初始化项目"、"做一个新系统"。

**完整流程**：

```bash
# 1. 确认项目信息
项目名称：
项目类型：Web应用/API/CLI/SDK/...
核心功能（3句话）：
目标用户：
上线时间：
技术栈偏好：

# 2. 执行初始化
→ 分析需求，确定项目范围
→ 生成 PROJECT.md
→ 生成 ROADMAP.md（阶段分解）
→ 生成 .planning/STATE.md
→ Git commit "feat: 项目初始化"

# 3. 代码库扫描（如需要）
→ /takes:map-codebase
```

**PROJECT.md 模板**：

```markdown
# [项目名称]

## 目标
[一句话目标]

## 成功标准
1. [可量化标准1]
2. [可量化标准2]

## 技术栈
- 语言/框架：
- 数据库：
- 部署：

## 阶段
1. [阶段1名称] — [预计周期]
2. [阶段2名称] — [预计周期]

## 约束
- [技术约束]
- [时间约束]
```

---

### /takes:plan-phase \<N\>

**触发**：阶段计划尚未制定，或需要重新制定。

**完整流程**：

```bash
# 1. 读取 ROADMAP.md 确认阶段N的目标
# 2. gsd-phase-researcher 研究实现方案
# 3. gsd-planner 生成 PLAN.md
# 4. gsd-plan-checker 验证计划（10维度）
# 5. 用户确认后 Git commit
```

**PLAN.md 输出格式**：

```markdown
# 阶段N: [名称]

## 成功标准（Goal-Backward）
必须TRUE的是什么？
1. [标准]

## 任务列表

### Wave 1（可并行）
- [ ] TASK-N.1: [任务] (effort: xh, deps: none)
- [ ] TASK-N.2: [任务] (effort: xh, deps: none)

### Wave 2（依赖Wave 1）
- [ ] TASK-N.3: [任务] (effort: xh, deps: TASK-N.1)
- [ ] TASK-N.4: [任务] (effort: xh, deps: TASK-N.1, TASK-N.2)

## 偏差处理规则
R1: 语法错误 → 自主修复
R2: 逻辑bug → 自主修复（≤3处）
R3: 小bug → 自主修复
R4: 需求不清 → 暂停询问
R5: 架构决策 → 暂停询问
R6: 未知区域 → gsd-debugger 介入
```

---

### /takes:execute-phase \<N\>

**触发**：用户说"开始执行"、"开始开发"、"做阶段N"。

**完整流程**：

```bash
# 1. 读取 PLAN.md
# 2. 按 wave 执行
for wave in waves:
    tasks = get_tasks(wave)
    if parallelizable(tasks):
        execute_in_parallel(tasks)  # gsd-executor
    else:
        execute_sequentially(tasks)
    
    # 每个任务原子提交
    for task in tasks:
        execute(task)
        git_commit(task, "feat: TASK-N.x 完成")
    
    # wave间 checkpoint（如需要）
    if long_task:
        checkpoint:human-verify

# 3. gsd-verifier 验证
# 4. gsd-nyquist-auditor 补全测试（如需要）
# 5. Git commit "feat: 完成阶段N"
```

**原子提交规范**：

```bash
git add <changed-files>
git commit -m "feat: TASK-N.x [任务简述]

- [具体完成内容]
- [技术细节]"

# 示例：
git commit -m "feat: TASK-1.3 添加用户认证API

- POST /api/auth/login 实现
- JWT token 生成
- 密码bcrypt加密"
```

---

### /takes:verify-work \<N\>

**触发**：用户说"验证阶段N"、"检查完成质量"。

**四层验证检查清单**：

```markdown
## L1: 存在性
- [ ] 所有计划文件已创建
- [ ] 所有计划API端点已实现
- [ ] 所有计划功能可访问

## L2: 实质性
- [ ] 每个文件内容符合PLAN要求
- [ ] 功能不是空壳，有实际逻辑
- [ ] 错误处理已实现

## L3: 连线
- [ ] 前端调用了计划的API端点
- [ ] 后端实现了计划的接口
- [ ] 数据库迁移正确

## L4: 数据流
- [ ] 用户数据正确保存
- [ ] 查询返回正确数据
- [ ] 边界条件处理正确
```

---

### /takes:progress

**输出格式**：

```markdown
# 项目进度

## 总体进度
████████░░░░░░░░░░░ 45% (N/M 阶段完成)

## 阶段状态
- [x] 阶段1: [名称] ✅
- [x] 阶段2: [名称] ✅
- [/] 阶段3: [名称] 🔄 进行中
- [ ] 阶段4: [名称] ⏳ 待开始

## 当前状态
- 位置: TASK-3.2
- 已完成: 7/12 tasks
- 阻塞: 无

## 最近提交
- feat: TASK-3.1 完成 (2h ago)
- feat: TASK-2.5 完成 (5h ago)
```
