/**
 * State MCP Tools - 状态管理 MCP 工具
 *
 * 提供跨 session 的持久化状态管理
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export type StateMode = 'team' | 'ralph' | 'ultrawork' | 'ultraqa' | 'autopilot' | 'session';

const STATE_DIR = join(homedir(), '.claude', 'state');
const SESSIONS_DIR = join(STATE_DIR, 'sessions');

// Ensure directories exist
function ensureStateDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
  if (!existsSync(SESSIONS_DIR)) {
    mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

function getSessionDir(sessionId?: string): string {
  ensureStateDir();
  if (sessionId) {
    const dir = join(SESSIONS_DIR, sessionId);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }
  return STATE_DIR;
}

function getStateFilePath(mode: StateMode, sessionId?: string): string {
  const dir = getSessionDir(sessionId);
  return join(dir, `${mode}-state.json`);
}

export interface StateStatus {
  mode: StateMode;
  sessionId?: string;
  path: string;
  exists: boolean;
  lastModified?: number;
  size?: number;
}

export interface ActiveMode {
  mode: StateMode;
  sessionId?: string;
  active: boolean;
  lastSeen: number;
}

/**
 * Read state for a specific mode
 */
export function stateRead(mode: StateMode, sessionId?: string): Record<string, unknown> | null {
  const path = getStateFilePath(mode, sessionId);

  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Write state for a specific mode
 */
export function stateWrite(
  mode: StateMode,
  state: Record<string, unknown>,
  sessionId?: string
): boolean {
  const path = getStateFilePath(mode, sessionId);

  try {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Add metadata
    const fullState = {
      ...state,
      _meta: {
        mode,
        sessionId: sessionId || null,
        updatedAt: Date.now(),
        updatedBy: process.env.USER || process.env.USERNAME || 'unknown',
      },
    };

    writeFileSync(path, JSON.stringify(fullState, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`[StateTools] Failed to write state to ${path}:`, e);
    return false;
  }
}

/**
 * Clear state for a specific mode
 */
export function stateClear(mode: StateMode, sessionId?: string): boolean {
  const path = getStateFilePath(mode, sessionId);

  if (!existsSync(path)) {
    return true; // Already clear
  }

  try {
    require('fs').unlinkSync(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all active modes
 */
export function stateListActive(): ActiveMode[] {
  ensureStateDir();
  const activeModes: ActiveMode[] = [];

  // Check root state dir
  if (existsSync(STATE_DIR)) {
    const files = readdirSync(STATE_DIR).filter((f) => f.endsWith('-state.json'));
    for (const file of files) {
      const mode = file.replace('-state.json', '') as StateMode;
      const path = join(STATE_DIR, file);
      const stats = require('fs').statSync(path);
      activeModes.push({
        mode,
        active: true,
        lastSeen: stats.mtimeMs,
      });
    }
  }

  // Check sessions
  if (existsSync(SESSIONS_DIR)) {
    const sessions = readdirSync(SESSIONS_DIR);
    for (const session of sessions) {
      const sessionDir = join(SESSIONS_DIR, session);
      if (!require('fs').statSync(sessionDir).isDirectory()) continue;

      const files = readdirSync(sessionDir).filter((f) => f.endsWith('-state.json'));
      for (const file of files) {
        const mode = file.replace('-state.json', '') as StateMode;
        const path = join(sessionDir, file);
        const stats = require('fs').statSync(path);
        activeModes.push({
          mode,
          sessionId: session,
          active: true,
          lastSeen: stats.mtimeMs,
        });
      }
    }
  }

  return activeModes;
}

/**
 * Get detailed status for a mode or all modes
 */
export function stateGetStatus(mode?: StateMode, sessionId?: string): {
  modes: StateStatus[];
  total: number;
} {
  const statuses: StateStatus[] = [];

  if (mode) {
    // Specific mode
    const path = getStateFilePath(mode, sessionId);
    const exists = existsSync(path);
    let lastModified: number | undefined;
    let size: number | undefined;

    if (exists) {
      const stats = require('fs').statSync(path);
      lastModified = stats.mtimeMs;
      size = stats.size;
    }

    statuses.push({
      mode,
      sessionId,
      path,
      exists,
      lastModified,
      size,
    });
  } else {
    // All modes
    const active = stateListActive();
    for (const a of active) {
      const path = getStateFilePath(a.mode, a.sessionId);
      const exists = existsSync(path);
      let lastModified: number | undefined;
      let size: number | undefined;

      if (exists) {
        const stats = require('fs').statSync(path);
        lastModified = stats.mtimeMs;
        size = stats.size;
      }

      statuses.push({
        mode: a.mode,
        sessionId: a.sessionId,
        path,
        exists,
        lastModified,
        size,
      });
    }
  }

  return {
    modes: statuses,
    total: statuses.length,
  };
}

/**
 * Generate a new session ID
 */
export function generateSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// CLI-friendly exports for direct node execution
export const cliCommands = {
  read: (mode: string, sessionId?: string) => {
    const result = stateRead(mode as StateMode, sessionId);
    console.log(JSON.stringify(result, null, 2));
  },
  write: (mode: string, sessionId?: string) => {
    const input = require('fs').readFileSync(0, 'utf-8');
    const state = JSON.parse(input);
    stateWrite(mode as StateMode, state, sessionId);
  },
  clear: (mode: string, sessionId?: string) => {
    stateClear(mode as StateMode, sessionId);
  },
  list: () => {
    console.log(JSON.stringify(stateListActive(), null, 2));
  },
  status: (mode?: string, sessionId?: string) => {
    console.log(JSON.stringify(stateGetStatus(mode as StateMode | undefined, sessionId), null, 2));
  },
};
