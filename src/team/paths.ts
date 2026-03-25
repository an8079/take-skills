/**
 * Team State Paths - 团队状态路径管理
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const OMC_STATE_DIR = '.omc/state';
const TEAM_DIR = 'team';

export interface TeamPaths {
  root: string;
  config: string;
  manifest: string;
  tasks: string;
  sharedMemory: string;
  events: string;
  workers: string;
  mailboxes: string;
  approvals: string;
}

function getProjectRoot(): string {
  try {
    const { execSync } = require('child_process');
    const root = execSync('git rev-parse --show-toplevel', {
      cwd: process.cwd(),
      encoding: 'utf-8',
    }).trim();
    return root;
  } catch {
    return process.cwd();
  }
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function getTeamPaths(teamName: string): TeamPaths {
  const projectRoot = getProjectRoot();
  const omcStateDir = join(projectRoot, OMC_STATE_DIR);
  const teamDir = join(omcStateDir, TEAM_DIR, teamName);

  const paths: TeamPaths = {
    root: teamDir,
    config: join(teamDir, 'config.json'),
    manifest: join(teamDir, 'manifest.json'),
    tasks: join(teamDir, 'tasks'),
    sharedMemory: join(teamDir, 'shared-memory.json'),
    events: join(teamDir, 'events.jsonl'),
    workers: join(teamDir, 'workers'),
    mailboxes: join(teamDir, 'mailbox'),
    approvals: join(teamDir, 'approvals'),
  };

  // Ensure all directories exist
  ensureDir(omcStateDir);
  ensureDir(teamDir);
  ensureDir(paths.tasks);
  ensureDir(paths.workers);
  ensureDir(paths.mailboxes);
  ensureDir(paths.approvals);

  return paths;
}

export function getWorkerPaths(teamName: string, workerName: string): {
  inbox: string;
  outbox: string;
  heartbeat: string;
  ready: string;
  shutdownAck: string;
  identity: string;
  agentsMd: string;
} {
  const teamPaths = getTeamPaths(teamName);
  const workerDir = join(teamPaths.workers, workerName);
  ensureDir(workerDir);

  return {
    inbox: join(workerDir, 'inbox.md'),
    outbox: join(workerDir, 'outbox.jsonl'),
    heartbeat: join(workerDir, 'heartbeat.json'),
    ready: join(workerDir, '.ready'),
    shutdownAck: join(workerDir, 'shutdown-ack.json'),
    identity: join(workerDir, 'identity.json'),
    agentsMd: join(workerDir, 'AGENTS.md'),
  };
}

export function getSessionPaths(sessionId?: string): {
  stateDir: string;
  stateFile: string;
} {
  const projectRoot = getProjectRoot();
  const omcStateDir = join(projectRoot, OMC_STATE_DIR);

  let stateDir: string;
  let stateFile: string;

  if (sessionId) {
    stateDir = join(omcStateDir, 'sessions', sessionId);
    stateFile = join(stateDir, 'team-state.json');
  } else {
    stateDir = join(omcStateDir, 'sessions');
    stateFile = join(stateDir, 'team-state.json');
  }

  ensureDir(stateDir);

  return { stateDir, stateFile };
}
