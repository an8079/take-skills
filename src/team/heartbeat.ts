/**
 * Team Heartbeat - 团队心跳和健康检查
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getWorkerPaths } from './paths.js';

const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds

export interface WorkerHeartbeat {
  worker: string;
  role: string;
  status: 'idle' | 'active' | 'done' | 'failed';
  lastHeartbeat: number;
  currentTask?: string;
}

/**
 * Update worker's heartbeat
 */
export function updateHeartbeat(
  teamName: string,
  workerName: string,
  role: string,
  status: 'idle' | 'active' | 'done' | 'failed',
  currentTask?: string
): void {
  const paths = getWorkerPaths(teamName, workerName);

  const heartbeat: WorkerHeartbeat = {
    worker: workerName,
    role,
    status,
    lastHeartbeat: Date.now(),
    currentTask,
  };

  writeFileSync(paths.heartbeat, JSON.stringify(heartbeat, null, 2), 'utf-8');
}

/**
 * Get worker's last heartbeat
 */
export function getHeartbeat(teamName: string, workerName: string): WorkerHeartbeat | null {
  const paths = getWorkerPaths(teamName, workerName);

  if (!existsSync(paths.heartbeat)) {
    return null;
  }

  try {
    const content = readFileSync(paths.heartbeat, 'utf-8');
    return JSON.parse(content) as WorkerHeartbeat;
  } catch {
    return null;
  }
}

/**
 * Get all workers' heartbeats
 */
export function getAllHeartbeats(teamName: string): WorkerHeartbeat[] {
  const paths = getWorkerPaths(teamName, '');
  const workersDir = join(paths.workers);

  if (!existsSync(workersDir)) {
    return [];
  }

  const workerDirs = (require('fs').readdirSync(workersDir) as string[]);
  const heartbeats: WorkerHeartbeat[] = [];

  for (const worker of workerDirs) {
    const hb = getHeartbeat(teamName, worker);
    if (hb) {
      heartbeats.push(hb);
    }
  }

  return heartbeats;
}

/**
 * Check if a worker is stale (no heartbeat within timeout)
 */
export function isWorkerStale(teamName: string, workerName: string): boolean {
  const hb = getHeartbeat(teamName, workerName);

  if (!hb) {
    return true;
  }

  return Date.now() - hb.lastHeartbeat > HEARTBEAT_TIMEOUT;
}

/**
 * Get stale workers
 */
export function getStaleWorkers(teamName: string): string[] {
  const heartbeats = getAllHeartbeats(teamName);

  return heartbeats
    .filter((hb) => isWorkerStale(teamName, hb.worker))
    .map((hb) => hb.worker);
}

/**
 * Get team health status
 */
export function getTeamHealth(teamName: string): {
  totalWorkers: number;
  activeWorkers: number;
  staleWorkers: number[];
  idleWorkers: number;
  doneWorkers: number;
} {
  const heartbeats = getAllHeartbeats(teamName);
  const stale = getStaleWorkers(teamName);

  return {
    totalWorkers: heartbeats.length,
    activeWorkers: heartbeats.filter((hb) => hb.status === 'active').length,
    staleWorkers: stale,
    idleWorkers: heartbeats.filter((hb) => hb.status === 'idle').length,
    doneWorkers: heartbeats.filter((hb) => hb.status === 'done').length,
  };
}

/**
 * Mark worker as ready (sentinel file)
 */
export function markWorkerReady(teamName: string, workerName: string): void {
  const paths = getWorkerPaths(teamName, workerName);
  writeFileSync(paths.ready, Date.now().toString(), 'utf-8');
}

/**
 * Check if worker is ready
 */
export function isWorkerReady(teamName: string, workerName: string): boolean {
  const paths = getWorkerPaths(teamName, workerName);
  return existsSync(paths.ready);
}
