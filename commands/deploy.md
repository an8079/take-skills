---
name: deploy
description: 部署项目到目标环境。
---

# /deploy - 部署项目

将项目部署到目标环境（开发、测试、生产）。

## 使用方式

```
/deploy [环境]
```

示例：
```
/deploy dev        # 部署到开发环境
/deploy test       # 部署到测试环境
/deploy prod       # 部署到生产环境
```

## 前置条件

- 构建成功
- 环境变量已配置
- 部署目标已准备

## 部署流程

1. 调用 **devops agent** 处理部署
2. 准备部署配置
3. 拉取最新镜像/代码
4. 停止旧服务
5. 启动新服务
6. 健康检查
7. 回滚（如需要）

## 部署方式

### Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart
```

### Kubernetes

```bash
# 部署到 K8s
kubectl apply -f k8s/

# 查看状态
kubectl get pods

# 查看日志
kubectl logs -f deployment/myapp
```

### CI/CD 自动部署

通过 GitHub Actions、GitLab CI 等自动触发。

## 健康检查

```bash
# 检查健康端点
curl http://localhost:3000/health

# 预期响应
{
  "status": "healthy",
  "timestamp": "2024-01-24T10:00:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

## 回滚策略

部署失败时自动回滚：

```bash
# 停止新服务
docker stop myapp

# 启动上一个版本
docker run -d --name myapp \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  myapp:previous
```

## 部署检查清单

- [ ] 服务成功启动
- [ ] 健康检查通过
- [ ] API 响应正常
- [ ] 数据库连接正常
- [ ] 日志正常输出
- [ ] 性能指标正常

## 部署成功后的下一步

```
/package       # 打包交付
/reflect       # 反思学习
```

---

**提示：** 部署前务必在测试环境充分验证。生产环境部署建议在低峰期进行。
