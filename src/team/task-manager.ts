/**
 * Team Task Manager - 团队任务管理
 */

import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { TeamTask, TaskStatus } from './types.js';
import { getTeamPaths } from './paths.js';

let taskIdCounter = 0;

function generateTaskId(): string {
  return `task-${Date.now()}-${++taskIdCounter}`;
}

export function createTask(
  teamName: string,
  subject: string,
  description: string,
  owner?: string,
  blockedBy: string[] = [],
  blocks: string[] = []
): TeamTask {
  const now = Date.now();
  const task: TeamTask = {
    id: generateTaskId(),
    subject,
    description,
    status: 'pending',
    owner,
    blockedBy,
    blocks,
    createdAt: now,
    updatedAt: now,
  };

  const paths = getTeamPaths(teamName);
  const taskFile = join(paths.tasks, `${task.id}.json`);
  writeFileSync(taskFile, JSON.stringify(task, null, 2), 'utf-8');

  return task;
}

export function getTask(teamName: string, taskId: string): TeamTask | null {
  const paths = getTeamPaths(teamName);
  const taskFile = join(paths.tasks, `${taskId}.json`);

  if (!existsSync(taskFile)) {
    return null;
  }

  try {
    const content = readFileSync(taskFile, 'utf-8');
    return JSON.parse(content) as TeamTask;
  } catch {
    return null;
  }
}

export function listTasks(teamName: string, status?: TaskStatus): TeamTask[] {
  const paths = getTeamPaths(teamName);

  if (!existsSync(paths.tasks)) {
    return [];
  }

  const files = readdirSync(paths.tasks).filter((f) => f.endsWith('.json'));
  const tasks: TeamTask[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(paths.tasks, file), 'utf-8');
      const task = JSON.parse(content) as TeamTask;
      if (!status || task.status === status) {
        tasks.push(task);
      }
    } catch {
      // Skip invalid task files
    }
  }

  return tasks.sort((a, b) => a.createdAt - b.createdAt);
}

export function updateTask(
  teamName: string,
  taskId: string,
  updates: Partial<Pick<TeamTask, 'status' | 'owner' | 'description'>>
): TeamTask | null {
  const task = getTask(teamName, taskId);
  if (!task) {
    return null;
  }

  const now = Date.now();
  const updated: TeamTask = {
    ...task,
    ...updates,
    updatedAt: now,
  };

  if (updates.status === 'completed' && !task.completedAt) {
    updated.completedAt = now;
  }

  const paths = getTeamPaths(teamName);
  const taskFile = join(paths.tasks, `${taskId}.json`);
  writeFileSync(taskFile, JSON.stringify(updated, null, 2), 'utf-8');

  return updated;
}

export function claimTask(teamName: string, taskId: string, workerName: string): TeamTask | null {
  const task = getTask(teamName, taskId);
  if (!task) {
    return null;
  }

  if (task.status !== 'pending') {
    return null;
  }

  // Check if blocked
  for (const blockerId of task.blockedBy) {
    const blocker = getTask(teamName, blockerId);
    if (blocker && blocker.status !== 'completed') {
      return null;
    }
  }

  return updateTask(teamName, taskId, { status: 'in_progress', owner: workerName });
}

export function releaseTask(teamName: string, taskId: string): TeamTask | null {
  return updateTask(teamName, taskId, { status: 'pending', owner: undefined });
}

export function getTaskStats(teamName: string): {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  blocked: number;
} {
  const tasks = listTasks(teamName);

  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  };
}
