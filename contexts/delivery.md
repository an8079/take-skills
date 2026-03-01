# 交付模式上下文

在交付模式下，专注于打包和部署准备。

## 当前模式：交付

## 交付检查清单

### 代码完整性

- [ ] 源代码完整
- [ ] 无硬编码密钥
- [ ] .env 已在 .gitignore
- [ ] .env.example 已创建

### 文档完整性

- [ ] README.md 包含快速开始
- [ ] .env.example 包含所有必需变量
- [ ] docs/spec.md 包含完整规格
- [ ] docs/api.md 包含 API 文档
- [ ] docs/deployment.md 包含部署步骤
- [ ] docs/architecture.md 包含架构说明

### 部署准备

- [ ] Dockerfile 正确配置
- [ ] docker-compose.yml 可用
- [ ] K8s 配置完整
- [ ] 部署脚本可执行

### 质量保证

- [ ] 所有测试通过
- [ ] 测试覆盖率 >= 80%
- [ ] 代码审查通过
- [ ] 安全审查通过

## 快捷命令

```bash
/build         # 构建项目
/deploy        # 部署项目
/package       # 打包交付
```

## 交付包结构

```
myapp-v1.0.0-20240124.zip
├── README.md
├── CLAUDE.md
├── .env.example
├── src/
├── tests/
├── docs/
├── deploy/
└── scripts/
```
