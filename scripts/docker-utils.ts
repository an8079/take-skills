#!/usr/bin/env node

/**
 * Docker Container Isolation Utilities
 *
 * 容器隔离执行能力封装，提供安全的沙箱执行环境
 *
 * 功能:
 * - 容器生命周期管理（创建/启动/监控/清理）
 * - 安全沙箱执行封装
 * - 资源限制与监控
 * - 网络隔离控制
 */

import { execSync, exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

// ============= 类型定义 =============

export interface ContainerConfig {
  image: string;
  name?: string;
  command?: string[];
  env?: Record<string, string>;
  mounts?: MountConfig[];
  ports?: PortMapping[];
  memoryLimit?: string;
  cpuLimit?: string;
  networkMode?: 'bridge' | 'host' | 'none' | 'container';
  readonly?: boolean;
  allowedDomains?: string[];
}

export interface MountConfig {
  source: string;
  target: string;
  readonly?: boolean;
}

export interface PortMapping {
  host: number;
  container: number;
  protocol?: 'tcp' | 'udp';
}

export interface ContainerInfo {
  id: string;
  name: string;
  status: 'created' | 'running' | 'paused' | 'exited' | 'dead';
  created: string;
  image: string;
}

export interface SandboxExecOptions {
  timeout?: number;
  allowedTools?: string[];
  allowedPaths?: string[];
  deniedPaths?: string[];
  networkIsolation?: boolean;
  cpuLimit?: string;
  memoryLimit?: string;
  environment?: Record<string, string>;
}

export interface SandboxResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  containerId: string;
}

export interface ResourceUsage {
  cpuPercent: number;
  memoryUsed: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
}

// ============= 常量 =============

const DOCKER_NOT_INSTALLED = 'Docker is not installed';
const CONTAINER_NOT_FOUND = 'Container not found';
const SANDBOX_IMAGE = 'node:24-alpine';

const DEFAULT_ALLOWED_TOOLS = ['Read', 'Bash', 'Grep', 'Glob'];
const DEFAULT_DENIED_PATHS = ['/etc/shadow', '/etc/passwd', '/root/.ssh', '/home/*/.ssh'];
const DEFAULT_TIMEOUT = 300000; // 5 minutes

// ============= 辅助函数 =============

/**
 * 生成随机容器名称
 */
function generateContainerName(prefix: string = 'sandbox'): string {
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${random}-${Date.now()}`;
}

/**
 * 检查 Docker 是否可用
 */
export function isDockerAvailable(): boolean {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 执行 docker 命令
 */
function dockerExec(args: string[], options: { silent?: boolean; cwd?: string } = {}): string {
  if (!isDockerAvailable()) {
    throw new Error(DOCKER_NOT_INSTALLED);
  }

  const { silent = true } = options;
  const result = execSync(`docker ${args.join(' ')}`, {
    encoding: 'utf-8',
    stdio: silent ? 'pipe' : 'inherit',
  });
  return result.trim();
}

/**
 * 异步执行 docker 命令
 */
async function dockerExecAsync(args: string[], options: { silent?: boolean } = {}): Promise<string> {
  if (!isDockerAvailable()) {
    throw new Error(DOCKER_NOT_INSTALLED);
  }

  const { silent = true } = options;
  const { stdout } = await execAsync(`docker ${args.join(' ')}`, {
    encoding: 'utf-8',
  });
  return stdout.trim();
}

// ============= 容器生命周期管理 =============

/**
 * 创建容器
 */
export function containerCreate(config: ContainerConfig): string {
  const args: string[] = ['create'];

  // 容器名称
  args.push('--name', config.name || generateContainerName());

  // 资源限制
  if (config.memoryLimit) {
    args.push('--memory', config.memoryLimit);
  }
  if (config.cpuLimit) {
    args.push('--cpus', config.cpuLimit);
  }

  // 网络模式
  args.push('--network', config.networkMode || 'none');

  // 环境变量
  if (config.env) {
    for (const [key, value] of Object.entries(config.env)) {
      args.push('--env', `${key}=${value}`);
    }
  }

  // 挂载卷
  if (config.mounts) {
    for (const mount of config.mounts) {
      const mode = mount.readonly ? 'ro' : 'rw';
      args.push('--mount', `type=bind,source=${mount.source},target=${mount.target},${mode}`);
    }
  }

  // 端口映射
  if (config.ports) {
    for (const port of config.ports) {
      args.push('-p', `${port.host}:${port.container}`);
    }
  }

  // 交互式和自动清理
  args.push('-i', '--rm');

  // 镜像和命令
  args.push(config.image);

  if (config.command) {
    args.push(...config.command);
  }

  return dockerExec(args);
}

/**
 * 创建容器（异步版本）
 */
export async function containerCreateAsync(config: ContainerConfig): Promise<string> {
  const args: string[] = ['create'];

  args.push('--name', config.name || generateContainerName());

  if (config.memoryLimit) {
    args.push('--memory', config.memoryLimit);
  }
  if (config.cpuLimit) {
    args.push('--cpus', config.cpuLimit);
  }

  args.push('--network', config.networkMode || 'none');

  if (config.env) {
    for (const [key, value] of Object.entries(config.env)) {
      args.push('--env', `${key}=${value}`);
    }
  }

  if (config.mounts) {
    for (const mount of config.mounts) {
      const mode = mount.readonly ? 'ro' : 'rw';
      args.push('--mount', `type=bind,source=${mount.source},target=${mount.target},${mode}`);
    }
  }

  if (config.ports) {
    for (const port of config.ports) {
      args.push('-p', `${port.host}:${port.container}`);
    }
  }

  args.push('-i', '--rm');
  args.push(config.image);

  if (config.command) {
    args.push(...config.command);
  }

  return dockerExecAsync(args);
}

/**
 * 启动容器
 */
export function containerStart(containerIdOrName: string): void {
  try {
    dockerExec(['start', containerIdOrName]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such container')) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    throw error;
  }
}

/**
 * 启动容器（异步版本）
 */
export async function containerStartAsync(containerIdOrName: string): Promise<void> {
  try {
    await dockerExecAsync(['start', containerIdOrName]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such container')) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    throw error;
  }
}

/**
 * 停止容器
 */
export function containerStop(containerIdOrName: string, timeout: number = 10): void {
  try {
    dockerExec(['stop', '-t', String(timeout), containerIdOrName]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such container')) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    throw error;
  }
}

/**
 * 停止容器（异步版本）
 */
export async function containerStopAsync(containerIdOrName: string, timeout: number = 10): Promise<void> {
  try {
    await dockerExecAsync(['stop', '-t', String(timeout), containerIdOrName]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such container')) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    throw error;
  }
}

/**
 * 删除容器
 */
export function containerRemove(containerIdOrName: string, force: boolean = false): void {
  const args = ['rm'];
  if (force) {
    args.push('-f');
  }
  args.push(containerIdOrName);

  try {
    dockerExec(args);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such container')) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    throw error;
  }
}

/**
 * 删除容器（异步版本）
 */
export async function containerRemoveAsync(containerIdOrName: string, force: boolean = false): Promise<void> {
  const args = ['rm'];
  if (force) {
    args.push('-f');
  }
  args.push(containerIdOrName);

  try {
    await dockerExecAsync(args);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such container')) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    throw error;
  }
}

/**
 * 获取容器信息
 */
export function containerInspect(containerIdOrName: string): ContainerInfo {
  try {
    const output = dockerExec(['inspect', containerIdOrName]);
    const data = JSON.parse(output);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    const info = data[0];
    return {
      id: info.Id,
      name: info.Name.replace(/^\//, ''),
      status: info.State.Status,
      created: info.Created,
      image: info.Config.Image,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such container')) {
      throw new Error(`${CONTAINER_NOT_FOUND}: ${containerIdOrName}`);
    }
    throw error;
  }
}

/**
 * 列出容器
 */
export function containerList(all: boolean = true): ContainerInfo[] {
  const args = ['ps'];
  if (all) {
    args.push('-a');
  }
  args.push('--format', '{{json .}}');

  const output = dockerExec(args);
  if (!output) {
    return [];
  }

  return output.split('\n').filter(Boolean).map((line) => {
    const info = JSON.parse(line);
    return {
      id: info.ID || info.Id,
      name: info.Names || info.Name,
      status: info.Status === 'Up' ? 'running' : 'exited',
      created: info.CreatedAt || info.Created,
      image: info.Image,
    };
  });
}

/**
 * 获取容器资源使用情况
 */
export function containerStats(containerIdOrName: string): ResourceUsage {
  try {
    const output = dockerExec([
      'stats',
      '--no-stream',
      '--format',
      '{{json .}}',
      containerIdOrName,
    ]);
    const data = JSON.parse(output);

    return {
      cpuPercent: parseFloat(data.CPUPerc?.replace('%', '') || '0'),
      memoryUsed: parseMemString(data.MemUsage || '0 / 0'),
      memoryLimit: parseMemLimit(data.MemUsage || '0 / 0'),
      networkRx: parseNetString(data.NetIO || '0 / 0', 'rx'),
      networkTx: parseNetString(data.NetIO || '0 / 0', 'tx'),
    };
  } catch {
    return {
      cpuPercent: 0,
      memoryUsed: 0,
      memoryLimit: 0,
      networkRx: 0,
      networkTx: 0,
    };
  }
}

function parseMemString(memStr: string): number {
  const match = memStr.match(/([0-9.]+)\s*(B|KB|KiB|MB|MiB|GB|GiB)?/i);
  if (!match) return 0;
  let value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  const units: Record<string, number> = { B: 1, KB: 1000, KIB: 1024, MB: 1000000, MIB: 1048576, GB: 1000000000, GIB: 1073741824 };
  return value * (units[unit] || 1);
}

function parseMemLimit(memStr: string): number {
  const match = memStr.match(/\/\s*([0-9.]+)\s*(B|KB|KiB|MB|MiB|GB|GiB)?/i);
  if (!match) return 0;
  let value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  const units: Record<string, number> = { B: 1, KB: 1000, KIB: 1024, MB: 1000000, MIB: 1048576, GB: 1000000000, GIB: 1073741824 };
  return value * (units[unit] || 1);
}

function parseNetString(netStr: string, type: 'rx' | 'tx'): number {
  const parts = netStr.split('/');
  if (parts.length !== 2) return 0;
  const target = type === 'rx' ? parts[0].trim() : parts[1].trim();
  const match = target.match(/([0-9.]+)\s*(B|KB|KiB|MB|MiB|GB|GiB)?/i);
  if (!match) return 0;
  let value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  const units: Record<string, number> = { B: 1, KB: 1000, KIB: 1024, MB: 1000000, MIB: 1048576, GB: 1000000000, GIB: 1073741824 };
  return value * (units[unit] || 1);
}

// ============= 沙箱执行 =============

/**
 * 在沙箱容器中执行命令
 */
export async function sandboxExec(
  command: string | string[],
  options: SandboxExecOptions = {}
): Promise<SandboxResult> {
  const {
    timeout = DEFAULT_TIMEOUT,
    allowedTools = DEFAULT_ALLOWED_TOOLS,
    allowedPaths = [],
    deniedPaths = DEFAULT_DENIED_PATHS,
    networkIsolation = true,
    cpuLimit,
    memoryLimit,
    environment = {},
  } = options;

  // 检查 Docker 是否可用
  if (!isDockerAvailable()) {
    throw new Error(DOCKER_NOT_INSTALLED);
  }

  const containerName = generateContainerName('sandbox-exec');
  const startTime = Date.now();

  // 构建环境变量
  const env: Record<string, string> = {
    ...environment,
    SANDBOX_MODE: 'true',
    ALLOWED_TOOLS: allowedTools.join(','),
    ALLOWED_PATHS: allowedPaths.join(','),
    DENIED_PATHS: deniedPaths.join(','),
    CLAUDE_SKIP_PERMISSION_CHECK: '1',
    ANTHROPIC_CLI_NO_INTERACTIVE: '1',
  };

  // 构建 docker run 命令
  const args: string[] = ['run', '--name', containerName, '--rm'];

  // 网络隔离
  if (networkIsolation) {
    args.push('--network', 'none');
  }

  // 资源限制
  if (cpuLimit) {
    args.push('--cpus', cpuLimit);
  }
  if (memoryLimit) {
    args.push('--memory', memoryLimit);
  }

  // 环境变量
  for (const [key, value] of Object.entries(env)) {
    args.push('--env', `${key}=${value}`);
  }

  // 只读根文件系统 + 允许写入的目录
  args.push('--read-only');
  args.push('--tmpfs', '/tmp:rw,noexec,nosuid,size=64m');
  args.push('--tmpfs', '/var/run:rw,noexec,nosuid,size=16m');

  // 白名单路径可写
  if (allowedPaths.length > 0) {
    for (const allowedPath of allowedPaths) {
      args.push('--mount', `type=bind,source=${allowedPath},target=${allowedPath},rw`);
    }
  }

  // Alpine 镜像用于安全执行
  args.push('alpine:latest');

  // 命令：安装并运行
  const cmdArray = Array.isArray(command) ? command : [command];
  args.push('sh', '-c', `apk add --no-cache bash coreutils > /dev/null 2>&1 && ${cmdArray.join(' && ')}`);

  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let containerId = '';

  try {
    const result = await execAsync(`docker ${args.join(' ')}`, {
      encoding: 'utf-8',
      timeout,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    if (error instanceof Error) {
      // execAsync 会抛出包含 stdout/stderr 的错误
      if ('stdout' in error) {
        stdout = String((error as NodeJS.ErrnoException & { stdout?: string }).stdout || '');
        stderr = String((error as NodeJS.ErrnoException & { stderr?: string }).stderr || '');
      }
      if (error.message.includes('timeout')) {
        stderr += `\nExecution timed out after ${timeout}ms`;
        exitCode = 124;
      } else if (error.message.includes('signal')) {
        exitCode = 137;
        stderr += `\nProcess killed due to signal`;
      } else {
        exitCode = 1;
      }
    }
  }

  const duration = Date.now() - startTime;

  return {
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    duration,
    containerId,
  };
}

/**
 * 在沙箱中执行 Claude Code 命令
 */
export async function sandboxClaudeExec(
  command: string,
  options: Partial<SandboxExecOptions> & { apiKey?: string }
): Promise<SandboxResult> {
  const {
    apiKey,
    timeout = DEFAULT_TIMEOUT * 2, // Claude 执行需要更长时间
    networkIsolation = false, // Claude 需要网络访问
    cpuLimit = '2',
    memoryLimit = '2g',
    environment = {},
    allowedTools = ['Read', 'Bash', 'Grep', 'Glob', 'Write', 'Edit', 'GitHub'],
  } = options;

  if (!apiKey) {
    throw new Error('API key is required for Claude execution');
  }

  const env: Record<string, string> = {
    ...environment,
    ANTHROPIC_API_KEY: apiKey,
    CLAUDE_SKIP_PERMISSION_CHECK: '1',
    ANTHROPIC_CLI_NO_INTERACTIVE: '1',
  };

  const containerName = generateContainerName('claude-sandbox');
  const startTime = Date.now();

  // 使用 Claude Code 镜像（基于 claude-hub 的 Dockerfile）
  const args: string[] = [
    'run',
    '--name', containerName,
    '--rm',
    '--network', networkIsolation ? 'none' : 'bridge',
    '--cpus', cpuLimit,
    '--memory', memoryLimit,
    '--read-only',
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m',
    '--tmpfs', '/var/run:rw,noexec,nosuid,size=16m',
    '-v', `${process.cwd()}:/workspace:ro`,
    '-w', '/workspace',
  ];

  // 环境变量
  for (const [key, value] of Object.entries(env)) {
    args.push('--env', `${key}=${value}`);
  }

  // Alpine 镜像
  args.push('alpine:latest');

  const cmd = [
    'sh', '-c',
    `apk add --no-cache nodejs npm bash coreutils > /dev/null 2>&1 && ` +
    `npm install -g @anthropic-ai/claude-code > /dev/null 2>&1 && ` +
    `claude --allowedTools "${allowedTools.join(',')}" --print "${command.replace(/"/g, '\\"')}"`,
  ];

  args.push(...cmd);

  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    const result = await execAsync(`docker ${args.join(' ')}`, {
      encoding: 'utf-8',
      timeout,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    if (error instanceof Error) {
      if ('stdout' in error) {
        stdout = String((error as NodeJS.ErrnoException & { stdout?: string }).stdout || '');
        stderr = String((error as NodeJS.ErrnoException & { stderr?: string }).stderr || '');
      }
      if (error.message.includes('timeout')) {
        stderr += `\nExecution timed out after ${timeout}ms`;
        exitCode = 124;
      } else if (error.message.includes('signal')) {
        exitCode = 137;
      } else {
        exitCode = 1;
      }
    }
  }

  const duration = Date.now() - startTime;

  return {
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    duration,
    containerId: containerName,
  };
}

// ============= 镜像管理 =============

/**
 * 拉取镜像
 */
export async function imagePull(imageName: string, tag: string = 'latest'): Promise<void> {
  await dockerExecAsync(['pull', `${imageName}:${tag}`]);
}

/**
 * 列出本地镜像
 */
export function imageList(): Array<{ repository: string; tag: string; size: string; id: string }> {
  const output = dockerExec(['images', '--format', '{{json .}}']);
  if (!output) return [];

  return output.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

/**
 * 删除镜像
 */
export function imageRemove(imageName: string, force: boolean = false): void {
  const args = ['rmi'];
  if (force) {
    args.push('-f');
  }
  args.push(imageName);

  try {
    dockerExec(args);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No such image')) {
      throw new Error(`Image not found: ${imageName}`);
    }
    throw error;
  }
}

/**
 * 构建安全沙箱镜像
 */
export async function buildSandboxImage(
  outputPath: string = 'sandbox-image.tar'
): Promise<void> {
  // 创建临时 Dockerfile
  const dockerfileContent = `
FROM node:24-alpine

# 安装基础工具
RUN apk add --no-cache \\
    bash \\
    coreutils \\
    findutils \\
    gnupg \\
    curl \\
    wget

# 创建非 root 用户
RUN addgroup -g 1000 sandbox && \\
    adduser -D -u 1000 -G sandbox sandbox

# 设置工作目录
WORKDIR /workspace

# 切换到非 root 用户
USER sandbox

# 默认命令
CMD ["sh"]
`;

  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'sandbox-build-'));
  const dockerfilePath = path.join(tmpDir, 'Dockerfile');
  const contextDir = path.join(tmpDir, 'context');
  fs.mkdirSync(contextDir);

  fs.writeFileSync(dockerfilePath, dockerfileContent);

  try {
    // 构建镜像
    await dockerExecAsync([
      'build',
      '-t', 'sandbox:latest',
      '-f', dockerfilePath,
      contextDir,
    ]);

    // 导出镜像
    await dockerExecAsync(['save', '-o', outputPath, 'sandbox:latest']);
  } finally {
    // 清理临时文件
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ============= 清理工具 =============

/**
 * 清理所有已停止的容器
 */
export function cleanupContainers(): number {
  const containers = containerList(true);
  let count = 0;

  for (const container of containers) {
    if (container.status === 'exited' || container.status === 'dead') {
      try {
        containerRemove(container.id, true);
        count++;
      } catch {
        // 忽略清理失败
      }
    }
  }

  return count;
}

/**
 * 清理孤立资源
 */
export async function cleanupOrphaned(): Promise<{ containers: number; images: number; volumes: number }> {
  let containers = 0;
  let images = 0;
  let volumes = 0;

  // 清理孤立容器
  try {
    const { stdout } = await execAsync('docker container prune -f', { encoding: 'utf-8' });
    const match = stdout.match(/Total reclaimed space:.*?(\d+)/);
    containers = match ? parseInt(match[1], 10) : 0;
  } catch {
    // 忽略错误
  }

  // 清理孤立镜像
  try {
    const { stdout } = await execAsync('docker image prune -f', { encoding: 'utf-8' });
    const match = stdout.match(/Total reclaimed space:.*?(\d+)/);
    images = match ? parseInt(match[1], 10) : 0;
  } catch {
    // 忽略错误
  }

  // 清理孤立卷
  try {
    const { stdout } = await execAsync('docker volume prune -f', { encoding: 'utf-8' });
    const match = stdout.match(/Total reclaimed space:.*?(\d+)/);
    volumes = match ? parseInt(match[1], 10) : 0;
  } catch {
    // 忽略错误
  }

  return { containers, images, volumes };
}

/**
 * 完整系统清理
 */
export async function fullCleanup(): Promise<void> {
  // 停止所有运行中的容器
  const runningContainers = containerList(false);
  for (const container of runningContainers) {
    try {
      containerStop(container.id, 5);
    } catch {
      // 忽略错误
    }
  }

  // 清理孤立资源
  await cleanupOrphaned();
}

// ============= CLI 接口 =============

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'create': {
        const config: ContainerConfig = {
          image: args[1] || 'alpine:latest',
          name: args[2],
        };
        const id = containerCreate(config);
        console.log(`Container created: ${id}`);
        break;
      }

      case 'start': {
        if (!args[1]) {
          console.error('Usage: docker-utils start <container-name>');
          process.exit(1);
        }
        containerStart(args[1]);
        console.log(`Container started: ${args[1]}`);
        break;
      }

      case 'stop': {
        if (!args[1]) {
          console.error('Usage: docker-utils stop <container-name>');
          process.exit(1);
        }
        containerStop(args[1]);
        console.log(`Container stopped: ${args[1]}`);
        break;
      }

      case 'list': {
        const containers = containerList();
        console.log(JSON.stringify(containers, null, 2));
        break;
      }

      case 'stats': {
        if (!args[1]) {
          console.error('Usage: docker-utils stats <container-name>');
          process.exit(1);
        }
        const stats = containerStats(args[1]);
        console.log(JSON.stringify(stats, null, 2));
        break;
      }

      case 'cleanup': {
        const count = cleanupContainers();
        console.log(`Cleaned up ${count} containers`);
        break;
      }

      case 'cleanup-orphaned': {
        const result = await cleanupOrphaned();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'is-available': {
        console.log(isDockerAvailable() ? 'yes' : 'no');
        break;
      }

      case 'build-sandbox': {
        await buildSandboxImage(args[1]);
        console.log('Sandbox image built successfully');
        break;
      }

      case 'sandbox-exec': {
        if (!args[1]) {
          console.error('Usage: docker-utils sandbox-exec <command>');
          process.exit(1);
        }
        const result = await sandboxExec(args.slice(1));
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      default:
        console.log('Docker Container Isolation Utilities');
        console.log('');
        console.log('Usage:');
        console.log('  docker-utils create <image> [name]     Create a container');
        console.log('  docker-utils start <name>              Start a container');
        console.log('  docker-utils stop <name>               Stop a container');
        console.log('  docker-utils list                      List containers');
        console.log('  docker-utils stats <name>              Get container stats');
        console.log('  docker-utils cleanup                   Clean up stopped containers');
        console.log('  docker-utils cleanup-orphaned           Clean up orphaned resources');
        console.log('  docker-utils sandbox-exec <cmd>        Execute in sandbox');
        console.log('  docker-utils build-sandbox [output]     Build sandbox image');
        console.log('  docker-utils is-available              Check if Docker is installed');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}
