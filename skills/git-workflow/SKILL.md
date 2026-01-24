---
name: git-workflow
description: Git 工作流和版本控制技能。分支管理、提交规范、合并策略等。
tags: [git, version-control, workflow]
---

# Git 工作流技能

## When to Use This Skill

- 需要管理代码版本时
- 处理分支合并和冲突时
- 规范团队提交信息时
- 进行代码回滚和恢复时

## Quick Reference

### 分支模型

```
main (主分支)
  │
  ├── develop (开发分支)
  │     │
  │     ├── feature/user-auth (功能分支)
  │     ├── feature/api-v2 (功能分支)
  │     │
  │     ├── fix/login-bug (修复分支)
  │     └── fix/payment-error (修复分支)
  │
  ├── release/v1.0.0 (发布分支)
  └── hotfix/v1.0.1 (紧急修复分支)
```

### 分支类型

| 分支类型 | 命名规范 | 说明 | 来源 | 目标 |
|----------|----------|------|------|------|
| 主分支 | `main` / `master` | 生产环境 | - | - |
| 开发分支 | `develop` | 集成测试 | `main` | `main` |
| 功能分支 | `feature/功能名` | 新功能开发 | `develop` | `develop` |
| 修复分支 | `fix/问题描述` | Bug 修复 | `develop` | `develop` |
| 发布分支 | `release/版本号` | 发布准备 | `develop` | `main` |
| 紧急修复 | `hotfix/版本号` | 紧急修复 | `main` | `main`, `develop` |

## 分支操作

### 创建功能分支

```bash
# 切换到 develop 并拉取最新代码
git checkout develop
git pull origin develop

# 创建并切换到新的功能分支
git checkout -b feature/user-auth

# 开发完成后，推送到远程
git push -u origin feature/user-auth
```

### 合并功能分支

```bash
# 方式一：Merge Commit（保留历史）
git checkout develop
git merge --no-ff feature/user-auth

# 方式二：Rebase（线性历史）
git checkout feature/user-auth
git rebase develop
git checkout develop
git merge feature/user-auth

# 方式三：Squash（压缩为一个提交）
git checkout develop
git merge --squash feature/user-auth
git commit -m "feat: 添加用户认证功能"
```

### 删除分支

```bash
# 删除本地分支
git branch -d feature/user-auth

# 强制删除本地分支（未合并）
git branch -D feature/user-auth

# 删除远程分支
git push origin --delete feature/user-auth
```

## 提交规范

### Conventional Commits 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(api): 添加用户列表接口` |
| `fix` | Bug 修复 | `fix(auth): 修复登录验证错误` |
| `docs` | 文档更新 | `docs(readme): 更新安装说明` |
| `style` | 代码格式 | `style: 统一代码缩进` |
| `refactor` | 重构 | `refactor(service): 重构用户服务` |
| `perf` | 性能优化 | `perf(api): 优化数据库查询` |
| `test` | 测试相关 | `test(user): 添加用户单元测试` |
| `chore` | 构建/工具 | `chore(deps): 更新依赖版本` |
| `ci` | CI 配置 | `ci(github): 更新 GitHub Actions` |
| `revert` | 回滚提交 | `revert: 回滚 feat(api)` |

### 提交示例

```bash
# 好的提交
git commit -m "feat(api): 添加用户列表接口

支持分页、搜索和过滤功能，响应包含总数和当前页信息。

Closes #123"

git commit -m "fix(auth): 修复 JWT 验证错误

处理过期 token 的边界情况，返回明确的错误信息。

Fixes #456"

# 不好的提交
git commit -m "更新代码"
git commit -m "fix bug"
git commit -m "done"
```

## 冲突解决

### 三方合并冲突

```
<<<<<<< HEAD
你的代码
=======
他人的代码
>>>>>>> feature/other-branch
```

### 解决步骤

```bash
# 1. 执行合并
git merge feature/other-branch

# 2. 查看冲突文件
git status

# 3. 编辑冲突文件，解决冲突

# 4. 标记冲突已解决
git add <conflicted-file>

# 5. 完成合并
git commit

# 6. 如果想放弃合并
git merge --abort
```

### Rebase 冲突

```bash
# 1. 执行 rebase
git rebase develop

# 2. 解决每个冲突后
git add <file>
git rebase --continue

# 3. 放弃 rebase
git rebase --abort
```

## 常用命令速查

### 查看状态

```bash
git status              # 查看当前状态
git log                 # 查看提交历史
git log --oneline       # 简洁的提交历史
git log --graph         # 图形化历史
git diff                # 查看工作区修改
git diff --staged       # 查看暂存区修改
git show <commit>       # 查看指定提交
```

### 暂存和提交

```bash
git add <file>          # 暂存文件
git add .               # 暂存所有修改
git add -u              # 暂存已跟踪的修改
git commit -m "msg"     # 提交
git commit -am "msg"     # 暂存并提交已跟踪文件
git commit --amend      # 修改上次提交
```

### 分支操作

```bash
git branch              # 列出分支
git branch -a           # 列出所有分支
git checkout <branch>    # 切换分支
git checkout -b <branch> # 创建并切换
git merge <branch>      # 合并分支
```

### 远程操作

```bash
git remote -v           # 查看远程仓库
git push                # 推送到远程
git pull                # 拉取并合并
git fetch               # 拉取但不合并
git push -u origin <branch>  # 推送并设置上游
```

### 回滚和恢复

```bash
git reset --soft HEAD~1   # 撤销提交，保留修改
git reset --mixed HEAD~1   # 撤销提交和暂存
git reset --hard HEAD~1    # 撤销提交和修改
git revert <commit>        # 创建新提交回滚
git checkout <commit> <file>  # 恢复文件到指定提交
```

## 工作流选择

### Git Flow（适合发布周期长的项目）

```
1. main: 生产环境，只接受来自 release 和 hotfix 的合并
2. develop: 开发环境，日常开发在这里进行
3. feature: 从 develop 分出，完成后合并回 develop
4. release: 从 develop 分出，发布后合并到 main 和 develop
5. hotfix: 从 main 分出，完成后合并到 main 和 develop
```

### GitHub Flow（适合持续发布的项目）

```
1. main: 可部署的主分支
2. feature: 从 main 分出，通过 PR 合并回 main
3. 所有功能完成后直接发布
```

### Trunk-Based Development（适合快速迭代）

```
1. main: 主分支，所有提交直接到此
2. feature: 短生命周期分支，频繁合并
3. 使用特性开关控制新功能
```

## Hooks 自动化

### 提交前检查

```bash
# .git/hooks/pre-commit
#!/bin/bash

# 代码格式检查
npm run lint

# 运行测试
npm test

# 检查提交信息格式
commitlint --edit $1
```

### 提交后动作

```bash
# .git/hooks/post-commit
#!/bin/bash

# 更新版本号
npm version patch

# 生成变更日志
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

## 子模块管理

```bash
# 添加子模块
git submodule add https://github.com/user/repo.git path/to/submodule

# 初始化子模块
git submodule update --init --recursive

# 更新子模块
git submodule update --remote

# 删除子模块
git submodule deinit path/to/submodule
git rm path/to/submodule
rm -rf .git/modules/path/to/submodule
```

## 最佳实践

1. **提交原子化** - 每个提交只做一件事
2. **频繁提交** - 小步快跑，避免大而全的提交
3. **清晰的提交信息** - 说明做了什么和为什么
4. **定期同步** - 及时 pull 最新代码，减少冲突
5. **代码审查** - 通过 Pull Request 合并代码
6. **保护主分支** - 设置保护规则，需要审查才能合并
7. **自动化测试** - CI/CD 运行测试，不通过不合并

## 参考资源

- [Git 官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
