# 故障排查指南 (Troubleshooting)

> 版本：v1.0 | 更新日期：2026-01-24

---

## 常见问题

### 安装问题

#### 插件安装后不生效

**症状：** 安装插件后，命令如 `/interview` 无法识别

**可能原因：**
1. Claude Code 未重启
2. 插件路径不正确
3. CLAUDE.md 文件未被加载

**解决方法：**
```bash
# 1. 确认插件路径
# Windows: %USERPROFILE%\.opencode\plugins\opencode-z
# macOS/Linux: ~/.claude-code/plugins/opencode-z

# 2. 检查文件是否存在
ls ~/.claude-code/plugins/opencode-z/CLAUDE.md

# 3. 完全重启 Claude Code
```

---

### 访谈阶段

#### 访谈一直不结束

**症状：** 访谈持续提出问题，无法进入下一阶段

**可能原因：**
1. AI 未检测到需求完整
2. 某些维度答案不一致

**解决方法：**
1. 查看访谈进度表，看哪些维度未完成
2. 主动说「写规格」强制进入下一阶段
3. 或说「快速开始」跳过完整访谈

#### 访谈问题太多

**症状：** 每次都问很多问题

**解决方法：**
- 说「快速开始」或「跳过访谈」
- 在项目 `CLAUDE.md` 中配置快速模式选项

---

### 规格生成

#### 规格文档不完整

**症状：** 生成的规格缺少某些章节

**可能原因：**
1. 访谈阶段信息不完整
2. 技术栈未指定

**解决方法：**
1. 补充必要信息后重新生成
2. 手动编辑 `docs/spec.md` 补充缺失内容
3. 运行 `/spec` 命令重新生成

---

### 编码阶段

#### 代码风格不符合预期

**症状：** 生成的代码不符合项目风格

**解决方法：**
1. 在项目 `CLAUDE.md` 中明确定义编码风格
2. 检查 `rules/coding-style.md` 规则
3. 运行 `/reflect` 记录风格偏好

#### 生成的代码有错误

**症状：** 代码运行时报错

**解决方法：**
1. 运行 `/debug` 使用调试助手
2. 将错误信息完整复制给 AI
3. 检查依赖是否正确安装

---

### 测试问题

#### 测试覆盖率不足

**症状：** 测试覆盖率低于目标

**解决方法：**
1. 检查 `rules/testing.md` 中的覆盖率要求
2. 运行 `/test` 生成更多测试用例
3. 手动添加边缘情况测试

#### 测试失败

**症状：** 测试运行失败

**可能原因：**
1. 代码有 bug
2. 测试用例本身有问题
3. 依赖环境配置不对

**解决方法：**
1. 检查失败的具体测试
2. 使用 `/debug` 调试
3. 检查环境变量配置

---

### 审查问题

#### 审查报告太长

**症状：** 审查输出大量建议

**解决方法：**
1. 在项目 `CLAUDE.md` 中配置审查严格度
2. 只关注 Critical 和 Important 级别问题

#### 审查结果不符合预期

**症状：** 审查指出的不是真正的问题

**解决方法：**
1. 运行 `/reflect` 记录对审查的反馈
2. 调整 `rules/coding-style.md` 中的规则
3. 禁用某些审查 Agent（如 security-reviewer）

---

### 部署问题

#### Docker 构建失败

**症状：** `docker build` 命令失败

**常见原因和解决：**

| 错误信息 | 原因 | 解决方法 |
|---------|------|----------|
| `no matching manifest` | 架构不匹配 | 检查 Dockerfile FROM 镜像 |
| `file not found` | 路径错误 | 检查 COPY/ADD 路径 |
| `permission denied` | 权限问题 | 添加 USER 指令 |

```bash
# 调试 Docker 构建
docker build --progress=plain -t myapp .
docker run -it myapp sh
```

#### docker-compose 启动失败

**症状：** `docker-compose up` 失败

**解决方法：**
```bash
# 查看详细日志
docker-compose up --verbose

# 检查配置
docker-compose config

# 重建容器
docker-compose down
docker-compose up --build
```

---

### Hooks 问题

#### Hook 不触发

**症状：** 配置的 hook 没有执行

**解决方法：**
1. 检查 `hooks/hooks.json` 格式是否正确
2. 检查 matcher 表达式是否匹配
3. 命令在 Windows 上需要兼容

#### Hook 报错

**症状：** Hook 执行时出错

**解决方法：**
1. 检查命令语法
2. Windows 使用 `cmd` 或 `powershell` 而非 bash
3. 添加错误处理

---

### 记忆系统问题

#### Memory Bank 未更新

**症状：** 任务完成但进展未记录

**解决方法：**
1. 检查 `memory-bank/` 目录是否存在
2. 检查文件权限
3. 确认 AI 有写入权限

#### 学习记录未应用

**症状：** `/reflect` 后规则未生效

**解决方法：**
1. 确认 `memory-bank/学习记录.md` 已更新
2. 检查规则是否写入了正确文件
3. 重启 Claude Code 使规则生效

---

### 技能问题

#### 技能未自动加载

**症状：** 涉及某领域但未调用对应技能

**解决方法：**
1. 手动指定：「使用 database-design 技能」
2. 在 `CLAUDE.md` 中检查技能表配置
3. 确认技能文件路径正确

#### 创建新技能失败

**症状：** skill-creator 无法创建技能

**解决方法：**
1. 检查 `skills/` 目录写权限
2. 确认技能名称不冲突
3. 手动创建技能文件

---

### 环境问题

#### 环境变量未生效

**症状：** `.env` 中的变量未被读取

**解决方法：**
1. 确认 `.env` 文件在项目根目录
2. 检查变量名拼写
3. 重启开发服务器
4. 检查 `.gitignore` 确保 `.env` 未被意外提交

#### 依赖安装失败

**症状：** `npm install` 或 `pip install` 失败

**解决方法：**

```bash
# Node.js
npm cache clean --force
npm install

# Python
pip install --upgrade pip
pip install -r requirements.txt
```

---

### MCP 问题

#### MCP 服务器连接失败

**症状：** MCP 配置的服务器无法连接

**解决方法：**
1. 检查 `mcp-configs/mcp-servers.json` 配置
2. 确认服务器命令和参数正确
3. 检查服务器是否已安装

#### MCP 工具不可用

**症状：** 配置的 MCP 工具无法使用

**解决方法：**
1. 确认 MCP 服务器正常运行
2. 检查工具名称拼写
3. 查看服务器日志

---

## 调试技巧

### 开启详细日志

```bash
# opencode 环境变量
export OPENCODE_DEBUG=1
export OPENCODE_LOG_LEVEL=debug
```

### 分步骤执行

遇到问题时，按步骤执行定位问题：

1. 确认当前阶段（访谈/规格/编码/测试/审查）
2. 查看相关 Agent/Skill 的输出
3. 检查 Memory Bank 状态
4. 查看相关文档和规则

### 获取帮助

1. 查看 `QUICKSTART.md` 快速开始指南
2. 查看 `ARCHITECTURE.md` 理解系统架构
3. 查看 `examples/CLAUDE.md` 参考配置示例
4. 在 Claude Code 中直接提问

---

## 报告问题

如果遇到本文档未涵盖的问题：

1. 记录完整错误信息
2. 记录复现步骤
3. 记录环境信息（操作系统、版本等）
4. 提交 Issue 到项目仓库

---

## 常用诊断命令

```bash
# 检查插件安装
ls -la ~/.claude-code/plugins/opencode-z/

# 检查文件内容
cat ~/.claude-code/plugins/opencode-z/CLAUDE.md

# 检查项目配置
cat ./CLAUDE.md

# 检查记忆系统
ls -la ./memory-bank/

# 检查文档
ls -la ./docs/

# Git 状态（检查是否有未提交的更改）
git status
git diff
```
