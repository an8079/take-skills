# 📦 take-skills 每日调研报告

> 日期：2026-03-27（北京时间）
> 执行：自动 cron（每日 00:00 UTC）

---

## 一、大合爱AI日报 & 行业趋势

### 2026年3月核心趋势

| 趋势 | 描述 | 技能机会 |
|------|------|---------|
| **Flow Engineering 崛起** | 从 Prompt Engineering 升级为多 Agent 协作流程设计，2026年主流方向 | 流程编排技能需求爆发 |
| **AEO（Agent Engine Optimization）** | Kantar 报告：未来营销人核心技能是"流程设计力" | Agent 输出优化成新赛道 |
| **MCP 协议标配化** | 2026年每 4 个 Skills 中有 1 个基于 MCP 协议构建 | MCP Server 开发需求旺盛 |
| **本地 AI 普及** | Ollama + Open WebUI 让私有化部署成为主流 | 本地推理优化技能 |
| **可视化 Agent 流** | Langflow、Dify、n8n 使非 ML 工程师也能构建 AI 应用 | 低代码 Agent 构建技能 |

### GitHub 热门 AI 仓库（2026-03）
- **OpenClaw**（本平台）：个人 AI 助手，本地运行
- **n8n**：开源工作流自动化 + AI 原生功能
- **Ollama**：本地 LLM 运行管理框架
- **Langflow / Dify**：可视化 AI Agent 构建平台
- **DeepSeek-V3**：开源模型，性能对标 GPT-4
- **Google Gemini CLI**：终端集成多模态模型
- **RAGFlow**：开源 RAG 引擎 + Agentic 功能

---

## 二、gstack 新功能调研

**来源**：[garrytan/gstack](https://github.com/garrytan/gstack)（Garry Tan，Y Combinator CEO）

### 2026-03 新增技能（10个）

| 技能 | 角色 | 核心能力 |
|------|------|---------|
| `/cso` | Chief Security Officer | OWASP Top 10 + STRIDE 威胁建模，17个低噪误报规则，8/10+ 置信度门禁 |
| `/autoplan` | Review Pipeline | CEO→设计→工程评审全自动链路，编码决策原则，仅提交品味决策供人工审批 |
| `/codex` | Second Opinion | OpenAI Codex CLI 独立审查，pass/fail gate + 对抗挑战，跨模型分析 |
| `/browse` | QA Engineer | 真实 Chromium 浏览器，~100ms/命令，支持 headed 模式实时观看 |
| `/careful` | Safety Guardrails | destructive 命令预警（rm -rf、DROP TABLE、force-push）|
| `/freeze` | Edit Lock | 文件修改范围锁，防止调试时意外改动其他目录 |
| `/guard` | Full Safety | /careful + /freeze 二合一，最大安全模式 |
| `/setup-deploy` | Deploy Configurator | 检测平台、生产 URL、部署命令，一次性配置 |
| `/gstack-upgrade` | Self-Updater | 检测全局/vendored 安装，自动同步升级 |
| `/design-consultation` | Design Partner | 从零构建完整设计系统，竞品调研，生成逼真原型 |

### gstack 完整生命周期（2026-03版）
```
Think → office-hours → plan → implement → review → QA → ship → reflect
         ↓                ↓           ↓
    plan-ceo-review  plan-eng-review  review
         ↓                ↓           ↓
    plan-design-review  test-plan    /qa
         ↓
 design-consultation
```

---

## 三、alirezarezvani/claude-skills v2.0.0 新技能

**来源**：[alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)（192+ Skills）

### 新增技能（5个）

| 技能 | 用途 |
|------|------|
| `git-worktree-manager` | Git worktree 生命周期管理 + 清理自动化脚本 |
| `mcp-server-builder` | OpenAPI 规范 → MCP scaffold + manifest validator |
| `changelog-generator` | Release note 自动生成 + conventional commit lint |
| `ci-cd-pipeline-builder` | 技术栈检测 + 智能 CI/CD pipeline 生成 |
| `prompt-engineer-toolkit` | Prompt A/B 测试 + 版本/diff 管理工具 |

---

## 四、本次更新内容

### 新增技能（15个）

#### gstack 来源（10个）
- `cso` - 首席安全官
- `autoplan` - 全自动评审管道
- `codex` - 第二意见
- `browse` - 真实浏览器QA
- `careful` - 安全护栏
- `freeze` - 编辑锁
- `guard` - 组合安全
- `setup-deploy` - 部署配置
- `gstack-upgrade` - 自更新
- `design-consultation` - 设计伙伴

#### alirezarezvani 来源（5个）
- `git-worktree-manager` - Git worktree 管理
- `mcp-server-builder` - MCP 服务器生成
- `changelog-generator` - Release note 生成
- `ci-cd-pipeline-builder` - CI/CD pipeline 生成
- `prompt-engineer-toolkit` - Prompt 工程工具包

### 更新文件
- `CHANGELOG.md`：新增 2026-03-27 更新条目
- `SKILLS_INDEX.md`：技能总数从 73 更新至 88，新增 3 个分类条目

### GitHub 推送
- Commit: `c4ab1d9` ✅
- Branch: `main` → pushed ✅

---

## 五、下一步优先级

1. **高优先级**：将 `/cso`（首席安全官）和 `/autoplan`（评审管道）落地为完整 SKILL.md
2. **中优先级**：将 `mcp-server-builder`（OpenAPI → MCP）集成到现有 mcp-protocol 技能
3. **持续跟踪**：AEO（Agent Engine Optimization）新兴领域，监控 Google SEO 算法变化
4. **低代码趋势**：调研 Langflow/Dify 集成机会，考虑新增可视化 Agent 构建技能

---

*调研来源：garrytan/gstack GitHub、alirezarezvani/claude-skills v2.0.0、ByteByteGo 2026 Top AI GitHub Repositories、掘金 2026年3月 AI 行业速递*
