#!/usr/bin/env node

/**
 * Credential Manager - 凭证管理工具
 *
 * 提供 GitHub Token 的安全存储/读取，自动脱敏处理
 *
 * 功能:
 * - GitHub Token 安全存储/读取
 * - 自动脱敏（不在日志中暴露）
 * - 环境变量读取封装
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 类型定义
export interface CredentialConfig {
  token: string;
  org?: string;
  scopes?: string[];
  storedAt?: string;
}

export interface SecureCredential extends CredentialConfig {
  maskedToken: string;
}

const CREDENTIAL_ENV_KEYS = [
  'GITHUB_TOKEN',
  'GH_TOKEN',
  'GITHUB_PERSONAL_ACCESS_TOKEN',
  'GITHUB_APP_TOKEN',
];

const CREDENTIAL_FILE_NAME = '.gh-credentials.json';
const CREDENTIAL_DIR = '.claude';

/**
 * 脱敏 Token，只显示前4位和后4位
 */
export function maskToken(token: string): string {
  if (!token || token.length < 10) {
    return '****';
  }
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

/**
 * 脱敏处理后的凭证
 */
export function toSecureCredential(credential: CredentialConfig): SecureCredential {
  return {
    ...credential,
    token: '', // 不返回实际 token
    maskedToken: maskToken(credential.token),
  };
}

/**
 * 检查环境变量中是否有 GitHub Token
 */
export function getTokenFromEnv(): string | undefined {
  for (const key of CREDENTIAL_ENV_KEYS) {
    const token = process.env[key];
    if (token) {
      return token;
    }
  }
  return undefined;
}

/**
 * 读取凭证文件
 */
export function readCredentialFile(baseDir?: string): CredentialConfig | null {
  const dir = baseDir || process.cwd();
  const credPath = path.join(dir, CREDENTIAL_DIR, CREDENTIAL_FILE_NAME);

  try {
    if (!fs.existsSync(credPath)) {
      return null;
    }

    const content = fs.readFileSync(credPath, 'utf-8');
    const data = JSON.parse(content) as CredentialConfig;

    if (!data.token) {
      return null;
    }

    return {
      ...data,
      storedAt: data.storedAt || fs.statSync(credPath).mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * 保存凭证到文件
 */
export function saveCredentialFile(
  token: string,
  org?: string,
  baseDir?: string
): void {
  const dir = baseDir || process.cwd();
  const credDir = path.join(dir, CREDENTIAL_DIR);
  const credPath = path.join(credDir, CREDENTIAL_FILE_NAME);

  // 确保目录存在
  if (!fs.existsSync(credDir)) {
    fs.mkdirSync(credDir, { recursive: true });
  }

  // 60 秒后自动过期，确保临时使用
  const config: CredentialConfig = {
    token,
    org,
    storedAt: new Date().toISOString(),
    scopes: detectTokenScopes(token),
  };

  fs.writeFileSync(credPath, JSON.stringify(config, null, 2), 'utf-8');

  // 设置文件权限为所有者可读写（Unix 系统）
  try {
    fs.chmodSync(credPath, 0o600);
  } catch {
    // Windows 系统忽略 chmod 错误
  }
}

/**
 * 删除凭证文件
 */
export function deleteCredentialFile(baseDir?: string): boolean {
  const dir = baseDir || process.cwd();
  const credPath = path.join(dir, CREDENTIAL_DIR, CREDENTIAL_FILE_NAME);

  try {
    if (fs.existsSync(credPath)) {
      fs.unlinkSync(credPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 检测 Token 的权限范围
 */
function detectTokenScopes(token: string): string[] {
  const scopes: string[] = [];

  // 这是一个简化的检测，实际 scopes 需要通过 GitHub API 查询
  if (token.startsWith('ghp_')) {
    scopes.push('repo', 'workflow');
  } else if (token.startsWith('github_')) {
    scopes.push('read:user', 'read:org');
  } else if (token.startsWith('ghs_') || token.startsWith('gho_')) {
    scopes.push('repo', 'admin:repo_hook', 'read:org');
  }

  return scopes;
}

/**
 * 获取凭证 - 优先从环境变量读取，其次从文件读取
 */
export function getCredential(baseDir?: string): CredentialConfig | null {
  // 1. 首先检查环境变量
  const envToken = getTokenFromEnv();
  if (envToken) {
    return {
      token: envToken,
      scopes: detectTokenScopes(envToken),
    };
  }

  // 2. 检查凭证文件
  const fileCredential = readCredentialFile(baseDir);
  if (fileCredential) {
    return fileCredential;
  }

  return null;
}

/**
 * 获取凭证（安全版本）- 只返回脱敏信息
 */
export function getSecureCredential(baseDir?: string): SecureCredential | null {
  const credential = getCredential(baseDir);
  if (!credential) {
    return null;
  }
  return toSecureCredential(credential);
}

/**
 * 获取凭证并自动设置到环境变量
 */
export function getAndSetupCredential(baseDir?: string): string | null {
  const credential = getCredential(baseDir);
  if (!credential) {
    return null;
  }

  // 设置到环境变量（只对当前进程）
  process.env.GITHUB_TOKEN = credential.token;
  process.env.GH_TOKEN = credential.token;

  return credential.token;
}

/**
 * 验证 Token 是否有效
 */
export function validateToken(token: string): boolean {
  if (!token || token.length < 10) {
    return false;
  }

  // 基本的格式检查
  if (!/^(ghp_|github_|ghs_|gho_|xoxb-|xoxp-)/.test(token)) {
    return false;
  }

  // 尝试调用 gh auth status 验证
  try {
    const result = execSync('gh auth status', {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: {
        ...process.env,
        GITHUB_TOKEN: token,
        GH_TOKEN: token,
      },
    });
    return result.includes('✓') || result.includes('authenticated');
  } catch {
    return false;
  }
}

/**
 * 检查凭证是否即将过期（基于存储时间）
 */
export function isCredentialExpired(baseDir?: string, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
  const credential = readCredentialFile(baseDir);
  if (!credential || !credential.storedAt) {
    return true;
  }

  const storedTime = new Date(credential.storedAt).getTime();
  const now = Date.now();

  return (now - storedTime) > maxAgeMs;
}

/**
 * 格式化凭证信息用于日志（自动脱敏）
 */
export function formatCredentialLog(credential: CredentialConfig | SecureCredential): string {
  if ('maskedToken' in credential) {
    return `Token: ${credential.maskedToken}, Org: ${credential.org || 'none'}`;
  }
  return `Token: ${maskToken(credential.token)}, Org: ${credential.org || 'none'}`;
}

/**
 * 安全输出凭证信息（用于调试）
 */
export function safeCredentialDump(credential: CredentialConfig | SecureCredential): string {
  if ('maskedToken' in credential) {
    return JSON.stringify(credential, null, 2);
  }

  const masked: SecureCredential = toSecureCredential(credential);
  return JSON.stringify({
    ...masked,
    _warning: 'Actual token not shown for security reasons',
  }, null, 2);
}

/**
 * 清除所有敏感环境变量
 */
export function clearSensitiveEnv(): void {
  for (const key of CREDENTIAL_ENV_KEYS) {
    delete process.env[key];
  }
}

/**
 * 获取安全的环境变量快照（用于日志）
 */
export function getSafeEnvSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {};

  for (const key of Object.keys(process.env)) {
    if (CREDENTIAL_ENV_KEYS.includes(key)) {
      const value = process.env[key];
      snapshot[key] = value ? maskToken(value) : '';
    } else if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) {
      const value = process.env[key];
      snapshot[key] = value ? '****' : '';
    } else {
      snapshot[key] = process.env[key] || '';
    }
  }

  return snapshot;
}

/**
 * 检查是否以安全模式运行（无 Token）
 */
export function isSecureMode(): boolean {
  return !getTokenFromEnv() && !readCredentialFile();
}

/**
 * 获取系统信息（用于调试）
 */
export function getSystemInfo(): {
  platform: string;
  homedir: string;
  cwd: string;
  nodeVersion: string;
  hasGhCli: boolean;
  hasToken: boolean;
} {
  let hasGhCli = false;
  try {
    execSync('gh --version', { stdio: 'pipe' });
    hasGhCli = true;
  } catch {
    // gh not installed
  }

  return {
    platform: os.platform(),
    homedir: os.homedir(),
    cwd: process.cwd(),
    nodeVersion: process.version,
    hasGhCli,
    hasToken: !!getTokenFromEnv(),
  };
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'get': {
        const credential = getSecureCredential();
        if (credential) {
          console.log(JSON.stringify(credential, null, 2));
        } else {
          console.log('No credential found');
          process.exit(1);
        }
        break;
      }

      case 'save': {
        const token = args[1];
        if (!token) {
          console.error('Usage: credential-manager save <token> [org]');
          process.exit(1);
        }
        const org = args[2];
        saveCredentialFile(token, org);
        console.log('Credential saved successfully');
        console.log(`Masked: ${maskToken(token)}`);
        break;
      }

      case 'delete': {
        const deleted = deleteCredentialFile();
        console.log(deleted ? 'Credential deleted' : 'No credential file found');
        break;
      }

      case 'validate': {
        const token = args[1] || getTokenFromEnv();
        if (!token) {
          console.log('no-token');
          process.exit(1);
        }
        const valid = validateToken(token);
        console.log(valid ? 'valid' : 'invalid');
        break;
      }

      case 'check': {
        const credential = getSecureCredential();
        if (credential) {
          console.log('✓ Credential found');
          console.log(JSON.stringify(credential, null, 2));
        } else {
          console.log('✗ No credential found');
        }
        break;
      }

      case 'clear': {
        clearSensitiveEnv();
        console.log('Sensitive environment variables cleared');
        break;
      }

      case 'secure-mode': {
        console.log(isSecureMode() ? 'yes' : 'no');
        break;
      }

      case 'system-info': {
        console.log(JSON.stringify(getSystemInfo(), null, 2));
        break;
      }

      case 'is-expired': {
        const expired = isCredentialExpired();
        console.log(expired ? 'expired' : 'valid');
        break;
      }

      default:
        console.log('Credential Manager - 凭证管理工具');
        console.log('');
        console.log('Usage:');
        console.log('  credential-manager get              Get credential (masked)');
        console.log('  credential-manager save <token> [org]   Save credential');
        console.log('  credential-manager delete           Delete credential');
        console.log('  credential-manager validate [token] Validate token');
        console.log('  credential-manager check            Check credential status');
        console.log('  credential-manager clear             Clear sensitive env vars');
        console.log('  credential-manager secure-mode       Check if in secure mode');
        console.log('  credential-manager system-info       Get system info');
        console.log('  credential-manager is-expired         Check if stored credential expired');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}
