---
name: devops-delivery
description: 应用交付专家。解决 Python 环境依赖地狱和 Docker 镜像交付，包括容器化、CI/CD、环境配置管理。
version: 1.0.0
tags: [devops, docker, ci-cd, deployment, delivery]
---

# 应用交付专家

> 解决 "Python 环境依赖地狱" 和 "Docker 镜像交付"

## 适用场景

- Python/AI 项目容器化
- GPU 推理服务部署
- CI/CD 流水线配置
- 环境配置与密钥管理
- 交付物规范化

## 核心目标

1. **消除环境差异** — 开发、测试、生产环境一致
2. **简化部署流程** — 一键启动所有服务
3. **保护敏感信息** — 密钥不入代码库
4. **自动化质量保障** — 代码提交自动检查

## 一、Docker 最佳实践

### 1.1 Python/AI 多阶段构建

```dockerfile
# ===== 阶段1: 构建依赖 =====
FROM python:3.11-slim as builder

WORKDIR /app

# 安装构建工具
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装依赖到虚拟环境
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# ===== 阶段2: 运行时镜像 =====
FROM python:3.11-slim as runtime

WORKDIR /app

# 从构建阶段复制虚拟环境
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 复制应用代码
COPY src/ ./src/

# 非 root 用户运行
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.2 NVIDIA GPU 推理镜像

```dockerfile
# GPU 推理专用镜像
FROM nvidia/cuda:12.1-runtime-ubuntu22.04

WORKDIR /app

# 安装 Python
RUN apt-get update && apt-get install -y \
    python3.11 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 安装 PyTorch GPU 版本
COPY requirements-gpu.txt .
RUN pip install --no-cache-dir -r requirements-gpu.txt

COPY src/ ./src/

ENV NVIDIA_VISIBLE_DEVICES=all
CMD ["python", "-m", "src.inference_server"]
```

### 1.3 .dockerignore 配置

```dockerignore
# Python
__pycache__/
*.py[cod]
.venv/
venv/

# 模型权重（太大，单独挂载）
models/
*.bin
*.safetensors
*.onnx

# 开发文件
.git/
.env
*.md
tests/
docs/

# 临时文件
*.log
.cache/
```

## 二、环境配置管理

### 2.1 .env.example 规范

```bash
# ===== 数据库配置 =====
# SQL Server 连接串
MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_DATABASE=mydb
MSSQL_USER=sa
MSSQL_PASSWORD=your-password

# ===== 对象存储 =====
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
OSS_ACCESS_KEY=your-access-key
OSS_SECRET_KEY=your-secret-key
OSS_BUCKET=your-bucket

# ===== AI 模型配置 =====
MODEL_PATH=/models/embedding
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.openai.com/v1

# ===== 服务配置 =====
REDIS_URL=redis://localhost:6379
DEBUG=false
LOG_LEVEL=INFO
```

### 2.2 CI/CD 密钥注入

**GitHub Actions 示例：**
```yaml
env:
  MSSQL_PASSWORD: ${{ secrets.MSSQL_PASSWORD }}
  LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
```

**Docker Compose 注入：**
```yaml
services:
  api:
    env_file:
      - .env
    environment:
      - MSSQL_PASSWORD=${MSSQL_PASSWORD}
```

## 三、自动化工作流 (CI)

### 3.1 GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install ruff pytest

      - name: Lint with Ruff
        run: ruff check src/

      - name: Run tests
        run: pytest tests/ -v
```

### 3.2 自动构建镜像

```yaml
  build-and-push:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: registry.cn-hangzhou.aliyuncs.com
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: registry.cn-hangzhou.aliyuncs.com/myapp/api:${{ github.sha }}
```

## 四、交付物规范

### 4.1 docker-compose.yml 标准交付

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  ai-service:
    build:
      context: .
      dockerfile: Dockerfile.gpu
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./models:/models:ro
    restart: unless-stopped

volumes:
  redis_data:
```

### 4.2 环境自检脚本

```python
# scripts/init_check.py
"""部署前环境自检脚本"""
import os
import sys

def check_env_vars():
    """检查必需的环境变量"""
    required = [
        "MSSQL_SERVER",
        "MSSQL_PASSWORD",
        "REDIS_URL",
    ]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        print(f"❌ 缺少环境变量: {missing}")
        return False
    print("✅ 环境变量检查通过")
    return True

def check_redis():
    """检查 Redis 连接"""
    try:
        import redis
        r = redis.from_url(os.getenv("REDIS_URL"))
        r.ping()
        print("✅ Redis 连接正常")
        return True
    except Exception as e:
        print(f"❌ Redis 连接失败: {e}")
        return False

def check_database():
    """检查数据库连接"""
    try:
        import pymssql
        conn = pymssql.connect(
            server=os.getenv("MSSQL_SERVER"),
            user=os.getenv("MSSQL_USER"),
            password=os.getenv("MSSQL_PASSWORD"),
            database=os.getenv("MSSQL_DATABASE")
        )
        conn.close()
        print("✅ 数据库连接正常")
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

if __name__ == "__main__":
    checks = [check_env_vars(), check_redis(), check_database()]
    sys.exit(0 if all(checks) else 1)
```

## 交付检查清单

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Dockerfile | ⬜ | 多阶段构建、非 root 用户 |
| .dockerignore | ⬜ | 排除模型、日志、.env |
| docker-compose.yml | ⬜ | 服务编排完整 |
| .env.example | ⬜ | 所有配置项有注释 |
| init_check.py | ⬜ | 环境自检脚本 |
| CI 配置 | ⬜ | Lint + Test + Build |
| README | ⬜ | 部署步骤清晰 |

