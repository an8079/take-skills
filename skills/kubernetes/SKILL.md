---
name: kubernetes
description: Kubernetes 部署和管理技能。Pod、Service、Deployment、ConfigMap、Helm 等。
tags: [kubernetes, k8s, deployment, devops]
---

# Kubernetes 技能

## When to Use This Skill

- 设计 Kubernetes 部署架构时
- 编写 Kubernetes 清单文件时
- 解决部署和运维问题时
- 使用 Helm 管理应用时

## Quick Reference

### 核心概念

| 概念 | 说明 | 用途 |
|------|------|------|
| Pod | 最小部署单元 | 运行容器 |
| Deployment | 声明式部署 | 管理 Pod 副本 |
| Service | 服务发现 | 暴露应用 |
| Ingress | 入口规则 | HTTP(S) 路由 |
| ConfigMap | 配置数据 | 存储配置 |
| Secret | 敏感数据 | 存储密钥 |
| PV/PVC | 持久化存储 | 数据存储 |
| HPA | 自动扩缩容 | 动态调整副本 |

### 资源层级

```
Cluster (集群)
  └── Namespace (命名空间)
        ├── Pod
        ├── Deployment
        ├── Service
        ├── ConfigMap
        ├── Secret
        └── Ingress
```

## Pod 配置

### 基本 Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
    tier: backend
spec:
  containers:
  - name: app
    image: myapp:latest
    ports:
    - containerPort: 3000
      protocol: TCP
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### 多容器 Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: web
    image: nginx:latest
    ports:
    - containerPort: 80
    volumeMounts:
    - name: html
      mountPath: /usr/share/nginx/html

  - name: git-sync
    image: k8s.gcr.io/git-sync/git-sync:v3.1.5
    env:
    - name: GIT_SYNC_REPO
      value: https://github.com/example/content.git
    - name: GIT_SYNC_DEST
      value: /git
    volumeMounts:
    - name: html
      mountPath: /git

  volumes:
  - name: html
    emptyDir: {}
```

## Deployment 配置

### 滚动更新

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多额外创建 1 个 Pod
      maxUnavailable: 0   # 不允许不可用的 Pod
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: myapp:v1.0.0
        ports:
        - containerPort: 3000
```

### 蓝绿部署

```yaml
# 蓝环境
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
      version: blue
  template:
    metadata:
      labels:
        app: my-app
        version: blue
    spec:
      containers:
      - name: app
        image: myapp:v1.0.0

# 绿环境
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-green
spec:
  replicas: 0
  selector:
    matchLabels:
      app: my-app
      version: green
  template:
    metadata:
      labels:
        app: my-app
        version: green
    spec:
      containers:
      - name: app
        image: myapp:v2.0.0

# 通过切换 Service selector 实现蓝绿切换
```

### 金丝雀部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: my-app
      track: stable
  template:
    metadata:
      labels:
        app: my-app
        track: stable
    spec:
      containers:
      - name: app
        image: myapp:v1.0.0

apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
      track: canary
  template:
    metadata:
      labels:
        app: my-app
        track: canary
    spec:
      containers:
      - name: app
        image: myapp:v2.0.0
```

## Service 配置

### ClusterIP

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
```

### LoadBalancer

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
  - name: http
    port: 80
    targetPort: 3000
  - name: https
    port: 443
    targetPort: 3000
```

### Headless Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-headless
spec:
  type: ClusterIP
  clusterIP: None
  selector:
    app: my-app
  ports:
  - port: 3000
```

## Ingress 配置

### 基础路由

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### TLS 配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
```

## ConfigMap 和 Secret

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.properties: |
    server.port=3000
    server.host=0.0.0.0
  log-level: "info"
  feature-flags: |
    featureA=true
    featureB=false
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:pass@db:5432/app"
  api-key: "your-api-key"
```

### 挂载配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: myapp:latest
    envFrom:
    - configMapRef:
        name: app-config
    - secretRef:
        name: app-secrets
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
      readOnly: true
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

## 持久化存储

### PV (PersistentVolume)

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    server: 192.168.1.100
    path: /data/nfs
```

### PVC (PersistentVolumeClaim)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-nfs
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
  storageClassName: nfs-storage
```

### StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iopsPerGB: "10"
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

## 自动扩缩容

### HPA (Horizontal Pod Autoscaler)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

### VPA (Vertical Pod Autoscaler)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: "*"
      minAllowed:
        cpu: "100m"
        memory: "100Mi"
      maxAllowed:
        cpu: "1"
        memory: "1Gi"
```

## Helm Charts

### Chart 结构

```
my-chart/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl
└── README.md
```

### values.yaml

```yaml
# values.yaml
replicaCount: 3

image:
  repository: myapp
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: app-tls

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### deployment.yaml 模板

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-chart.fullname" . }}
  labels:
    {{- include "my-chart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-chart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-chart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

## 常用命令

### 集群操作

```bash
# 查看集群信息
kubectl cluster-info
kubectl get nodes
kubectl describe node <node-name>

# 查看资源
kubectl get all -n <namespace>
kubectl get pods -w
kubectl get deployments
kubectl get services
kubectl get configmaps
kubectl get secrets

# 查看详细信息
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>
kubectl logs <pod-name> -f
kubectl logs <pod-name> -c <container-name>

# 执行命令
kubectl exec -it <pod-name> -- sh
kubectl exec <pod-name> -- ls /app
```

### 应用和删除

```bash
# 应用配置
kubectl apply -f deployment.yaml
kubectl apply -k dir/  # kustomize

# 删除资源
kubectl delete pod <pod-name>
kubectl delete -f deployment.yaml
kubectl delete all --all

# 编辑配置
kubectl edit deployment <deployment-name>
kubectl edit configmap <config-name>
```

### 故障排查

```bash
# 查看事件
kubectl get events --sort-by=.metadata.creationTimestamp

# 查看 Pod 状态
kubectl get pods -o wide
kubectl get pods -A

# 进入容器调试
kubectl debug -it <pod-name> --image=busybox

# 端口转发
kubectl port-forward svc/<service-name> 8080:80
```

## 最佳实践

1. **声明式配置** - 使用 `kubectl apply` 而非 `kubectl create`
2. **资源限制** - 为所有容器设置 requests 和 limits
3. **健康检查** - 配置 liveness 和 readiness 探针
4. **命名空间隔离** - 使用 Namespace 分隔环境
5. **配置外部化** - 使用 ConfigMap 和 Secret
6. **标签规范** - 使用统一的标签规范
7. **自动扩缩容** - 使用 HPA 应对流量变化
8. **滚动更新** - 使用 RollingUpdate 策略
9. **监控告警** - 集成 Prometheus + Grafana
10. **日志收集** - 使用 ELK 或 Loki 收集日志

## 参考资源

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Helm 文档](https://helm.sh/docs/)
- [kubectl 备忘单](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
