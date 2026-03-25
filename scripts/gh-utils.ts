#!/usr/bin/env node

/**
 * GitHub CLI Utilities
 *
 * 封装常用 gh 命令，提供类型安全的接口
 *
 * 功能:
 * - gh pr view - 查看 PR 信息
 * - gh pr diff - 获取 PR 变更
 * - gh issue edit - 编辑 Issue
 * - gh pr review - 提交 PR 审查
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 类型定义
export interface PRInfo {
  number: number;
  title: string;
  state: string;
  author: string;
  url: string;
  body: string;
  base: string;
  head: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
}

export interface IssueEditParams {
  title?: string;
  body?: string;
  assignees?: string[];
  labels?: string[];
  state?: 'open' | 'closed';
}

export interface ReviewParams {
  prNumber: number;
  reviewType: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body?: string;
  commitId?: string;
}

export interface GhExecOptions {
  cwd?: string;
  silent?: boolean;
  env?: NodeJS.ProcessEnv;
}

const GH_NOT_INSTALLED = 'GitHub CLI (gh) is not installed';
const GH_NOT_AUTHENTICATED = 'GitHub CLI is not authenticated';

/**
 * 检查 gh 是否可用
 */
export function isGhAvailable(): boolean {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(): boolean {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 执行 gh 命令
 */
function ghExec(args: string[], options: GhExecOptions = {}): string {
  if (!isGhAvailable()) {
    throw new Error(GH_NOT_INSTALLED);
  }

  const { cwd = process.cwd(), silent = true, env = process.env } = options;

  try {
    const result = execSync(`gh ${args.join(' ')}`, {
      cwd,
      encoding: 'utf-8',
      silent,
      env: {
        ...env,
        // 确保不会意外暴露 token
        GITHUB_TOKEN: env.GITHUB_TOKEN || '',
        GH_TOKEN: env.GH_TOKEN || '',
      },
    });
    return result.trim();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      throw new Error(GH_NOT_AUTHENTICATED);
    }
    throw error;
  }
}

/**
 * 异步执行 gh 命令
 */
async function ghExecAsync(args: string[], options: GhExecOptions = {}): Promise<string> {
  if (!isGhAvailable()) {
    throw new Error(GH_NOT_INSTALLED);
  }

  const { cwd = process.cwd(), env = process.env } = options;

  try {
    const { stdout } = await execAsync(`gh ${args.join(' ')}`, {
      cwd,
      env: {
        ...env,
        GITHUB_TOKEN: env.GITHUB_TOKEN || '',
        GH_TOKEN: env.GH_TOKEN || '',
      },
    });
    return stdout.trim();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      throw new Error(GH_NOT_AUTHENTICATED);
    }
    throw error;
  }
}

/**
 * 查看 PR 信息
 */
export function prView(prNumberOrUrl?: number | string, options: GhExecOptions = {}): PRInfo {
  let prArg: string;

  if (!prNumberOrUrl) {
    prArg = '--json number,title,state,author,url,body,base,sha,additions,deletions,changedFiles';
  } else if (typeof prNumberOrUrl === 'number') {
    prArg = `${prNumberOrUrl} --json number,title,state,author,url,body,base,sha,additions,deletions,changedFiles`;
  } else {
    // 处理 URL，提取 PR 编号
    const match = prNumberOrUrl.match(/\/pull\/(\d+)/);
    if (match) {
      prArg = `${match[1]} --json number,title,state,author,url,body,base,sha,additions,deletions,changedFiles`;
    } else {
      prArg = `--json number,title,state,author,url,body,base,sha,additions,deletions,changedFiles`;
    }
  }

  const output = ghExec(['pr', 'view', prArg, '--jq', '.'], options);

  if (!output) {
    throw new Error('PR not found');
  }

  // 解析 JSON 输出
  try {
    // gh pr view --json 返回的是扁平化的文本，需要用 --jq 处理
    const jsonOutput = ghExec(['pr', 'view', prArg, '--jq', '.']);
    return JSON.parse(jsonOutput);
  } catch {
    // 降级处理：手动解析
    const lines = output.split('\n');
    const info: Record<string, string> = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        info[key] = value;
      }
    }

    return {
      number: parseInt(info.number || '0', 10),
      title: info.title || '',
      state: info.state || 'unknown',
      author: info.author || 'unknown',
      url: info.url || '',
      body: info.body || '',
      base: info.base || '',
      head: info.head || info.sha || '',
    };
  }
}

/**
 * 获取 PR diff
 */
export function prDiff(prNumber: number, options: GhExecOptions = {}): string {
  return ghExec(['pr', 'diff', `${prNumber}`], options);
}

/**
 * 异步获取 PR diff
 */
export async function prDiffAsync(prNumber: number, options: GhExecOptions = {}): Promise<string> {
  return ghExecAsync(['pr', 'diff', `${prNumber}`], options);
}

/**
 * 获取 PR 变更的文件列表
 */
export function prFiles(prNumber: number, options: GhExecOptions = {}): Array<{
  filename: string;
  status: string;
  additions: number;
  deletions: number;
}> {
  const output = ghExec([
    'pr', 'view', `${prNumber}`,
    '--json', 'changedFiles',
    '--jq', '.changedFiles'
  ], options);

  // gh 没有直接的 --json changedFiles 输出文件列表，用 pr diff --stat 代替
  const statOutput = ghExec(['pr', 'diff', `${prNumber}`, '--stat'], options);

  const files: Array<{ filename: string; status: string; additions: number; deletions: number }> = [];
  const lines = statOutput.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*(.+?)\s*[\|+-]+\s*(\d+)\s*\+(\d+)\s*-(\d+)/);
    if (match) {
      files.push({
        filename: match[1].trim(),
        status: 'modified',
        additions: parseInt(match[2], 10),
        deletions: parseInt(match[3], 10),
      });
    }
  }

  return files;
}

/**
 * 编辑 Issue
 */
export function issueEdit(
  issueNumberOrUrl: number | string,
  params: IssueEditParams,
  options: GhExecOptions = {}
): void {
  const args = ['issue', 'edit'];

  // 处理 URL，提取 issue 编号
  let issueNumber: number;
  if (typeof issueNumberOrUrl === 'number') {
    issueNumber = issueNumberOrUrl;
  } else {
    const match = issueNumberOrUrl.match(/\/issues\/(\d+)/);
    if (!match) {
      throw new Error('Invalid issue URL');
    }
    issueNumber = parseInt(match[1], 10);
  }

  args.push(`${issueNumber}`);

  if (params.title) {
    args.push('--title', params.title);
  }

  if (params.body) {
    // 使用临时文件传递 body，避免命令行转义问题
    args.push('--body-file', '-');
  }

  if (params.assignees && params.assignees.length > 0) {
    args.push('--add-assignee', params.assignees.join(','));
  }

  if (params.labels && params.labels.length > 0) {
    args.push('--add-label', params.labels.join(','));
  }

  if (params.state) {
    args.push('--state', params.state);
  }

  ghExec(args, options);
}

/**
 * 提交 PR Review
 */
export function prReview(params: ReviewParams, options: GhExecOptions = {}): void {
  const args = ['pr', 'review', `${params.prNumber}`];

  args.push(`--${params.reviewType.toLowerCase()}`);

  if (params.body) {
    args.push('--body-file', '-');
  }

  if (params.commitId) {
    args.push('--commit-id', params.commitId);
  }

  ghExec(args, options);
}

/**
 * 异步提交 PR Review
 */
export async function prReviewAsync(
  params: ReviewParams,
  options: GhExecOptions = {}
): Promise<void> {
  const args = ['pr', 'review', `${params.prNumber}`];

  args.push(`--${params.reviewType.toLowerCase()}`);

  if (params.body) {
    args.push('--body-file', '-');
  }

  if (params.commitId) {
    args.push('--commit-id', params.commitId);
  }

  await ghExecAsync(args, options);
}

/**
 * 获取当前仓库信息
 */
export function getRepoInfo(options: GhExecOptions = {}): { owner: string; repo: string } {
  const output = ghExec(['repo', 'view', '--json', 'owner,name', '--jq', '.'], options);

  try {
    const data = JSON.parse(output);
    return {
      owner: data.owner?.login || data.owner || '',
      repo: data.name || '',
    };
  } catch {
    const parts = output.split('/');
    return {
      owner: parts[0] || '',
      repo: parts[1] || '',
    };
  }
}

/**
 * 创建 PR
 */
export interface CreatePROptions {
  title: string;
  body?: string;
  base?: string;
  head?: string;
  draft?: boolean;
  assignees?: string[];
  labels?: string[];
}

export function createPR(options: CreatePROptions, execOptions: GhExecOptions = {}): PRInfo {
  const args = ['pr', 'create'];

  args.push('--title', options.title);

  if (options.body) {
    args.push('--body-file', '-');
  }

  if (options.base) {
    args.push('--base', options.base);
  }

  if (options.head) {
    args.push('--head', options.head);
  }

  if (options.draft) {
    args.push('--draft');
  }

  if (options.assignees && options.assignees.length > 0) {
    for (const assignee of options.assignees) {
      args.push('--assignee', assignee);
    }
  }

  if (options.labels && options.labels.length > 0) {
    for (const label of options.labels) {
      args.push('--label', label);
    }
  }

  ghExec(args, execOptions);

  // 返回新创建的 PR 信息（从输出中提取 URL）
  return {
    number: 0,
    title: options.title,
    state: 'open',
    author: '',
    url: '',
    body: options.body || '',
    base: options.base || 'main',
    head: options.head || '',
  };
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'pr-view': {
        const prNumber = args[1] ? parseInt(args[1], 10) : undefined;
        const info = prView(prNumber);
        console.log(JSON.stringify(info, null, 2));
        break;
      }

      case 'pr-diff': {
        if (!args[1]) {
          console.error('Usage: gh-utils pr-diff <pr-number>');
          process.exit(1);
        }
        const diff = prDiff(parseInt(args[1], 10));
        console.log(diff);
        break;
      }

      case 'pr-review': {
        if (args.length < 3) {
          console.error('Usage: gh-utils pr-review <pr-number> <APPROVE|REQUEST_CHANGES|COMMENT> [body]');
          process.exit(1);
        }
        prReview({
          prNumber: parseInt(args[1], 10),
          reviewType: args[2] as 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
          body: args[3],
        });
        console.log('Review submitted successfully');
        break;
      }

      case 'is-available': {
        console.log(isGhAvailable() ? 'yes' : 'no');
        break;
      }

      case 'is-authenticated': {
        console.log(isAuthenticated() ? 'yes' : 'no');
        break;
      }

      default:
        console.log('GitHub CLI Utilities');
        console.log('');
        console.log('Usage:');
        console.log('  gh-utils pr-view [pr-number]     View PR information');
        console.log('  gh-utils pr-diff <pr-number>      Get PR diff');
        console.log('  gh-utils pr-review <pr-number> <APPROVE|REQUEST_CHANGES|COMMENT> [body]  Submit review');
        console.log('  gh-utils is-available             Check if gh is installed');
        console.log('  gh-utils is-authenticated         Check if authenticated');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}
