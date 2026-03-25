/**
 * Shared Memory - 团队共享内存
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { SharedMemory } from './types.js';
import { getTeamPaths } from './paths.js';

/**
 * Initialize shared memory for a team
 */
export function initSharedMemory(teamName: string): SharedMemory {
  const paths = getTeamPaths(teamName);
  const memory: SharedMemory = {
    team_name: teamName,
    data: {},
    updated_at: Date.now(),
    updated_by: 'system',
  };

  writeFileSync(paths.sharedMemory, JSON.stringify(memory, null, 2), 'utf-8');
  return memory;
}

/**
 * Read shared memory
 */
export function readSharedMemory(teamName: string): SharedMemory | null {
  const paths = getTeamPaths(teamName);

  if (!existsSync(paths.sharedMemory)) {
    return null;
  }

  try {
    const content = readFileSync(paths.sharedMemory, 'utf-8');
    return JSON.parse(content) as SharedMemory;
  } catch {
    return null;
  }
}

/**
 * Update shared memory
 */
export function updateSharedMemory(
  teamName: string,
  updates: Record<string, unknown>,
  updatedBy: string
): SharedMemory {
  const memory = readSharedMemory(teamName) || {
    team_name: teamName,
    data: {},
    updated_at: Date.now(),
    updated_by: updatedBy,
  };

  memory.data = { ...memory.data, ...updates };
  memory.updated_at = Date.now();
  memory.updated_by = updatedBy;

  const paths = getTeamPaths(teamName);
  writeFileSync(paths.sharedMemory, JSON.stringify(memory, null, 2), 'utf-8');

  return memory;
}

/**
 * Get a value from shared memory
 */
export function getSharedValue<T = unknown>(teamName: string, key: string): T | null {
  const memory = readSharedMemory(teamName);
  if (!memory) return null;
  return (memory.data[key] as T) ?? null;
}

/**
 * Set a value in shared memory
 */
export function setSharedValue<T = unknown>(
  teamName: string,
  key: string,
  value: T,
  updatedBy: string
): void {
  updateSharedMemory(teamName, { [key]: value }, updatedBy);
}

/**
 * Delete a key from shared memory
 */
export function deleteSharedKey(teamName: string, key: string, updatedBy: string): void {
  const memory = readSharedMemory(teamName);
  if (!memory) return;

  delete memory.data[key];
  memory.updated_at = Date.now();
  memory.updated_by = updatedBy;

  const paths = getTeamPaths(teamName);
  writeFileSync(paths.sharedMemory, JSON.stringify(memory, null, 2), 'utf-8');
}

/**
 * Clear all shared memory data
 */
export function clearSharedMemory(teamName: string): void {
  initSharedMemory(teamName);
}
