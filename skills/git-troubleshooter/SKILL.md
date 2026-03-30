---
name: git-troubleshooter
description: Git常见问题排查与修复，包括冲突处理、回退、清理、cherry-pick、reflog恢复等疑难杂症
triggers:
  - "git冲突"
  - "git回退"
  - "git错误"
  - "git恢复"
  - "git reset"
  - "git rebase失败"
  - "git分支乱了"
---

# git-troubleshooter — Git故障排查员

> Git出问题了别慌！这个skill帮你诊断并修复所有常见Git疑难杂症。

## 触发条件
- Git操作报错（冲突、失败、拒绝等）
- 需要回退到之前的版本
- 分支混乱，需要清理
- 误删内容想要恢复

## 工具列表
主要使用 `exec` 工具执行Git命令

---

## 常见问题急救手册

### 1. 合并冲突（Merge Conflict）

**识别**：
```
<<<<<<< HEAD
当前分支的内容
=======
 incoming分支的内容
>>>>>>> feature-branch
```

**解决方法（三步走）**：

**步骤1：查看冲突文件**
```bash
git status  # 列出所有冲突文件
git diff --name-only --diff-filter=U  # 仅列出有冲突的文件
```

**步骤2：手动解决冲突**
编辑冲突文件，保留需要的部分，删除 `<<<<<<<`、`=======`、`>>>>>>>` 标记

**步骤3：标记解决完成**
```bash
git add <冲突文件>
git commit -m "fix: resolve merge conflict in XXX"
```

**快捷工具**：
```bash
# 用ours/theirs快速选择
git checkout --ours <file>   # 保留当前分支版本
git checkout --theirs <file>  # 保留合并分支版本

# 或用git checkout的保留策略
git merge -X ours <branch>    # 自动用ours策略合并
git merge -X theirs <branch>   # 自动用theirs策略合并
```

---

### 2. 想回退（Reset/Revert）

**场景A：还没push，想重置本地**
```bash
# 回退最近1次提交，保留改动
git reset --soft HEAD~1

# 回退最近1次提交，不保留改动（危险！）
git reset --hard HEAD~1

# 回退到指定commit
git reset --hard <commit-hash>
```

**场景B：已经push了，想撤销**
```bash
# 安全撤销：创建新提交来"反做"指定提交
git revert <commit-hash>

# 撤销最近1次提交
git revert HEAD
```

**场景C：想回到某个tag**
```bash
git reset --hard v1.0.0
git push --force origin <branch>
```

---

### 3. 误删了分支，想恢复

```bash
# 找到丢失分支的commit
git reflog
# 输出示例：
# abc1234 HEAD@{0}: checkout: moving from feature-x to main
# def5678 HEAD@{1}: commit: add new feature

# 恢复分支
git checkout -b <分支名> <commit-hash>
# 示例：
git checkout -b feature-x def5678
```

**或者用 HEAD@{n} 直接恢复**：
```bash
git checkout -b recovered-branch HEAD@{5}
```

---

### 4. Rebase冲突中断

**停在了冲突点**：
```bash
# 解决完冲突后
git add .
git rebase --continue

# 想放弃rebase，恢复原状
git rebase --abort
```

**已经手动reset了？用reflog恢复**：
```bash
git reflog | grep rebase
git reset --hard ORIG_HEAD
```

---

### 5. 修改了不想提交的改动，想stash

```bash
# 暂存当前改动
git stash
git stash save "临时stash: XXX改动"

# 查看暂存列表
git stash list

# 恢复最新stash
git stash pop

# 恢复指定stash
git stash apply stash@{0}

# 删除stash
git stash drop stash@{0}
```

---

### 6. 想撤销某次文件的修改

```bash
# 撤销单个文件
git checkout -- <file>
git restore <file>  # 新语法

# 撤销所有未提交的文件
git checkout -- .
git restore .
```

---

### 7. push被拒绝（non-fast-forward）

**原因：远程有更新的提交**

解决方法：
```bash
# 方法1：先拉取再push
git pull --rebase origin <branch>
git push origin <branch>

# 方法2：强制push（小心！）
git push --force origin <branch>
```

---

### 8. 查看历史记录

```bash
# 简洁日志
git log --oneline -10

# 图形化分支
git log --graph --oneline --all

# 查找特定内容
git log -S "关键词" --oneline

# 查看某个文件的历史
git log -p <file>

# 找出谁改了某行
git blame <file>
```

---

## 危险操作警告

| 操作 | 危险等级 | 恢复方式 |
|------|---------|---------|
| `git reset --hard` | 🔴 高 | `git reflog` 恢复 |
| `git push --force` | 🔴 高 | `git reflog` + 远程恢复 |
| `git checkout .` | 🟡 中 | 无法恢复 |
| `git clean -fd` | 🔴 高 | 无法恢复（做好备份）|

**最佳实践**：危险操作前先 `git branch backup` 创建备份分支
