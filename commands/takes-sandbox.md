---
name: sandbox
description: 沙箱隔离执行模式，为敏感操作提供隔离环境
---

# /sandbox - 沙箱隔离执行

为敏感、危险或不可信操作提供隔离的 Docker 容器执行环境。

## 使用方式

```
/sandbox "命令或任务描述"
```

或

```
沙箱执行
隔离运行
安全模式
```

## 核心能力

### 容器隔离

| 特性 | 说明 |
|------|------|
| **网络隔离** | `--network none`，完全禁用网络访问 |
| **文件系统只读** | 根文件系统只读，白名单路径可写 |
| **资源限制** | CPU、内存限制 |
| **临时文件系统** | `/tmp`、`/var/run` 使用 tmpfs |
| **非 root 运行** | 在隔离的用户下执行 |

### 沙箱执行场景

```typescript
import { sandboxExec, sandboxClaudeExec, containerCreate, containerRemove } from './scripts/docker-utils.ts';

// 1. 在沙箱中执行任意命令
const result = await sandboxExec('rm -rf / --no-preserve-root', {
  timeout: 5000,
  networkIsolation: true,
});
// 实际不会执行危险操作，因为网络和文件系统都被隔离

// 2. 在沙箱中执行 Claude Code
const claudeResult = await sandboxClaudeExec('Analyze this codebase', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  allowedTools: ['Read', 'Grep', 'Glob'],
  memoryLimit: '1g',
});

// 3. 手动管理容器
const containerId = containerCreate({
  image: 'alpine:latest',
  name: 'my-sandbox',
  networkMode: 'none',
  memoryLimit: '512m',
  mounts: [
    { source: '/safe/path', target: '/workspace', readonly: true }
  ]
});

containerStart(containerId);
// ... 执行操作
containerStop(containerId);
containerRemove(containerId);
```

### 生命周期管理

| 函数 | 说明 |
|------|------|
| `containerCreate()` | 创建容器 |
| `containerStart()` | 启动容器 |
| `containerStop()` | 停止容器 |
| `containerRemove()` | 删除容器 |
| `containerStats()` | 获取资源使用统计 |
| `containerInspect()` | 获取容器详细信息 |
| `containerList()` | 列出所有容器 |

### 安全特性

1. **网络隔离**
   - 可选 `networkIsolation: true` 完全禁用网络
   - 使用 `init-firewall.sh` 配置白名单域名

2. **文件系统隔离**
   - 根文件系统只读
   - 临时目录使用 tmpfs（内存文件系统）
   - 白名单路径可写

3. **资源限制**
   - CPU 限制：`--cpus`
   - 内存限制：`--memory`
   - 超时控制：防止无限运行

4. **工具限制**
   ```typescript
   const result = await sandboxExec('rm -rf /', {
     allowedTools: ['Read'], // 只允许读取
     allowedPaths: ['/safe/path'],
     deniedPaths: ['/etc/shadow', '/root/.ssh'],
   });
   ```

### 与 claude-hub 的集成

参考 `F:/AI项目/claude-hub-main/` 的实现：

```
claude-hub/
├── Dockerfile.claudecode     # 容器镜像定义
└── scripts/
    ├── runtime/
    │   └── claudecode-entrypoint.sh  # 入口脚本
    └── security/
        └── init-firewall.sh          # 防火墙配置
```

**关键安全措施：**
- 防火墙脚本配置 iptables/ipset 白名单
- 只允许访问特定域名（GitHub、npm、Anthropic API）
- 禁止所有其他出站连接

## 配置选项

### SandboxExecOptions

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `timeout` | `number` | 300000 | 超时时间（毫秒） |
| `allowedTools` | `string[]` | `['Read','Bash','Grep','Glob']` | 允许的工具 |
| `allowedPaths` | `string[]` | `[]` | 白名单路径 |
| `deniedPaths` | `string[]` | 敏感系统路径 | 黑名单路径 |
| `networkIsolation` | `boolean` | `true` | 是否启用网络隔离 |
| `cpuLimit` | `string` | - | CPU 限制 |
| `memoryLimit` | `string` | - | 内存限制 |
| `environment` | `object` | `{}` | 环境变量 |

### ContainerConfig

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `image` | `string` | - | 容器镜像 |
| `name` | `string` | 自动生成 | 容器名称 |
| `command` | `string[]` | - | 启动命令 |
| `env` | `object` | `{}` | 环境变量 |
| `mounts` | `MountConfig[]` | `[]` | 挂载配置 |
| `ports` | `PortMapping[]` | `[]` | 端口映射 |
| `memoryLimit` | `string` | - | 内存限制 |
| `cpuLimit` | `string` | - | CPU 限制 |
| `networkMode` | `string` | `'none'` | 网络模式 |

## 返回值

### SandboxResult

```typescript
interface SandboxResult {
  exitCode: number;      // 退出码
  stdout: string;        // 标准输出
  stderr: string;        // 标准错误
  duration: number;      // 执行时长（毫秒）
  containerId: string;   // 容器 ID
}
```

### ResourceUsage

```typescript
interface ResourceUsage {
  cpuPercent: number;    // CPU 使用百分比
  memoryUsed: number;    // 已用内存（字节）
  memoryLimit: number;   // 内存限制（字节）
  networkRx: number;     // 网络接收（字节）
  networkTx: number;     // 网络发送（字节）
}
```

## 清理工具

```typescript
// 清理已停止的容器
const count = cleanupContainers();

// 清理孤立资源（容器、镜像、卷）
const result = await cleanupOrphaned();
// { containers: 5, images: 3, volumes: 2 }

// 完整清理
await fullCleanup();
```

## CLI 用法

```bash
# 列出容器
npx ts-node scripts/docker-utils.ts list

# 创建并启动容器
npx ts-node scripts/docker-utils.ts create alpine:latest my-container

# 查看容器状态
npx ts-node scripts/docker-utils.ts stats my-container

# 在沙箱中执行命令
npx ts-node scripts/docker-utils.ts sandbox-exec "echo hello"

# 清理资源
npx ts-node scripts/docker-utils.ts cleanup
npx ts-node scripts/docker-utils.ts cleanup-orphaned
```

---

**提示：** 沙箱执行适用于：
- 测试危险命令（如 `rm -rf`）
- 执行不可信代码
- 隔离敏感操作
- 限制资源使用
