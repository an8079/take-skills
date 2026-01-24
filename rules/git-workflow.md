# Git 工作流规则

遵循规范的 Git 工作流，确保协作顺畅。

## 分支策略

### 主分支

| 分支 | 用途 | 保护规则 |
|------|------|----------|
| main | 生产代码，只接受 merge request/pull request | 禁止直接 push，必须经过 review |
| develop | 开发主分支，集成功能 | 禁止直接 push，必须经过 review |

### 功能分支

- 从 develop 分支创建
- 命名格式：`feature/功能名称`
- 示例：`feature/user-authentication`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication
```

### 修复分支

- 从 main 或 develop 分支创建
- 命名格式：`fix/问题描述`
- 示例：`fix/login-bug`

```bash
git checkout main
git pull origin main
git checkout -b fix/login-bug
```

### 热修复分支

- 从 main 分支创建
- 命名格式：`hotfix/问题描述`
- 完成后合并回 main 和 develop
- 示例：`hotfix/critical-security-fix`

```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix
```

## 提交规范

### Conventional Commits

提交信息格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat(auth): add user registration |
| fix | 修复 bug | fix(order): resolve null reference error |
| docs | 文档变更 | docs(readme): update installation guide |
| style | 代码格式（不影响功能） | style: format code with prettier |
| refactor | 重构 | refactor(order): extract order validation |
| test | 测试相关 | test(order): add order creation tests |
| chore | 构建/工具相关 | chore(deps): update dependencies |

### 提交示例

```bash
# 功能添加
git commit -m "feat(auth): add JWT token refresh"

# Bug 修复
git commit -m "fix(user): resolve undefined email error"

# 文档更新
git commit -m "docs(api): update authentication endpoint"

# 重构
git commit -m "refactor(order): extract price calculation"

# 测试
git commit -m "test(order): add edge case tests"
```

### Commitlint 配置

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "test", "chore"]],
    "type-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-max-length": [2, "always", 72],
    "body-max-length": [2, "always", 100]
  }
}
```

## Commit Hooks

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 运行 lint
npm run lint
if [ $? -ne 0 ]; then
  echo "Lint failed. Please fix before committing."
  exit 1
fi

# 运行类型检查
npm run type-check
if [ $? -ne 0 ]; then
  echo "Type check failed. Please fix before committing."
  exit 1
fi

# 运行相关测试
npm test -- --onlyChanged
```

使用 Husky 管理 Hooks：

```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

## Pull Request / Merge Request 规范

### PR 标题格式

```
[PR-XXX] <type>: <short description>
```

示例：
```
[PR-123] feat(auth): add social login with Google
[PR-124] fix(order): resolve race condition in order creation
```

### PR 描述模板

```markdown
## 描述
[简要描述这个 PR 做了什么]

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 代码重构
- [ ] 文档更新
- [ ] 性能优化
- [ ] 其他

## 相关 Issue
Closes #XXX

## 变更内容
- [ ] 变更1
- [ ] 变更2

## 测试
- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试

## 检查清单
- [ ] 代码符合项目规范
- [ ] 测试已添加/更新
- [ ] 文档已更新（如需要）
- [ ] 没有 console.log 或调试代码
- [ ] 没有硬编码的密钥
```

### PR 审查规则

- 至少 1 人审查通过
- 所有 CI 检查通过
- 没有 Critical 级别的代码审查问题
- 没有 Critical/High 级别的安全问题

## 版本管理

### 语义化版本

格式：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的 API 变更
- **MINOR**：向下兼容的功能新增
- **PATCH**：向下兼容的 bug 修复

示例：
- `1.0.0` → `1.0.1` - Bug 修复
- `1.0.0` → `1.1.0` - 新增功能
- `1.0.0` → `2.0.0` - 重大变更

### Git Tag

```bash
# 创建 tag
git tag -a v1.0.0 -m "Release v1.0.0"

# 推送 tag
git push origin v1.0.0

# 删除 tag（本地）
git tag -d v1.0.0

# 删除 tag（远程）
git push origin --delete v1.0.0
```

## 忽略文件

### .gitignore 模板

```gitignore
# 依赖
node_modules/
__pycache__/
*.pyc
.pipenv/

# 构建产物
dist/
build/
*.egg-info/
.eggs/

# 环境变量
.env
.env.local
.env.*.local

# 日志
*.log
logs/

# IDE
.vscode/
.idea/
*.swp
*.swo

# 操作系统
.DS_Store
Thumbs.db

# 测试覆盖率
coverage/
.nyc_output/

# 临时文件
*.tmp
*.temp
```

## 常用 Git 命令

```bash
# 查看状态
git status

# 查看日志
git log --oneline --graph --all

# 查看改动
git diff
git diff HEAD~1
git diff main

# 暂存改动
git add .
git add <file>

# 提交
git commit -m "type(scope): description"

# 推送
git push
git push -u origin <branch>

# 拉取
git pull
git pull --rebase

# 分支操作
git branch                # 查看分支
git branch -a            # 查看所有分支
git checkout <branch>     # 切换分支
git checkout -b <branch> # 创建并切换
git branch -d <branch>   # 删除本地分支
git push origin --delete <branch>  # 删除远程分支

# 合并
git merge <branch>
git merge --no-ff <branch>  # 创建 merge commit

# 变基
git rebase <branch>
git rebase -i HEAD~3       # 交互式 rebase

# 撤销
git reset --soft HEAD~1   # 撤销 commit，保留改动
git reset --hard HEAD~1   # 撤销 commit 和改动
git revert <commit>        # 撤销 commit 并创建新 commit

# 暂存
git stash
git stash pop
git stash list
```

---

**记住：** 清晰的 Git 历史让项目更容易理解和维护。遵循规范可以减少协作中的问题。
