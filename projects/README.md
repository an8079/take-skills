# Claude Code - 项目目录说明

> **创建日期：** 2026-01-24

## 目录用途

每个独立项目存放在 `projects/<project-name>/` 目录下，避免根目录混乱。

## 目录命名规范

```
projects/
├── project-a/           # 全栈项目
├── project-b/           # 后端项目
├── project-c/           # 客户端项目
├── project-d/           # 数据处理/脚本
├── project-e/           # 实验项目
├── project-learning/     # 学习/研究项目
└── project-temp/        # 临时项目
```

## 项目包含内容

每个项目目录应包含：

```
<project-name>/
├── README.md              # 项目说明
├── CLAUDE.md            # 项目级 AUDE（如果使用特定技能）
├── .env.example         # 环境变量模板
├── docs/               # 设计文档/架构图
├── src/               # 源代码
├── tests/              # 测试代码
├── scripts/            # 构建脚本
├── data/               # 数据文件（示例数据）
├── models/              # 模型文件
├── outputs/            # 输出结果
└── logs/               # 运行日志
```

## 现有目录（示例）

```
projects/
├── memory-bank/         # 记忆库项目（用户偏好、学习记录）
├── ai-experiments/     # AI 实验项目
├── demos/             # 演示项目
├── templates/         # 项目模板
├── prototypes/        # 原型项目
```

## 项目生命周期

```
1. 启动阶段 → 创建 `projects/<name>/` 目录
2. 开发阶段 → 在 `projects/<name>/src/` 中编码
3. 交付阶段 → 使用 `devops-delivery` 技能构建和部署
4. 维护阶段 → 使用 `continuous-learning` 技能从使用中学习
5. 归档阶段 → 项目完成后，使用 `docx` 或 `pdf-skills` 生成技术文档
```

## 与根目录的关系

```
opencode-z/
├── CLAUDE.md           # 项目级自动识别配置
├── agents/              # 10 个 Agent 定义
├── skills/             # 47 个技能定义
├── projects/            # 独立项目存放区
├── CLAUDE.md           # 自动更新文档
```
```

**注意：** `projects/` 下的每个项目都可以独立开发、测试、部署，根目录不会被污染。
