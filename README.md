# take-skills

> AI助手技能包 — 让Claude Code和Cursor更强大

**理念**：质量优先，精而不多。每个Skill都有真实用途。

---

## 🎯 一、这是什么

take-skills是一套AI助手增强包，包含：

| 类别 | 数量 | 说明 |
|------|------|------|
| 核心技能 | 2个 | takes-master项目管理 / skill-creator技能创建 |
| 专项技能 | 14个 | 代码审查、API测试、性能分析、样式检查等 |

**不需要全部安装**，按需选取。

---

## 🔧 二、安装到 Cursor

Cursor支持两种方式：

### 方式A：通过Cursor AI面板（最简单）

**Step 1：打开Cursor设置**
```
1. 打开Cursor
2. 点击左下角 ⚙️ 设置
3. 找到 "AI" 或 "Prompts" 选项卡
4. 找到 "Custom Skills" 或 "Custom Instructions"
```

**Step 2：添加Skill**
1. 打开 `skills/` 目录下的任意一个技能文件夹
2. 复制 `SKILL.md` 的全部内容
3. 粘贴到Cursor的Custom Instructions里
4. 保存

**Step 3：验证**
在任意聊天窗口输入技能的触发词，例如输入：
```
"帮我用api-reviewer分析这个接口"
```
Cursor识别到触发词，自动调用对应技能。

---

### 方式B：通过Cursor的Rules配置（推荐进阶用法）

**Step 1：找到Cursor配置目录**

macOS：
```
~/.cursor/
```

Windows：
```
C:\Users\<用户名>\.cursor\
```

**Step 2：编辑全局规则**
```bash
# 打开配置目录
cd ~/.cursor

# 查看现有配置
ls -la
```

**Step 3：创建skill规则文件**

在 `~/.cursor/rules/` 目录下（如果没有就新建）：
```bash
mkdir -p ~/.cursor/rules
```

为每个skill创建单独的规则文件，例如 `api-reviewer.md`：
```markdown
# Cursor Rule: api-reviewer
# 用途：自动分析API接口的安全性、性能和规范性

当用户说"分析接口"、"审查API"、"检查endpoint"时：
1. 读取用户提供的API定义文件
2. 按照以下维度审查：
   - 安全性：认证方式、权限控制、输入校验
   - 性能：响应时间、缓存策略、限流机制
   - 规范：RESTful风格、错误码设计、版本管理
3. 输出格式：
   - 问题描述
   - 严重程度（高/中/低）
   - 修复建议
```

**Step 4：在cursor-settings.json中启用**
找到 `settings.json` 或 `cursor.settings`：
```json
{
  "rules": [
    {
      "name": "api-reviewer",
      "file": "~/.cursor/rules/api-reviewer.md",
      "trigger": ["分析接口", "审查API", "检查endpoint"]
    },
    {
      "name": "code-review",
      "file": "~/.cursor/rules/code-review.md", 
      "trigger": ["审查代码", "检查bug", "review"]
    }
  ]
}
```

**Step 5：重启Cursor**
修改配置后，重启Cursor使规则生效。

---

### 方式C：通过Cursor的 MCP（Machine Learning Control Plane）

**Step 1：打开Cursor Settings → MCP Server**
```
Settings → AI → MCP Server → Add New
```

**Step 2：添加本地Skill服务**
Server Name: `take-skills`
Command: 
```bash
cd /path/to/take-skills && python3 skill_server.py
```

**Step 3：在skill_server.py中配置路由**
```python
# skill_server.py 示例
from flask import Flask, request, jsonify

app = Flask(__name__)

SKILLS = {
    "api-reviewer": "./skills/api-reviewer/SKILL.md",
    "code-review": "./skills/code-review/SKILL.md",
}

@app.route("/skill/<name>", methods=["POST"])
def invoke_skill(name):
    if name not in SKILLS:
        return jsonify({"error": "Skill not found"}), 404
    
    with open(SKILLS[name]) as f:
        content = f.read()
    
    return jsonify({"content": content, "skill": name})

app.run(port=3000)
```

---

## 🧠 三、安装到 Claude Code（Claude官方CLI）

Claude Code通过 `~/.claude/` 目录管理技能。

### 方式A：SKILL.md直接导入（最简单）

**Step 1：找到Claude Code的skill目录**
```bash
# Claude Code默认skill目录
ls -la ~/.claude/skills/
```

如果没有，自己创建：
```bash
mkdir -p ~/.claude/skills
```

**Step 2：复制SKILL.md文件**

从本仓库复制需要的技能到Claude Code目录：
```bash
# 方式1：单个skill
cp -r skills/code-review ~/.claude/skills/

# 方式2：全部skill（不推荐，太多了）
cp -r skills/* ~/.claude/skills/
```

**Step 3：在.clauderc中注册**
```bash
# 打开配置
nano ~/.clauderc
```

添加：
```json
{
  "skills": {
    "code-review": {
      "path": "~/.claude/skills/code-review",
      "trigger": ["review", "审查代码", "检查bug"]
    },
    "api-reviewer": {
      "path": "~/.claude/skills/api-reviewer",
      "trigger": ["api", "接口分析", "endpoint"]
    },
    "takes-master": {
      "path": "~/.claude/skills/takes-master",
      "trigger": ["takes:", "update", "项目管理"]
    }
  }
}
```

**Step 4：验证**
```bash
# 测试skill是否加载
claude --skills-list

# 测试触发
claude "用code-review分析一下这个函数"
```

---

### 方式B：通过CLAUDE.md项目级配置（推荐）

在项目根目录创建 `CLAUDE.md`：
```markdown
# Project Skills

## 代码审查 (code-review)
当输入包含以下关键词时触发：审查代码、review、检查bug
<!-- 技能内容来自 skills/code-review/SKILL.md -->
<!-- BEGIN SKILL -->
[这里粘贴SKILL.md的内容]
<!-- END SKILL -->

## API分析 (api-reviewer)
当输入包含以下关键词时触发：分析接口、API审查
<!-- BEGIN SKILL -->
[这里粘贴SKILL.md的内容]
<!-- END SKILL -->
```

Claude Code启动时会自动读取项目目录下的 `CLAUDE.md`，其中的技能定义会自动加载。

---

### 方式C：通过环境变量配置

```bash
# 在~/.bashrc 或 ~/.zshrc 中添加
export CLAUDE_SKILLS_DIR="/path/to/take-skills/skills"
export CLAUDE_DEFAULT_SKILL="takes-master"
```

然后：
```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

---

## 📋 四、所有Skill一览（按用途分类）

### 核心技能（必装）

| Skill | 触发词 | 用途 |
|-------|---------|------|
| takes-master | `takes:update`、`项目状态`、`推送代码` | orchestration-service项目管理，Git状态+质量审核+推送 |
| skill-creator | `创建技能`、`/skill:create` | 从零创建新技能，自动生成SKILL.md |

### 代码质量（推荐）

| Skill | 触发词 | 用途 |
|-------|---------|------|
| code-review | `审查代码`、`检查bug`、`review` | 安全漏洞+代码异味+性能隐患，3分钟输出结构化报告 |
| api-reviewer | `分析接口`、`审查API`、`endpoint` | RESTful规范+安全性+性能，输出问题+严重程度+修复建议 |
| style-reviewer | `检查样式`、`样式问题` | 代码风格统一，格式化建议 |
| performance-reviewer | `性能分析`、`优化建议` | 性能瓶颈识别，N+1查询等检测 |

### 测试与DevOps

| Skill | 触发词 | 用途 |
|-------|---------|------|
| api-contract-testing | `接口测试`、`contract test` | 自动化API契约测试 |
| chaos-engineering | `混沌工程`、`容错测试` | 故障注入测试 |
| property-based-testing | `属性测试`、`fuzzing` | 基于属性的测试生成 |

### Git与协作

| Skill | 触发词 | 用途 |
|-------|---------|------|
| git-rebase | `rebase冲突`、`git问题` | 自动分析rebase冲突并提供解决方案 |
| observability | `可观测性`、`日志问题` | 日志+指标+链路追踪配置建议 |

### 产品与设计

| Skill | 触发词 | 用途 |
|-------|---------|------|
| web-clone | `克隆网站`、`仿制页面` | 输入URL生成页面结构和样式 |
| ecomode | `能耗优化`、`环保设计` | 代码环保分析 |
| autopilot | `自动驾驶模式`、`批量任务` | 批量任务自动化执行 |
| deep-interview | `用户访谈`、`需求挖掘` | 产品需求深度访谈 |
| hud | `数据面板`、`驾驶舱` | 数据可视化驾驶舱生成 |
| ralplan | `研究规划`、`RFP分析` | 研究计划制定和分析 |

---

## 🚀 五、推荐安装方案

### 方案A：最小化（只装最常用的）

```bash
# 只装这3个
cp -r skills/takes-master ~/.claude/skills/
cp -r skills/code-review ~/.claude/skills/
cp -r skills/api-reviewer ~/.claude/skills/
```

### 方案B：完整安装（按需取用）

```bash
# 复制全部
cp -r skills/* ~/.claude/skills/

# 编辑~/.clauderc，只启用需要的
nano ~/.clauderc
```

---

## ❓ 六、常见问题

**Q：安装后不生效？**
```
1. 重启Claude Code / Cursor
2. 检查触发词是否正确输入
3. 检查配置文件格式（JSON是否有效）
```

**Q：和Cursor/C4内置能力冲突？**
```
take-skills是补充，不是替代。内置能力照常使用，
skill只在特定触发词出现时激活。
```

**Q：如何卸载？**
```
删除对应的rule文件或skill目录即可：
rm -rf ~/.claude/skills/code-review
```

---

## 📦 七、自定义开发新Skill

```bash
# 使用skill-creator
claude "创建一个数据分析的skill"

# 或手动创建
mkdir skills/my-skill
nano skills/my-skill/SKILL.md
# 参考已有skill的格式编写
```

---

**项目地址**：github.com/an8079/take-skills
**版本**：v9 | 2026-03-29
