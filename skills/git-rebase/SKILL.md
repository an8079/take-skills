---
name: git-rebase
description: "Git interactive rebase, history rewriting, and advanced branching strategies. Use when cleaning up commit history before PR, splitting or squashing commits, fixing commit messages, reordering commits, or resolving complex rebase conflicts. Covers git rebase -i, reflog, filter-branch, and bisect combined with rebase workflows."
---

# Git Rebase — Craft a Clean History

## Core Mental Model

```
Before rebase (merge commits clutter history):
A───M───A'───M'───A''     (M = merge commits)

After rebase (linear, readable):
A───A'───A''───A'''       (no merge commits, one clean line)
```

**Golden rule: Never rebase commits that have been pushed to a shared branch.**

## Interactive Rebase (git rebase -i)

### How it works
```bash
# Rebase last N commits interactively
git rebase -i HEAD~3

# Opens editor with:
pick abc1234 Add user authentication
pick def5678 Fix typo in auth
pick ghi9012 Add password validation

# Editor commands (change "pick" to these):
pick   → keep commit as-is
reword → keep commit, change message
edit   → stop here, amend/rebase manually
squash → combine with previous commit
fixup  → like squash, discard this commit's message
drop   → remove commit
reorder→ move lines up/down
```

### Example: Clean up a messy branch before PR
```bash
git rebase -i HEAD~5
```
```
pick  a1b2c3d WIP: started auth
pick  e4f5g6h WIP: auth working
pick  i7j8k9l Fixed bug in auth (oops, went in wrong commit)
pick  m1n2o3p Add password validation
pick  q4r5s6t Final polish

# Change to:
pick  a1b2c3d WIP: started auth
f     i7j8k9l Fix bug in auth (squash into previous)
f     e4f5g6h WIP: auth working (squash into first)
pick  m1n2o3p Add password validation
r     q4r5s6t Final polish: add complete auth flow
```

Result: **3 clean commits** instead of 5 messy ones.

## Common Operations

### 1. Squash consecutive commits
```bash
# Squash last 3 commits into one
git rebase -i HEAD~3
# Mark 2nd and 3rd as "squash" or "fixup"
```

### 2. Split a commit into multiple
```bash
git rebase -i HEAD~1
# Mark the commit as "edit"

# When rebase stops at that commit:
git reset HEAD~1
# Now commit pieces separately:
git add src/auth.go && git commit -m "Add auth package"
git add src/auth_test.go && git commit -m "Add auth tests"
git add src/middleware.go && git commit -m "Add auth middleware"

# Continue rebase:
git rebase --continue
```

### 3. Reorder commits
```bash
git rebase -i HEAD~4
# Move commit lines to reorder
# e.g., move "Add tests" before "Add feature"
```

### 4. Edit an old commit message
```bash
git rebase -i HEAD~5
# Change "pick" to "reword" for the relevant commit
```

### 5. Drop a commit entirely
```bash
git rebase -i HEAD~5
# Change "pick" to "drop" for the commit to remove
```

### 6. Apply a commit from one branch onto another (rebase vs cherry-pick)
```bash
# Cherry-pick: apply specific commits from anywhere
git cherry-pick abc1234

# Rebase: move entire branch on top of another
git checkout feature
git rebase main
# Now feature/ is on top of main/
```

## Conflict Resolution During Rebase

```bash
# When conflicts occur during rebase:
git status
# → both modified: src/auth.go

# Fix the conflict manually:
vim src/auth.go  # resolve <<<<<< and >>>>>> markers

git add src/auth.go
git rebase --continue

# If you want to abandon the rebase entirely:
git rebase --abort
```

### Rebasing with autosquash (auto-group fixup commits)
```bash
#标记fixup的提交:
git commit --fixup abc1234

#稍后自动squash:
git rebase -i --autosquash main
```

## Branching Strategies Compared

### Git Flow (Heavy)
```
main ──────────────────────────── (production releases)
  └ develop ──────────────────── (integration)
       ├─ feature/user-auth ──── (rebase onto develop, squash)
       ├─ feature/billing ──────
       └─ release/1.4 ───────── (rebase, test, merge)
```

### Trunk-Based Development (Light)
```
main ──●───●───●───●───●──●─── (everyone commits to main)
          └─ feature/auth
          └─ feature/billing
          # Short-lived branches (< 1 day), rebase onto main frequently
```

### Rebase Workflow
```bash
# Daily workflow (trunk-based):
git checkout main && git pull --rebase
git checkout -b feature/auth

# Make commits (clean, atomic):
git add src/auth.go && git commit -m "Add JWT token generation"
git add src/auth_test.go && git commit -m "Test JWT token generation"

# Before PR:
git fetch origin
git rebase -i origin/main
# Squash, reorder, clean up

# Push (with force to update PR):
git push --force-with-lease  # --force-with-lease is safer than --force
```

## Reflog — Your Safety Net

```bash
# See everything you've done (even after rebase --abort):
git reflog
# 3a2b1c0 HEAD@{0}: rebase (finish): returning to refs/heads/feature/auth
# 9x8y7z6 HEAD@{1}: rebase (interactive): editing
# ...

# Restore to before a bad rebase:
git checkout feature/auth
git reset --hard HEAD@{1}  # or use the specific reflog entry

# Or recover a "lost" commit:
git reflog | grep "abc123"  # find where the commit was
git cherry-pick abc1234      # apply it back
```

## Advanced: filter-repo

For mass history rewriting (remove secrets, rename files across history):
```bash
# Install
pip install git-filter-repo

# Remove a file from entire history (e.g., accidentally committed secrets)
git filter-repo --path secret.txt --invert-paths --force

# Rename file throughout history
git filter-repo --path-rename old_name/:new_name/ --force

# Change committer emails across entire history
git filter-repo --mailmap author-script  # see git-shortlog(1)
```

⚠️ **filter-repo rewrites history permanently. Always work on a fresh clone.**

## Rebase vs Merge — When to Use Each

| Situation | Use |
|-----------|-----|
| Cleaning up local commits before PR | `rebase -i` |
| Bringing feature up to date with main | `rebase` |
| Integrating a finished feature branch | `merge` |
| Collaborative/shared branches | `merge` (never `rebase`) |
| Fast-forward only (clean history) | `git merge --ff-only` |
| Public/shared branch has bad commits | `git revert` (never rebase) |
| Long-running feature branch | Periodic rebase onto main |

## Pre-PR Checklist

Before pushing and opening a PR:
```
□ Rebased onto latest target branch
□ Commits are atomic (one logical change per commit)
□ No "WIP" or "fix" commits (squash them)
□ Commit messages follow convention: type(scope): description
□ Force-with-lease used (not force push)
□ Tests pass locally
□ History is readable as a story
```

## Commit Message Convention

```
type(scope): short description (50 chars max)

Optional longer description (wrap at 72 chars)

Footer: references/issues

Types:
  feat:     new feature
  fix:      bug fix
  refactor: code change that neither fixes a bug nor adds a feature
  test:     adding or correcting tests
  docs:     documentation only
  chore:    maintenance tasks (deps, config)
  perf:     performance improvement

Examples:
  feat(auth): add JWT token generation and validation
  fix(checkout): prevent negative quantity in cart
  refactor(orders): extract payment service from order controller
  test(api): add property-based tests for order serialization
```

---

## When to Trigger This Skill

- Cleaning up commit history before PR
- Interactive rebase, squash, reorder, or split commits
- Rebase conflict resolution
- Git history archaeology (who wrote this, why)
- git reflog to recover from mistakes
- filter-repo for mass history rewriting
- Git workflow advice (rebase vs merge)
- Fixing commit messages after push

---

*Last updated: 2026-03-28*
