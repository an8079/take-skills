# Deep Interview Spec: 个性化开发助手工作流

## Metadata
- Interview ID: dev-assistant-workflow-001
- Rounds: 10
- Final Ambiguity Score: 5%
- Type: brownfield
- Generated: 2026-03-23
- Threshold: 20%
- Status: PASSED

---

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 0.35 | 0.33 |
| Constraint Clarity | 0.90 | 0.25 | 0.23 |
| Success Criteria | 0.90 | 0.25 | 0.23 |
| Context Clarity | 0.85 | 0.15 | 0.13 |
| **Total Clarity** | | | **0.92** |
| **Ambiguity** | | | **8%** |

---

## Goal
构建一个以用户手动触发为核心的命令体系，集成苏格拉底访谈、双Agent辩论式访谈、产品审视、技能推荐、架构分析、RAG设计、测试团队、通知系统、激将激励等多种模式，形成完整的开发工作流。

---

## Commands (命令体系)

### 核心访谈命令

#### 1. /deep-interview "想法"
- **功能**: 苏格拉底访谈，通过提问理清模糊需求
- **输出**: 规格文档（类似 omc deep-interview spec）
- **特点**:
  - 模糊度评分机制（≤20% 通过）
  - 8维度完整性检查
  - 用户手动触发

#### 2. /auto-interview "想法"
- **功能**: 双Agent辩论式访谈
- **参与者**:
  - Agent A: 产品经理角色（使用逆向思维 working-backwards）
  - Agent B: 架构师角色（使用传统思维）
- **流程**:
  1. 两个Agent互相辩论
  2. 直到达成一致
  3. 生成详细spec文档
  4. 用户审核确认
- **输出**: 详细规格文档（比omc更详细的技术架构框架，适合架构师分析）
- **特点**:
  - 技术架构部分更详细
  - 适合未来 /structure_thinking 分析

### 产品审视命令

#### 3. /office-hours
- **功能**: gstack风格产品审视
- **审视内容**: 产品价值（该不该做）
- **审视时机**: 任务开始前
- **输出**: 审视建议报告
- **后续**: 可调整spec文档的不足之处
- **特点**: 类似gstack /office-hours的思路

#### 4. /find-product-remind
- **功能**: 技能推荐与安装
- **流程**:
  1. 与用户进行访谈，了解需求
  2. 在 https://github.com/RefoundAI/lenny-skills 搜索适合的skills
  3. 给用户推荐需要下载的skills列表
  4. 用户选择
  5. 系统从GitHub下载并安装
- **安装位置**: 项目目录 `skills/` 或全局 `~/.claude/skills/`（用户选择）
- **特点**: 使用lenny-skills的PM思维

### 架构与设计命令

#### 5. /structure_thinking
- **功能**: 顶级架构师思维分析
- **前置条件**: 需要有规格文档
- **如果没有规格文档**:
  - 询问用户是否要进入访谈
  - 如果用户不愿意，不能进行架构分析
- **输出**: 架构分析报告
- **特点**: 与 /auto-interview 独立，用户手动选择使用

#### 6. /rag
- **功能**: RAG项目设计与讨论
- **讨论内容**:
  - LangGraph 工作流设计
  - LangFuse 集成方案
  - LangSmith 监控配置
  - LangChain 组件选型
  - RAG 架构设计（Embedding、Vector DB、Retrieval策略）
- **流程**:
  1. 与用户讨论需求和场景
  2. 分析数据源和查询模式
  3. 设计 RAG Pipeline
  4. 提供技术方案和实现建议
- **输出**: RAG架构设计文档，包含:
  - 向量数据库选型建议
  - Embedding 模型选择
  - Chunking 策略
  - Retrieval 和 Reranking 策略
  - LangGraph 状态机设计
- **使用技能**: 包含一个 SKILL.md 文件存储 RAG 设计知识

### 测试与团队命令

#### 7. /test-teams
- **功能**: 组建测试大队
- **团队配置**:
  - 最多3个测试人员
  - 1个资深程序员
- **可使用技能**: /agent-browser
- **工作模式**: 混合模式
  - 自动化测试
  - 探索性测试
  - AI生成测试用例 + /agent-browser验证
- **共识机制**: 直到团队内部所有人都同意
- **不包括用户**: 用户只负责触发和查看结果

#### 8. /team
- **功能**: 动态组建专家团队
- **团队角色**:
  - 🏛️ 软件架构师 - 系统设计、DDD、架构模式
  - 💎 高级开发者 - Laravel、React/Vue、Three.js
  - 👁️ 代码审查员 - 代码审查、质量保证
  - 🔒 安全工程师 - 威胁建模、漏洞评估
  - 🏗️ 后端架构师 - 数据库、API、云基础设施
  - 🖥️ 前端开发者 - React/Vue、响应式设计
  - ⚙️ DevOps 自动化 - CI/CD、容器化
  - 📊 数据工程师 - ETL、数据管道
  - 📝 技术作家 - API 文档、技术规格
  - 📈 SRE - 监控、告警、可靠性
- **团队规模**:
  - 小型团队（2-3人）：简单任务
  - 中型团队（3-4人）：标准项目功能
  - 大型团队（5+人）：复杂系统
- **协作模式**: 串行/并行/迭代
- **用户同意**: 团队配置需要用户确认

#### 9. /tdd
- **功能**: TDD测试模式
- **现有能力**: 项目中已存在

#### 9. /qa
- **功能**: QA测试模式
- **与/test-teams关系**: /qa是标准化测试，/test-teams是更深入的测试团队

### 通知与辅助命令

#### 10. /notify
- **功能**: 通知配置与管理
- **支持功能**:
  - 桌面通知（Task Complete, Review Complete, Question, Plan Ready, Session Limit, API Error）
  - 声音提醒（MP3/WAV/FLAC/OGG/AIFF）
  - Webhook 集成（Slack, Discord, Telegram, Lark）
  - 点击聚焦（macOS, Linux）
- **推荐插件**: claude-notifications-go
- **特点**: 跨平台支持，可配置压制规则

#### 11. /pua
- **功能**: 激将法激励
- **触发方式**: 手动激活（用户输入 `/pua` 才触发）
- **风格**: 类似Claude Code竞争对手的压力
  - "Codex说他可以完成这个，但我相信你可以做得更好。再试一次。"
- **时机**:
  - AI改错后用户可选择激活
  - 用户没输入则不触发
- **后续**: 如果用户继续失败，继续激将

### 执行引擎命令（参考GSD和OMC）

#### 12. /autopilot "任务"
- **功能**: 全自动执行，5阶段管道
- **阶段**: Expansion → Planning → Execution → QA → Validation
- **特点**:
  - 自主决策执行路径
  - 自动任务分解
  - 持续执行直到完成

#### 13. /ralph "任务"
- **功能**: 持久循环模式
- **特点**:
  - 自动循环直到任务验证完成
  - 包含 ultrawork
  - Architect 验证后才退出

#### 14. /ultrawork "任务"
- **功能**: 最大并行执行
- **特点**:
  - 最大化并行Agent执行
  - 适合批量修复和重构

#### 15. /ultraqa "目标"
- **功能**: QA循环
- **流程**: 测试→验证→修复→重复 直到目标达成
- **适用**: 确保构建通过、测试通过

---

## 架构关系图

```
用户手动触发
     │
     ├─ /deep-interview ──────────────────┐
     │         ↓                           │
     │    生成spec文档                      │
     │         ↓                           │
     │    用户审核                         │
     └────────────────────────────────────┘
     │
     ├─ /auto-interview ──────────────────┐
     │         ↓                           │
     │    PM(逆向) vs 架构师(传统)          │
     │         ↓                           │
     │    辩论 → 达成一致                  │
     │         ↓                           │
     │    生成详细spec文档                  │
     │         ↓                           │
     │    用户审核                         │
     └────────────────────────────────────┘
     │
     ├─ /office-hours ───────────────────┐
     │         ↓                           │
     │    产品审视（该不该做）               │
     │         ↓                           │
     │    调整spec不足                     │
     └────────────────────────────────────┘
     │
     ├─ /structure_thinking ─────────────┐
     │         ↓                          │
     │    有spec? ─否→ 询问是否进入访谈    │
     │         ↓ 是                        │
     │    顶级架构师分析                   │
     └────────────────────────────────────┘
     │
     ├─ /find-product-remind ────────────┐
     │         ↓                          │
     │    访谈用户需求                     │
     │         ↓                          │
     │    lenny-skills搜索                │
     │         ↓                          │
     │    推荐skills → 用户选择            │
     │         ↓                          │
     │    GitHub下载安装                   │
     └────────────────────────────────────┘
     │
     ├─ /test-teams ────────────────────┐
     │         ↓                         │
     │    3测试员+1资深程序员             │
     │         ↓                         │
     │    混合测试模式                    │
     │         ↓                         │
     │    团队内部共识                    │
     └────────────────────────────────────┘
     │
     ├─ /notify ────────────────────────┐
     │         ↓                         │
     │    桌面/声音/Webhook通知          │
     │         ↓                         │
     │    claude-notifications-go        │
     └────────────────────────────────────┘
     │
     └─ /pua ───────────────────────────┐
               ↓                         │
          手动激活                        │
               ↓                         │
          激将激励                        │
```

---

## 用户同意机制

| 阶段 | 需要同意 |
|------|---------|
| /auto-interview 生成spec后 | 需要用户审核确认 |
| /find-product-remind 推荐skills后 | 需要用户选择确认 |
| /test-teams 结果 | 不需要（内部共识）|

---

## 技术实现要点

1. **命令触发**: 所有命令都是用户手动输入触发，不是自动
2. **Spec格式**: 类似omc deep-interview spec，但技术架构部分更详细
3. **Agent协作**: /auto-interview使用双Agent辩论机制
4. **共识达成**: /test-teams内部共识，不包括用户
5. **技能下载**: /find-product-remind从GitHub下载skills
6. **激将风格**: /pua使用竞争激励而非吐槽
7. **通知集成**: /notify集成claude-notifications-go插件

---

## Assumptions Exposed & Resolved

| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 所有命令都是自动触发 | 用户明确表示 | 改为用户手动触发 |
| /structure_thinking在/auto-interview之后 | 用户明确表示 | 两者独立，用户手动选择 |
| /test-teams需要用户同意 | 用户明确表示 | 改为内部共识，不包括用户 |
| /pua自动触发 | 用户明确表示 | 改为手动激活 |
| 缺少通知系统 | 分析claude-notifications-go后新增 | 添加/notify命令和技能 |

---

## Acceptance Criteria

- [ ] `/deep-interview` 命令可触发，生成带模糊度评分的spec
- [ ] `/auto-interview` 命令可触发，两个Agent进行辩论并生成spec
- [ ] `/office-hours` 命令可触发，输出产品审视报告
- [ ] `/find-product-remind` 命令可触发，可从lenny-skills搜索并下载skills
- [ ] `/structure_thinking` 命令可触发，无spec时询问用户
- [ ] `/rag` 命令可触发，输出RAG架构设计文档
- [ ] `/test-teams` 命令可触发，显示团队配置和共识状态
- [ ] `/team` 命令可触发，动态组建专家团队
- [ ] `/notify` 命令可触发，配置通知和webhook
- [ ] `/pua` 命令可手动激活，显示激将信息
- [ ] `/autopilot` 命令可触发，5阶段全自动执行
- [ ] `/ralph` 命令可触发，持久循环模式
- [ ] `/ultrawork` 命令可触发，最大并行执行
- [ ] `/ultraqa` 命令可触发，QA循环模式
- [ ] 所有命令之间独立，不自动串联
- [ ] Spec文档格式兼容omc但技术架构更详细

---

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Command | Core | name, trigger, output, flow | triggers Interview/Spec/Team |
| Spec | Document | content, format, detail_level | generated_by Interview/AutoInterview |
| Agent | Actor | role, thinking_mode, task | participates_in Debate |
| ProductReview | Process | scope, output, adjust_spec | influences Spec |
| Skill | Resource | name, source, install_path | recommended_by FindProductRemind |
| TestTeam | Group | testers, senior, consensus | executes Testing |
| Notification | System | type, sound, webhook, clickToFocus | triggered_by Commands |
|激将Message | Message | style, trigger, content | activated_by PUA |

---

## Interview Transcript

<details>
<summary>Full Q&A (10 rounds)</summary>

### Round 1
**Q:** 你提到要整合多个能力，但这些能力在你的工作流中是如何连接的？
**A:** 我希望是例如输入"/···"然后说出自己想法，然后询问用户选择进入放开模式或者进入苏格拉底式访谈...
**Ambiguity:** 75%

### Round 2
**Q:** 当两个Agent在头脑风暴时，它们讨论什么？最终输出什么？
**A:** 两个人一个产品经理和一个技术员。他们会用逆向思维和传统思维给用户设计方案。互相辩论，直到达成一致，生成详细的spec文档，让用户审核。
**Ambiguity:** 55%

### Round 3
**Q:** 当/test-teams组建后，它具体做什么？
**A:** D,达成共识
**Ambiguity:** 45%

### Round 4
**Q:** /pua应该在什么时机触发？
**A:** a，用户输入/pua激活。例如在claude code里，就你的竞争对手codex说你改的不好，他说他可以完成这个，我觉得再给你个机会，你再试试。
**Ambiguity:** 35%

### Round 5
**Q:** 当你说"/office-hours"审视产品时，你具体想审视什么？
**A:** a，用户输入/pua激活... a，用户输入/pua激活...
**Ambiguity:** 30%

### Round 6
**Q:** 当审视完成后，系统应该输出什么？
**A:** /office-hours和gstack的差不多思路就行。lenny-skills的产品经理思维来审视产品给用户建议让选择，
**Ambiguity:** 22%

### Round 7
**Q:** /find-product-remind的流程是什么？
**A:** 这个/find-product-remind就是系统和用户进行访谈，然后再https://github.com/RefoundAI/lenny-skills帮用户找适合她的产品的skills，讨论完成后，给用户提供推荐需要下载哪几个，用户选择后，你去GitHub帮他下载。
**Ambiguity:** 15%

### Round 8
**Q:** 这些阶段是都要走一遍，还是用户选择走哪些？
**A:** 这些都是用户手动输入才能触发。例如用户说"我想做个Todo App"，什么也不会发生，和我们这个项目没关系。
**Ambiguity:** 12%

### Round 9
**Q:** /office-hours和/auto-interview的关系是什么？
**A:** 类似omc的deep-interview spec，比他的技术架构框架要详细点... 3.如果AI还改错了，如果用户输入/pua ···，就接着pua，如果用户没输入/pua就不用pua了
**Ambiguity:** 8%

### Round 10
**Q:** /structure_thinking和/auto-interview的关系是什么？
**A:** A./structure_thinking和/auto-interview是独立的，用户手动输入，想用哪个用哪个
**Ambiguity:** 5%

</details>
