# 贡献指南 (Contributing)

感谢你有兴趣为 Claude Code 开发助手配置做出贡献！

---

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 检查 [Issues](../../issues) 中是否已有相关问题
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题
   - 详细的描述
   - 复现步骤（针对 bug）
   - 预期行为与实际行为
   - 环境信息（操作系统、版本号等）

### 提交代码

#### 1. Fork 项目

点击项目页面右上角的 "Fork" 按钮。

#### 2. 克隆你的 Fork

```bash
git clone https://github.com/your-username/opencode-z.git
cd opencode-z
```

#### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-fix-name
```

分支命名约定：
- `feature/功能名` - 新功能
- `fix/问题描述` - 问题修复
- `docs/文档名` - 文档更新
- `refactor/重构名` - 代码重构
- `test/测试名` - 测试相关

#### 4. 做出修改

- 确保代码符合项目风格
- 添加必要的测试
- 更新相关文档

#### 5. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能描述"
# 或
git commit -m "fix: 修复问题描述"
```

提交信息格式遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
- `feat:` 新功能
- `fix:` 问题修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

#### 6. 推送到你的 Fork

```bash
git push origin feature/your-feature-name
```

#### 7. 创建 Pull Request

- 在 GitHub 上创建 Pull Request
- 清晰描述你的改动
- 关联相关的 Issue

---

## 开发规范

### 代码风格

#### Markdown 文件

- 使用中文标点
- 标题层级清晰
- 代码块指定语言
- 表格对齐整齐
- 每个文件以版本号和更新日期开头

#### 配置文件 (JSON)

- 使用 2 空格缩进
- 字符串使用双引号
- 尾随逗号（数组/对象）

### 文件结构

遵循项目现有的目录结构：

```
opencode-z/
├── agents/          # Agent 定义
├── commands/        # 命令定义
├── skills/          # 技能库
│   └── [技能名]/
│       └── SKILL.md
├── rules/           # 全局规则
├── contexts/        # 上下文模式
├── hooks/           # Hooks 配置
├── memory-bank/     # 记忆模板
├── docs/            # 文档模板
├── mcp-configs/     # MCP 配置
├── examples/        # 示例文件
├── CLAUDE.md        # 核心配置
├── README.md        # 项目说明
└── CHANGELOG.md     # 更新日志
```

### Agent 开发规范

每个 Agent 文件应包含：

```markdown
# [Agent 名称]

> 版本：v1.0 | 更新日期：2026-01-24

## 角色定义
[Agent 的角色和职责]

## 触发条件
[什么时候调用这个 Agent]

## 工作流程
[详细的执行步骤]

## 输出格式
[规范的输出模板]

## 注意事项
[需要特别注意的事项]
```

### Skill 开发规范

每个 Skill 应包含：

```markdown
# [技能名称]

> 版本：v1.0 | 更新日期：2026-01-24

## 技能描述
[简短描述技能用途]

## 适用场景
[什么时候使用这个技能]

## 核心内容
[技能的核心知识和方法]

## 最佳实践
[推荐的实践方式]

## 示例
[具体的使用示例]
```

---

## 添加新技能

如果项目缺少某个领域的技能，可以创建新的技能：

1. 在 `skills/` 目录下创建新文件夹
2. 创建 `SKILL.md` 文件
3. 遵循 Skill 开发规范
4. 更新 `CLAUDE.md` 中的技能表
5. 提交 PR

---

## 添加新 Agent

如果需要新的 Agent：

1. 在 `agents/` 目录下创建新文件
2. 遵循 Agent 开发规范
3. 更新 `CLAUDE.md` 中的 Agent 表
4. 提交 PR

---

## 测试

创建新的 Agent 或 Skill 后：

1. 在实际项目中测试
2. 验证输出格式符合规范
3. 检查边界情况处理
4. 记录问题和改进点

---

## 文档更新

任何代码变更都应伴随相应的文档更新：

- 修改了 Agent → 更新 `CLAUDE.md` 中的 Agent 表
- 添加了 Skill → 更新 `CLAUDE.md` 中的技能表
- 新增了命令 → 更新 `CLAUDE.md` 中的命令表
- 重大变更 → 更新 `CHANGELOG.md`

---

## 代码审查

PR 会经过审查，关注点包括：

- [ ] 代码风格符合规范
- [ ] 功能正确完整
- [ ] 文档已更新
- [ ] 测试充分（如适用）
- [ ] 提交信息清晰
- [ ] 无引入新的问题

---

## 社区准则

### 行为准则

- 尊重所有贡献者
- 欢迎不同经验水平的开发者
- 建设性的反馈和讨论
- 专注于解决问题

### 沟通方式

- GitHub Issues：问题报告和讨论
- Pull Requests：代码贡献
- 中文为主，必要时可用英文

---

## 许可证

通过贡献代码，你同意你的贡献将采用 MIT 许可证。

---

## 获取帮助

如果你在贡献过程中遇到问题：

1. 查看 Issues 中是否有类似问题
2. 创建 Issue 提问，标记为 `question` 标签
3. 在 PR 中 @维护者请求帮助

---

## 致谢

感谢所有为 Claude Code 开发助手配置做出贡献的开发者！
