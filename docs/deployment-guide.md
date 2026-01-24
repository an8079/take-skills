# 部署指南

> 版本：v1.0 | 日期：[日期]

---

## 前置要求

### 软件依赖

| 软件 | 版本 | 安装方式 |
|------|------|----------|
| Docker | 20.10+ | [官网下载] |
| Docker Compose | 2.0+ | `pip install docker-compose` |
| Node.js | 18+ | [官网下载] |
| Python | 3.11+ | [官网下载] |
| Git | 2.30+ | [官网下载] |

### 硬件要求

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核心 | 4 核心+ |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 10GB | 20GB+ |

---

## 快速部署

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/username/myapp.git
cd myapp

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入真实值

# 3. 启动服务
docker-compose up -d

# 4. 检查健康状态
curl http://localhost:3000/health
```

### 方式二：Kubernetes

```bash
# 1. 创建命名空间
kubectl create namespace myapp

# 2. 创建 Secret
kubectl create secret generic myapp-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="..." \
  -n myapp

# 3. 部署应用
kubectl apply -f k8s/ -n myapp

# 4. 检查状态
kubectl get pods -n myapp
kubectl logs -f deployment/myapp -n myapp
```

---

## 详细部署

### 开发环境

#### 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或使用 Docker
docker-compose -f docker-compose.dev.yml up -d
```

#### 访问地址

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 生产环境

#### 环境变量配置

生产环境必须配置的环境变量：

```env
# 应用配置
NODE_ENV=production
PORT=3000
API_URL=https://api.example.com

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT 配置
JWT_SECRET=your-production-secret-key-here
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json
```

#### 数据库迁移

```bash
# 运行迁移
npm run migrate

# 或使用 Docker
docker-compose exec app npm run migrate

# 查看迁移状态
npm run migrate:status

# 回滚迁移
npm run migrate:rollback
```

---

## 监控与日志

### 健康检查端点

```http
GET /health

响应：
{
  "status": "healthy",
  "timestamp": "2024-01-24T10:00:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

### 日志查看

```bash
# Docker Compose
docker-compose logs -f app

# Kubernetes
kubectl logs -f deployment/myapp -n myapp

# 应用日志文件
tail -f logs/app.log
```

### 监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| 响应时间 | API 平均响应时间 | > 500ms |
| 错误率 | 5xx 错误占比 | > 1% |
| 内存使用 | 应用内存使用率 | > 80% |
| CPU 使用 | 应用 CPU 使用率 | > 70% |

---

## 故障排查

### 常见问题

#### 容器启动失败

```bash
# 查看容器日志
docker-compose logs app

# 常见原因：
# 1. 端口被占用 - 修改 docker-compose.yml 中的端口映射
# 2. 环境变量未配置 - 检查 .env 文件
# 3. 数据库连接失败 - 检查数据库 URL 和连接状态
```

#### 数据库连接失败

```bash
# 检查数据库是否运行
docker-compose ps

# 检查数据库连接
docker-compose exec db psql -U user -d myapp

# 测试连接
psql postgresql://user:password@localhost:5432/myapp
```

#### API 请求失败

```bash
# 检查服务是否运行
curl http://localhost:8000/health

# 检查防火墙设置
# 检查 CORS 配置
```

---

## 备份与恢复

### 数据库备份

```bash
# 手动备份
docker-compose exec db pg_dump -U user myapp > backup_$(date +%Y%m%d).sql

# 自动备份脚本
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

docker-compose exec -T db pg_dump -U user myapp > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# 保留最近 7 天
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### 数据恢复

```bash
# 从备份恢复
cat backup_20240124.sql | docker-compose exec -T db psql -U user -d myapp
```

---

## CI/CD

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: username/myapp:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            docker pull username/myapp:latest
            docker stop myapp || true
            docker rm myapp || true
            docker run -d --name myapp -p 3000:3000 --env-file .env username/myapp:latest
```

---

## 回滚

### Docker 部署回滚

```bash
# 1. 查看可用的镜像版本
docker images username/myapp

# 2. 停止当前容器
docker stop myapp
docker rm myapp

# 3. 启动上一个版本
docker run -d --name myapp -p 3000:3000 --env-file .env username/myapp:previous-version

# 4. 验证回滚成功
curl http://localhost:3000/health
```

### 数据库回滚

```bash
# 应用迁移回滚
npm run migrate:rollback

# 恢复数据库备份
cat backup_20240124.sql | docker-compose exec -T db psql -U user -d myapp
```

---

## 性能优化

### 应用层优化

- 启用 Gzip 压缩
- 配置 CDN
- 使用缓存
- 数据库连接池

### Nginx 配置示例

```nginx
upstream myapp {
    server localhost:3000;
}

server {
    listen 80;
    server_name example.com;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://myapp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件缓存
    location /static/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 安全加固

### 生产环境安全检查清单

- [ ] 修改默认密码
- [ ] 配置防火墙规则
- [ ] 启用 HTTPS
- [ ] 禁用不必要的端口
- [ ] 配置速率限制
- [ ] 定期更新依赖
- [ ] 启用日志审计

---

## 支持与维护

### 获取帮助

如遇到部署问题，请提供以下信息：

1. 服务器环境（操作系统、Docker 版本等）
2. 错误日志
3. 操作步骤

### 联系方式

- 技术支持：support@example.com
- 文档：https://docs.example.com
