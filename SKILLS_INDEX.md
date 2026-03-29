# take-skills 技能索引

> **理念**：技能不在多，在精。冗余即垃圾。
> **安装**：一条命令即可 → `curl -sSL https://bit.ly/takes-install | bash`
> **版本**：v8 | 2026-03-29

---

## ⭐ 核心技能（生产可用）

| 技能 | 版本 | 说明 | 命令 |
|------|------|------|------|
| takes-master | v1.0 | orchestration-service项目管理 | `/takes:update` |
| skill-creator | v1.0 | 技能创建工具 | `/skill:create` |

---

## 📦 OpenClaw 官方技能（从 clawhub 安装）

```bash
# 方式1: 命令行（需要 openclaw cli）
openclaw skills install <skill-name>

# 方式2: 一键安装脚本（无需 openclaw cli）
curl -sSL https://bit.ly/takes-install | bash
```

| 技能 | 用途 | 安装命令 |
|------|------|---------|
| weather | 天气预报 | `openclaw skills install weather` |
| minimax-pdf | PDF生成 | `openclaw skills install minimax-pdf` |
| minimax-xlsx | Excel生成 | `openclaw skills install minimax-xlsx` |
| pptx-generator | PPT生成 | `openclaw skills install pptx-generator` |
| feishu-doc | 飞书文档 | `openclaw skills install feishu-doc` |
| tencent-docs | 腾讯文档 | `openclaw skills install tencent-docs` |
| wecom-connect | 企业微信 | `openclaw skills install wecom-connect` |
| weixin-connect | 个人微信 | `openclaw skills install weixin-connect` |
| cron-mastery | 定时任务 | `openclaw skills install cron-mastery` |
| maxclaw-helper | 平台助手 | `openclaw skills install maxclaw-helper` |

---

## 🔧 takes-install.sh 一键安装器

**快速安装：**
```bash
curl -sSL https://bit.ly/takes-install | bash
```

**安装单个：**
```bash
curl -sSL https://bit.ly/takes-install | bash -s -- takes-master
```

**查看已安装：**
```bash
takes-install.sh list
```

---

## 📊 与 oh-my-claude 对比

| 维度 | oh-my-claude | take-skills |
|------|-------------|-------------|
| 技能数 | 47个 | 2个（核心）+ 10个官方 |
| 质量策略 | 精选 | **质量优先，宁缺毋滥** |
| 安装方式 | 手动复制 | **一键脚本** |
| 更新机制 | 无自动 | 每4小时自动巡检 |

> take-skills 的理念：用户反馈109个skills拖慢Agent，清理后反而更好用。
> 所以take-skills只保留真正有价值的，壳子全部不要。
