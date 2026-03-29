# take-skills

**AI助手技能包 — 让 Claude Code 和 Cursor 像专家一样工作**

> *如果你装了100个Skills但一个都不记得怎么用，这个项目不适合你。如果你只装5个最实用的Skills，让AI真正提升效率，take-skills就是为你设计的。*

```bash
# ⚡ 一键安装（支持 Claude Code / Cursor）
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash
```

**支持工具**：Claude Code · Cursor IDE · Windsurf · VS Code Copilot

---

## 📦 快速安装

### 选项A：全自动（推荐，第一次用必选）

**Claude Code（官方CLI）**
```bash
# 方式1：curl（一行命令搞定）
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash

# 方式2：手动下载安装脚本
wget https://raw.githubusercontent.com/an8079/take-skills/main/install.sh -O install.sh
chmod +x install.sh && ./install.sh --claude

# 安装完成后验证
claude --skills-list   # 应该看到 takes-master 等技能列表
```

**Cursor IDE（Mac/Windows/Linux）**
```bash
# 安装到全局（所有项目可用）
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash -s -- --cursor --global

# 安装到当前项目（仅当前项目可用）
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash -s -- --cursor --local
```

---

### 选项B：手动安装（高级用户）

**手动安装到 Claude Code**

```bash
# 1. 克隆仓库
git clone https://github.com/an8079/take-skills.git ~/take-skills

# 2. 创建技能目录
mkdir -p ~/.claude/skills

# 3. 复制需要的技能（这里以 takes-master 为例）
cp -r ~/take-skills/skills/takes-master ~/.claude/skills/

# 4. 在 ~/.clauderc 中注册
cat >> ~/.clauderc << 'EOF'
{
  "skills": {
    "takes-master": {
      "path": "~/.claude/skills/takes-master",
      "trigger": ["takes:", "update", "项目状态", "推送代码"]
    }
  }
}
EOF

# 5. 重启 Claude Code
```

**手动安装到 Cursor IDE**

Cursor 的 Skills 功能通过 Custom Instructions 实现：

```bash
# 1. 克隆仓库
git clone https://github.com/an8079/take-skills.git ~/take-skills

# 2. 创建 Cursor 规则目录
mkdir -p ~/.cursor/rules

# 3. 为每个 Skill 创建规则文件
cp ~/take-skills/skills/takes-master/SKILL.md ~/.cursor/rules/takes-master.md

# 4. 在 Cursor 设置中启用
#    打开 Cursor → Settings → AI → Custom Instructions
#    添加一行：@takes-master.md
```

---

## 🧠 能装哪些Skills？

### ⭐ 核心技能（必装，Claude Code/Cursor通用）

#### takes-master
**一句话**：`takes:update` — 让AI帮你管理项目，Git→检查→commit→推送完整流程

**触发方式**：在聊天框输入
```
takes:update
项目状态怎么样？
检查一下代码质量
```

**功能**：
- 自动检查Git状态和构建
- 4问质量审核（改了什么？有重复吗？是增量吗？信息自解释吗？）
- 规范化commit信息
- 推送前自动验证
- WeChat结果汇报

```bash
# 安装
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash -s -- --skill takes-master
```

---

#### code-review
**一句话**：3分钟完成代码安全+性能+质量审查

**触发方式**：
```
帮我review这段代码
审查这个函数
检查一下有没有bug
```

**输出示例**：
```
🔍 代码审查报告

✅ 综合评分：85/100
⚠️ 发现3个问题：

🔴 [R01] 高危 | SQL注入风险
   位置：user_data.py 第23行
   问题：execute() 使用字符串拼接
   修复：改用参数化查询

🟡 [R06] 中危 | 文件过长（487行）
   建议：拆分为多个模块

🟡 [R10] 中危 | 嵌套循环
   位置：processor.py 第56行
   修复：考虑使用pandas向量化操作
```

```bash
# 安装
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash -s -- --skill code-review
```

---

#### api-reviewer
**一句话**：分析REST API的安全性、规范性、性能

**触发方式**：
```
分析这个接口
审查API的安全性
检查endpoint规范
```

---

#### skill-creator
**一句话**：告诉AI你想做什么，它帮你创建完整的Skill包

**触发方式**：
```
创建一个数据清洗的skill
我要一个定时提醒的技能
```

---

### 📋 完整技能清单

| 技能 | 触发词示例 | 适合人群 |
|------|------------|---------|
| takes-master | `takes:update`、`项目状态` | 所有开发者 |
| code-review | `审查代码`、`检查bug` | 后端/全栈 |
| api-reviewer | `分析接口`、`API安全` | 后端/API开发者 |
| style-reviewer | `检查样式`、`格式化` | 前端/全栈 |
| performance-reviewer | `性能分析`、`N+1` | 全栈/架构师 |
| api-contract-testing | `接口测试`、`契约测试` | 测试/后端 |
| chaos-engineering | `容错测试`、`故障注入` | SRE/DevOps |
| property-based-testing | `属性测试`、`fuzzing` | 测试/安全 |
| git-rebase | `rebase冲突`、`解决git问题` | 所有开发者 |
| observability | `可观测性`、`日志配置` | DevOps/后端 |
| autopilot | `自动驾驶`、`批量任务` | 运营/PM |
| deep-interview | `用户访谈`、`需求挖掘` | 产品/UX |
| hud | `数据面板`、`dashboard` | 数据/PM |
| web-clone | `克隆网站`、`仿页面` | 前端/设计 |
| ecomode | `能耗优化`、`绿色计算` | 架构师 |

---

## 🔧 详细安装教程（各工具）

### Cursor IDE（最完整指南）

Cursor 是基于 VS Code 的 AI 代码编辑器，内置 Custom Instructions 功能。

#### Step 1：打开 Cursor 设置

打开 Cursor → 点击左下角 **⚙️ Settings** → 找到 **AI** 选项卡

#### Step 2：找到 Custom Instructions

在 AI 设置中，找 **Custom Instructions**（自定义指令）或 **Rules** 选项

#### Step 3：添加 Skill

有3种方式：

**方式1：直接在 Custom Instructions 里粘贴（最简单）**

```markdown
<!-- @takes-master -->
# takes-master
当用户说"takes:update"或"项目状态"时：
1. 检查Git状态
2. 执行4问质量审核
3. 执行规范commit
4. 推送并汇报

<!-- @code-review -->
# code-review
当用户发送代码并要求审查时：
1. 检查安全漏洞（SQL注入/硬编码凭证/eval）
2. 检查代码异味（过长方法/重复代码）
3. 检查性能隐患（嵌套循环/同步阻塞）
4. 输出结构化报告
```

**方式2：通过 `@` 引用外部文件（推荐，可维护）**

在 Custom Instructions 框里输入：
```
@~/.cursor/rules/takes-master.md
@~/.cursor/rules/code-review.md
```

然后把对应文件放到 `~/.cursor/rules/` 目录：

```bash
mkdir -p ~/.cursor/rules
cp /path/to/take-skills/skills/takes-master/SKILL.md ~/.cursor/rules/takes-master.md
cp /path/to/take-skills/skills/code-review/SKILL.md ~/.cursor/rules/code-review.md
```

**方式3：通过 MCP Server（进阶，适合团队）**

Cursor 支持连接 MCP Server：

1. **Settings → AI → MCP Server → Add New**
2. Server Name: `take-skills`
3. Command:
   ```bash
   cd /path/to/take-skills && python3 skill_server.py
   ```
4. 重启 Cursor

#### Step 4：验证安装成功

在 Cursor 聊天框输入：
```
takes:update
```

如果 Cursor 识别到 takes-master 技能，返回了项目状态检查流程，说明安装成功 ✅

---

### Claude Code（官方CLI）

Claude Code 是 Anthropic 官方的命令行工具，通过 `~/.claude/skills/` 管理技能。

#### Step 1：安装 Claude Code

```bash
# macOS
brew install anthropic/claude-code/claude

# Linux/WSL
curl -fsSL https://downloads.anthropic.com/claude-code/install.sh | sh

# Windows (PowerShell)
iwr https://downloads.anthropic.com/claude-code/install.ps1 -UseBasicParsing | iex
```

#### Step 2：安装 Skills

```bash
# 方法1：使用安装脚本
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash -s -- --claude

# 方法2：手动安装
mkdir -p ~/.claude/skills
cp -r /path/to/take-skills/skills/* ~/.claude/skills/
```

#### Step 3：配置触发词

编辑 `~/.clauderc`：

```bash
nano ~/.clauderc
```

添加：

```json
{
  "skills": {
    "takes-master": {
      "path": "~/.claude/skills/takes-master",
      "trigger": ["takes:", "update", "项目状态", "推送"]
    },
    "code-review": {
      "path": "~/.claude/skills/code-review",
      "trigger": ["review", "审查代码", "检查bug"]
    }
  }
}
```

#### Step 4：验证

```bash
# 测试 takes-master
claude "takes:update"

# 应该看到项目状态检查流程启动

# 测试 code-review
claude "帮我review一下 app/main.py"
```

---

### Windsurf（Codeium旗下，免费）

Windsurf 基于 VS Code，安装方式与 Cursor 类似：

```bash
# 1. 克隆仓库
git clone https://github.com/an8079/take-skills.git ~/take-skills

# 2. 复制规则文件
mkdir -p ~/.windsurf/rules
cp ~/take-skills/skills/*/SKILL.md ~/.windsurf/rules/

# 3. 在 Windsurf 设置中启用
# Super Completions → Rules → Add Rule → 选择 takes-master
```

---

### VS Code Copilot

Copilot 主要通过 `.github/copilot-instructions.md` 或 VS Code 设置中的 Custom Instructions：

```bash
# 1. 在项目根目录创建
mkdir -p .github
cp /path/to/take-skills/skills/takes-master/SKILL.md .github/copilot-instructions.md

# 2. 或在 VS Code Settings 中添加路径引用
# Settings → Extensions → Copilot → Custom Instructions → Add New → @.github/copilot-instructions.md
```

---

## 🔄 升级 Skills

```bash
# 重新运行安装脚本（自动更新到最新版本）
curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash

# 或手动更新
cd ~/take-skills && git pull
```

---

## ❓ 常见问题

**Q：安装后不生效？**
```bash
# 1. 重启工具（Claude Code/Cursor）
# 2. 检查文件是否正确放置
ls ~/.claude/skills/       # Claude Code
ls ~/.cursor/rules/        # Cursor

# 3. 检查触发词是否正确输入
```

**Q：和内置能力冲突吗？**
> 不冲突。take-skills是补充，在特定触发词出现时激活，不影响正常AI能力。

**Q：如何只安装部分Skills？**
```bash
# 只安装 takes-master + code-review
./install.sh --skill takes-master --skill code-review
```

**Q：Cursor免费版可以用吗？**
> 可以。Custom Instructions功能在免费版就支持，不需要Pro。

**Q：卸载怎么操作？**
```bash
# Claude Code
rm -rf ~/.claude/skills/takes-master

# Cursor
rm ~/.cursor/rules/takes-master.md
```

---

## 🏗️ 自定义开发新Skill

```bash
# 使用 skill-creator 自动生成
claude "创建一个XX技能"

# 或手动创建
mkdir skills/my-skill
nano skills/my-skill/SKILL.md
```

SKILL.md 标准格式：

```markdown
---
name: my-skill
description: 我的自定义技能
triggers:
  - "触发词1"
  - "触发词2"
---

# my-skill

## 触发条件
当用户说"...触发词1..."时激活

## 执行步骤
1. 步骤1
2. 步骤2

## 输出格式
返回XXX格式的结果
```

---

**GitHub**：github.com/an8079/take-skills
**版本**：v9 | 2026-03-29
