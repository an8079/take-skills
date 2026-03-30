---
name: notify
description: 通知配置与管理，支持桌面通知、Webhook、声音提醒。
---

# /notify - 通知配置

配置 Claude Code 通知，支持桌面通知、Webhook 集成、声音提醒。

## 使用方式

```
/notify
```

或

```
通知设置
配置通知
```

## 功能模块

### 1. 桌面通知

| 功能 | 说明 |
|------|------|
| **任务完成** | 主要任务完成时通知 |
| **审查完成** | 代码审查完成时通知 |
| **提问** | AI 有问题时通知 |
| **计划就绪** | ExitPlanMode 时通知 |
| **会话限制** | Session limit 到达时通知 |
| **API 错误** | API 错误时通知 |

### 2. 声音提醒

| 设置项 | 说明 |
|------|------|
| 音量控制 | 0-100% 可调 |
| 声音选择 | 内置声音或自定义 |
| 设备选择 | 指定音频输出设备 |

### 3. Webhook 集成

| 平台 | 配置 |
|------|------|
| Slack | Webhook URL, Channel |
| Discord | Webhook URL |
| Telegram | Bot Token, Chat ID |
| Lark/Feishu | Webhook URL |
| Custom | 自定义 HTTP POST |

### 4. 点击聚焦 (Click-to-Focus)

支持的终端：
- macOS: Ghostty, VS Code, iTerm2, Warp, kitty, WezTerm, Alacritty, Hyper
- Linux: GNOME Terminal, Konsole, VS Code, kitty, WezTerm, Tilix
- Windows: 通知提醒（无点击聚焦）

支持的复用器：
- tmux (含 iTerm2 -CC 模式)
- zellij
- WezTerm
- kitty

## 推荐插件

**claude-notifications-go** - Go 编写的通知插件

```bash
# 快速安装
curl -fsSL https://raw.githubusercontent.com/777genius/claude-notifications-go/main/bin/bootstrap.sh | bash
```

功能：
- 6 种通知类型
- 跨平台桌面通知
- 声音提醒
- Webhook 集成
- 点击聚焦
- Git branch 显示

## 配置示例

### 桌面通知配置

```json
{
  "notifications": {
    "desktop": {
      "enabled": true,
      "sound": true,
      "volume": 0.8,
      "clickToFocus": true
    },
    "webhook": {
      "enabled": false,
      "preset": "slack",
      "url": "https://hooks.slack.com/services/..."
    }
  },
  "statuses": {
    "task_complete": {
      "title": "✅ Completed",
      "sound": "${CLAUDE_PLUGIN_ROOT}/sounds/task-complete.mp3"
    },
    "question": {
      "title": "❓ Question",
      "sound": "${CLAUDE_PLUGIN_ROOT}/sounds/question.mp3"
    }
  }
}
```

### 通知压制规则

```json
{
  "suppressFilters": [
    {
      "name": "Suppress in specific folder",
      "status": "task_complete",
      "folder": "specific-project"
    }
  ]
}
```

## 集成命令

安装 claude-notifications-go 后：

```bash
# 初始化
/claude-notifications-go:init

# 配置设置
/claude-notifications-go:settings

# 测试声音
/claude-notifications-go:sounds
```

## 与项目的结合

通知可以在以下时机触发：

| 命令 | 时机 |
|------|------|
| `/interview` | 访谈完成时 |
| `/plan` | 计划生成时 |
| `/code` | 编码完成时 |
| `/test-teams` | 测试团队完成时 |
| `/autopilot` | 任务完成时 |

---

**提示：** 使用 `/notify` 配置你想要的提醒方式。推荐安装 claude-notifications-go 插件获得完整功能。
