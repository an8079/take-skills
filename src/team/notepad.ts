/**
 * Team Notepad - 团队共享笔记本
 *
 * 三个区域:
 * - priority: 高优先级上下文（session 启动时自动加载）
 * - working: 工作日志（7天自动清理）
 * - manual: 手动笔记（永久保留）
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const NOTEPAD_FILE = 'notepad.md';
const PRIORITY_SECTION = '<!-- PRIORITY -->\n';
const WORKING_SECTION = '<!-- WORKING -->\n';
const MANUAL_SECTION = '<!-- MANUAL -->\n';

export interface NotepadContent {
  priority: string[];
  working: string[];
  manual: string[];
}

function getNotepadPath(teamName?: string): string {
  const basePath = teamName
    ? join(homedir(), '.claude', 'teams', teamName)
    : join(process.cwd(), '.omc', 'state');

  return join(basePath, NOTEPAD_FILE);
}

function ensureNotepadDir(teamName?: string): void {
  const basePath = teamName
    ? join(homedir(), '.claude', 'teams', teamName)
    : join(process.cwd(), '.omc', 'state');

  if (!existsSync(basePath)) {
    require('fs').mkdirSync(basePath, { recursive: true });
  }
}

/**
 * Initialize a new notepad with section markers
 */
export function initNotepad(teamName?: string): void {
  const path = getNotepadPath(teamName);
  ensureNotepadDir(teamName);

  if (!existsSync(path)) {
    const content = `${PRIORITY_SECTION}${WORKING_SECTION}${MANUAL_SECTION}`;
    writeFileSync(path, content, 'utf-8');
  }
}

/**
 * Read all notepad sections
 */
export function readNotepad(teamName?: string): NotepadContent {
  const path = getNotepadPath(teamName);

  if (!existsSync(path)) {
    return { priority: [], working: [], manual: [] };
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return parseNotepad(content);
  } catch {
    return { priority: [], working: [], manual: [] };
  }
}

function parseNotepad(content: string): NotepadContent {
  const sections = content.split(/<!-- (PRIORITY|WORKING|MANUAL) -->/);

  return {
    priority: sections[2]?.trim().split('\n').filter((l) => l.trim()) || [],
    working: sections[4]?.trim().split('\n').filter((l) => l.trim()) || [],
    manual: sections[6]?.trim().split('\n').filter((l) => l.trim()) || [],
  };
}

/**
 * Write to priority section
 */
export function writePriority(entry: string, teamName?: string): void {
  const content = readNotepad(teamName);
  content.priority.push(`[${new Date().toISOString()}] ${entry}`);
  writeNotepad(content, teamName);
}

/**
 * Write to working section
 */
export function writeWorking(entry: string, teamName?: string): void {
  const content = readNotepad(teamName);
  content.working.push(`[${new Date().toISOString()}] ${entry}`);
  writeNotepad(content, teamName);
}

/**
 * Write to manual section
 */
export function writeManual(entry: string, teamName?: string): void {
  const content = readNotepad(teamName);
  content.manual.push(entry);
  writeNotepad(content, teamName);
}

function writeNotepad(content: NotepadContent, teamName?: string): void {
  const path = getNotepadPath(teamName);
  ensureNotepadDir(teamName);

  const md = `${PRIORITY_SECTION}${content.priority.join('\n')}\n\n${WORKING_SECTION}${content.working.join('\n')}\n\n${MANUAL_SECTION}${content.manual.join('\n')}\n`;
  writeFileSync(path, md, 'utf-8');
}

/**
 * Clear working section (for cleanup)
 */
export function clearWorking(teamName?: string): void {
  const content = readNotepad(teamName);
  content.working = [];
  writeNotepad(content, teamName);
}

/**
 * Get notepad for context injection
 */
export function getNotepadForContext(teamName?: string): string {
  const content = readNotepad(teamName);
  const lines: string[] = [];

  if (content.priority.length > 0) {
    lines.push('## Priority Context');
    lines.push(...content.priority);
    lines.push('');
  }

  if (content.working.length > 0) {
    lines.push('## Working Notes');
    lines.push(...content.working.slice(-10)); // Last 10 entries
    lines.push('');
  }

  if (content.manual.length > 0) {
    lines.push('## Manual Notes');
    lines.push(...content.manual);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Prune old working entries (older than 7 days)
 */
export function pruneWorking(teamName?: string, maxAgeDays: number = 7): void {
  const content = readNotepad(teamName);
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  content.working = content.working.filter((entry) => {
    const match = entry.match(/\[([^\]]+)\]/);
    if (match) {
      const timestamp = new Date(match[1]).getTime();
      return timestamp > cutoff;
    }
    return true;
  });

  writeNotepad(content, teamName);
}
