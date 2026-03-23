---
name: notifications
description: 通知系统设计技能：桌面通知、Webhook、声音提醒、跨平台兼容。用于设计通知系统和集成第三方通知服务。
tags: [notifications, webhook, desktop, cross-platform, slack, discord, telegram]
---

# 通知系统设计技能

## When to Use This Skill

触发此技能当：
- 设计通知系统架构
- 集成 Webhook 通知服务
- 配置跨平台桌面通知
- 实现声音提醒功能
- 集成 claude-notifications-go 等通知插件

## Not For / Boundaries

此技能不适用于：
- 实时消息推送（需要 WebSocket）
- 邮件通知系统（需要 SMTP）
- 短信通知（需要 SMS API）

---

## Quick Reference

### 通知类型

| 类型 | 说明 | 触发时机 |
|------|------|----------|
| **Task Complete** | 任务完成 | 停止工作且有工具调用 |
| **Review Complete** | 审查完成 | 只读操作或长文本响应 |
| **Question** | 提问 | AskUserQuestion 或 Notification hook |
| **Plan Ready** | 计划就绪 | ExitPlanMode |
| **Session Limit** | 会话限制 | Session limit reached |
| **API Error** | API 错误 | 401/rate limit/server error |

### 跨平台通知实现

| 平台 | 库/工具 | 特点 |
|------|---------|------|
| **macOS** | beeep/afplay | 原生通知+系统声音 |
| **Linux** | beeep/paplay | D-Bus 通知 |
| **Windows** | beeep/PowerShell | Toast 通知 |

---

## 核心组件设计

### 1. 状态机分析

```python
class NotificationAnalyzer:
    """通知状态分析器"""

    # 工具分类
    ACTIVE_TOOLS = {"Write", "Edit", "Bash", "NotebookEdit", "SlashCommand", "KillShell"}
    PASSIVE_TOOLS = {"Read", "Grep", "Glob", "WebFetch", "WebSearch", "Task"}
    QUESTION_TOOLS = {"AskUserQuestion"}
    PLANNING_TOOLS = {"ExitPlanMode", "TodoWrite"}

    def analyze(self, transcript_path: str) -> str:
        """分析 JSONL 转录文件，确定通知类型"""

        messages = self.parse_jsonl(transcript_path)

        # 优先级检查
        if self.contains_session_limit(messages):
            return "session_limit_reached"

        # 检查最后一个工具
        last_tool = self.get_last_tool(messages)

        if last_tool == "ExitPlanMode":
            if self.has_tools_after(messages, "ExitPlanMode"):
                return "task_complete"
            return "plan_ready"

        if last_tool == "AskUserQuestion":
            return "question"

        if last_tool in self.ACTIVE_TOOLS:
            return "task_complete"

        if last_tool in self.PASSIVE_TOOLS:
            # 回退到关键词分析
            return self.keyword_analysis(messages)

        return "task_complete"
```

### 2. 去重机制

```python
import os
import time
from pathlib import Path

class DeduplicationManager:
    """两阶段去重锁"""

    def __init__(self, lock_dir: str = "/tmp"):
        self.lock_dir = Path(lock_dir)
        self.lock_dir.mkdir(exist_ok=True)

    def check_and_acquire(self, event_id: str, ttl_seconds: int = 2) -> bool:
        """
        两阶段检查：
        1. 快速检查（无锁创建）
        2. 原子获取锁
        """

        lock_file = self.lock_dir / f"{event_id}.lock"

        # Phase 1: 快速检查
        if lock_file.exists():
            age = time.time() - lock_file.stat().st_mtime
            if age < ttl_seconds:
                return False  # 重复，退出

        # Phase 2: 原子获取
        try:
            # O_EXCL 确保原子创建
            fd = os.open(str(lock_file), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            return True  # 获取锁成功
        except FileExistsError:
            # 锁已存在，检查是否过期
            age = time.time() - lock_file.stat().st_mime
            if age >= ttl_seconds:
                # 过期锁，删除后重试
                lock_file.unlink()
                return self.check_and_acquire(event_id, ttl_seconds)
            return False  # 重复
```

### 3. Webhook 发送

```python
import asyncio
import aiohttp
from typing import Dict, Any, Optional

class WebhookSender:
    """Webhook 发送器"""

    PRESETS = {
        "slack": {
            "content_type": "application/json",
            "format": lambda msg: {"text": msg}
        },
        "discord": {
            "content_type": "application/json",
            "format": lambda msg: {"content": msg, "username": "Claude Code"}
        },
        "telegram": {
            "content_type": "application/json",
            "format": lambda msg: {"text": msg}
        },
        "lark": {
            "content_type": "application/json",
            "format": lambda msg: {"msg_type": "text", "content": {"text": msg}}
        }
    }

    async def send(
        self,
        url: str,
        message: str,
        preset: str = "custom",
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 10
    ) -> bool:
        """发送 Webhook 通知"""

        preset_config = self.PRESETS.get(preset, self.PRESETS["slack"])
        payload = preset_config["format"](message)

        request_headers = {
            "Content-Type": preset_config["content_type"]
        }
        if headers:
            request_headers.update(headers)

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=payload,
                    headers=request_headers,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    return 200 <= response.status < 300
        except asyncio.TimeoutError:
            return False
        except Exception:
            return False
```

### 4. 声音播放

```python
import subprocess
import platform
from pathlib import Path

class SoundPlayer:
    """跨平台声音播放器"""

    def __init__(self, volume: float = 1.0):
        self.volume = max(0.0, min(1.0, volume))
        self.system = platform.system()

    def play(self, sound_path: str) -> bool:
        """播放声音文件"""

        path = Path(sound_path).expanduser()

        if not path.exists():
            return False

        if self.system == "Darwin":  # macOS
            return self._play_macos(path)
        elif self.system == "Linux":
            return self._play_linux(path)
        elif self.system == "Windows":
            return self._play_windows(path)

        return False

    def _play_macos(self, path: Path) -> bool:
        """macOS: 使用 afplay"""
        try:
            subprocess.run(
                ["afplay", "-v", str(self.volume), str(path)],
                check=True,
                capture_output=True
            )
            return True
        except subprocess.CalledProcessError:
            return False

    def _play_linux(self, path: Path) -> bool:
        """Linux: 尝试 paplay 或 aplay"""
        player = "paplay" if self._command_exists("paplay") else "aplay"
        try:
            subprocess.run(
                [player, str(path)],
                check=True,
                capture_output=True
            )
            return True
        except subprocess.CalledProcessError:
            return False

    def _play_windows(self, path: Path) -> bool:
        """Windows: 使用 PowerShell"""
        import tempfile
        script = f'''
            $sound = New-Object System.Media.SoundPlayer("{path.as_posix()}")
            $sound.Volume = {int(self.volume * 65535)}
            $sound.PlaySync()
        '''
        try:
            subprocess.run(
                ["powershell", "-Command", script],
                check=True,
                capture_output=True
            )
            return True
        except subprocess.CalledProcessError:
            return False

    @staticmethod
    def _command_exists(cmd: str) -> bool:
        """检查命令是否存在"""
        try:
            subprocess.run(
                ["which", cmd],
                check=True,
                capture_output=True
            )
            return True
        except subprocess.CalledProcessError:
            return False
```

---

## Webhook 集成指南

### Slack

```python
# Slack Webhook 格式
{
    "text": "✅ Task Completed: Created factorial function",
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Task Completed*\nCreated factorial function"
            }
        }
    ]
}
```

### Discord

```python
# Discord Webhook 格式
{
    "content": "✅ Task Completed: ...",
    "username": "Claude Code",
    "embeds": [
        {
            "title": "Task Complete",
            "color": 5763719,  # 绿色
            "fields": [
                {"name": "Project", "value": "my-project", "inline": True}
            ]
        }
    ]
}
```

### Telegram

```python
# Telegram Bot API 格式
{
    "chat_id": "123456789",
    "text": "✅ *Task Completed*\n\nCreated factorial function",
    "parse_mode": "Markdown"
}
```

### Lark/Feishu

```python
# Lark Webhook 格式
{
    "msg_type": "interactive",
    "card": {
        "header": {
            "title": {"tag": "plain_text", "content": "✅ Task Completed"}
        },
        "elements": [
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": "Created factorial function"}
            }
        ]
    }
}
```

---

## 通知压制规则

```python
class NotificationSuppressor:
    """通知压制器"""

    def should_suppress(
        self,
        status: str,
        git_branch: str,
        folder: str,
        filters: list
    ) -> bool:
        """检查是否应该压制通知"""

        for f in filters:
            # 每个规则的字段是 AND 关系
            match = True

            if "status" in f and f["status"] != status:
                match = False

            if "gitBranch" in f:
                if f["gitBranch"] == "":
                    # 空字符串表示非 git 仓库
                    if git_branch:  # 但实际在 git 仓库中
                        match = False
                elif f["gitBranch"] != git_branch:
                    match = False

            if "folder" in f and f["folder"] != folder:
                match = False

            if match:
                return True  # 匹配到压制规则

        return False
```

---

## Examples

### Example 1: 集成 claude-notifications-go

**场景：** 用户想为项目添加通知功能

**步骤：**
1. 安装 claude-notifications-go 插件
2. 配置桌面通知和声音
3. 配置 Webhook（如需要）

```bash
# 快速安装
curl -fsSL https://raw.githubusercontent.com/777genius/claude-notifications-go/main/bin/bootstrap.sh | bash
```

### Example 2: 自定义通知服务

**场景：** 团队使用自建的 Slack 替代品

**实现：**
```python
class CustomWebhookSender(WebhookSender):
    """自定义 Webhook"""

    PRESETS = {
        "custom_slack": {
            "content_type": "application/json",
            "format": lambda msg: {
                "msg_type": "card",
                "card": {
                    "header": {
                        "title": {"tag": "plain_text", "content": "Claude Code"}
                    }
                }
            }
        }
    }
```

### Example 3: 通知与 CI/CD 集成

**场景：** 长时间构建完成时发送通知

```python
async def notify_build_complete(build_id: str, status: str):
    """通知构建完成"""

    message = f"Build #{build_id} {'✅ Succeeded' if status == 'success' else '❌ Failed'}"

    sender = WebhookSender()

    # 发送到多个渠道
    results = await asyncio.gather(
        sender.send(SLACK_WEBHOOK, message, "slack"),
        sender.send(DISCORD_WEBHOOK, message, "discord"),
        sender.send TELEGRAM_WEBHOOK, message, "telegram")
    )

    return all(results)
```

---

## References

- [claude-notifications-go](https://github.com/777genius/claude-notifications-go)
- [beeep 库](https://github.com/gen2brain/beeep)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## Maintenance

- 来源：基于 claude-notifications-go 最佳实践
- 最后更新：2026-03-23
- 更新内容：初始版本，涵盖通知系统设计、Webhook 集成、跨平台实现
