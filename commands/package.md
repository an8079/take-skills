---
name: package
description: 打包项目为可交付的交付包。
---

# /package - 打包交付

创建项目交付包，包含完整的项目代码和文档。

## 使用方式

```
/package
```

或

```
打包交付
创建交付包
```

## 前置条件

- 项目已完成
- 所有测试通过
- 文档已完成

## 交付包内容

```
myapp-v1.0.0-20240124.zip
├── README.md                    # 项目说明、快速开始
├── CLAUDE.md                   # AI 配置
├── .env.example               # 环境变量模板
├── package.json / requirements.txt
│
├── src/                       # 源代码
│   ├── api/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── utils/
│   └── config/
│
├── tests/                     # 测试代码
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                      # 文档
│   ├── spec.md               # 规格文档
│   ├── api.md                # API 文档
│   ├── deployment.md         # 部署指南
│   ├── architecture.md       # 架构设计
│   └── troubleshooting.md   # 故障排查
│
├── deploy/                    # 部署配置
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── k8s/
│   ├── nginx.conf
│   ├── deploy.sh
│   └── rollback.sh
│
├── scripts/                   # 脚本
│   ├── init-db.sh
│   └── backup.sh
│
└── build/                     # 构建产物（可选）
```

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
- [ ] 回滚脚本可执行

### 质量保证

- [ ] 所有测试通过
- [ ] 测试覆盖率达标
- [ ] 代码审查通过
- [ ] 安全审查通过

## 打包命令

```bash
# 创建交付包
zip -r ../myapp-v1.0.0-$(date +%Y%m%d).zip . \
  -x "*.env" \
  -x "*__pycache__*" \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.log" \
  -x "*.tmp"

# 或使用 tar
tar -czf ../myapp-v1.0.0-$(date +%Y%m%d).tar.gz \
  --exclude='.env' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='node_modules' \
  .
```

## 交付清单

提供给客户的清单：

| 项目 | 状态 | 说明 |
|------|------|------|
| 源代码 | ✅ | 完整的源代码 |
| 依赖文件 | ✅ | package.json / requirements.txt |
| 环境变量模板 | ✅ | .env.example |
| 快速开始文档 | ✅ | README.md |
| API 文档 | ✅ | docs/api.md |
| 部署文档 | ✅ | docs/deployment.md |
| 部署脚本 | ✅ | deploy/deploy.sh |
| 部署配置 | ✅ | Dockerfile, docker-compose.yml |
| 测试代码 | ✅ | tests/ |

## 交付包验证

打包后进行验证：

```bash
# 解压并验证
unzip myapp-v1.0.0-20240124.zip -d /tmp/test-deploy
cd /tmp/test-deploy

# 检查环境变量模板
cat .env.example

# 检查文档
ls -la docs/

# 验证可以启动（如可测试环境）
docker-compose up -d
```

---

**提示：** 交付包是项目的最终产物。确保所有必需的文件和文档都包含在内。
