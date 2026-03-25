/**
 * Team State Manager - 团队状态管理
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { TeamState, TeamPipelinePhase } from './types.js';
import { getTeamPaths, getSessionPaths } from './paths.js';

const SCHEMA_VERSION = 1;
const MAX_FIX_ATTEMPTS = 3;

export function initTeamState(
  teamName: string,
  sessionId: string,
  projectPath: string,
  maxIterations: number = 10
): TeamState {
  return {
    schema_version: SCHEMA_VERSION,
    mode: 'team',
    active: true,
    session_id: sessionId,
    project_path: projectPath,
    phase: 'team-plan',
    phase_history: [
      {
        phase: 'team-plan',
        entered_at: Date.now(),
      },
    ],
    iteration: 0,
    max_iterations: maxIterations,
    artifacts: {},
    execution: {
      workers_total: 0,
      workers_active: 0,
      tasks_total: 0,
      tasks_completed: 0,
      tasks_failed: 0,
    },
    fix_loop: {
      attempt: 0,
      max_attempts: MAX_FIX_ATTEMPTS,
    },
    started_at: Date.now(),
    updated_at: Date.now(),
  };
}

export function readTeamState(teamName: string, sessionId?: string): TeamState | null {
  const { stateFile } = getSessionPaths(sessionId);
  const teamPaths = getTeamPaths(teamName);

  // Try session-scoped path first
  if (existsSync(stateFile)) {
    try {
      const content = readFileSync(stateFile, 'utf-8');
      return JSON.parse(content) as TeamState;
    } catch (e) {
      console.error(`[Team State] Failed to read state from ${stateFile}:`, e);
    }
  }

  // Try team-specific path
  if (existsSync(teamPaths.config)) {
    try {
      const content = readFileSync(teamPaths.config, 'utf-8');
      return JSON.parse(content) as TeamState;
    } catch (e) {
      console.error(`[Team State] Failed to read state from ${teamPaths.config}:`, e);
    }
  }

  return null;
}

export function writeTeamState(state: TeamState, teamName: string, sessionId?: string): void {
  const { stateFile } = getSessionPaths(sessionId);
  const teamPaths = getTeamPaths(teamName);

  state.updated_at = Date.now();

  try {
    // Write to session path
    writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[Team State] Failed to write to ${stateFile}:`, e);
  }

  try {
    // Also write to team path as backup
    writeFileSync(teamPaths.config, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[Team State] Failed to write to ${teamPaths.config}:`, e);
  }
}

export function markTeamPhase(state: TeamState, newPhase: TeamPipelinePhase): TeamState {
  const now = Date.now();

  // Mark previous phase as exited
  if (state.phase_history.length > 0) {
    const lastPhase = state.phase_history[state.phase_history.length - 1];
    if (!lastPhase.exited_at) {
      lastPhase.exited_at = now;
    }
  }

  // Add new phase
  state.phase_history.push({
    phase: newPhase,
    entered_at: now,
  });

  state.phase = newPhase;

  return state;
}

export function canTransitionTo(currentPhase: TeamPipelinePhase, targetPhase: TeamPipelinePhase): boolean {
  const allowed: Record<TeamPipelinePhase, TeamPipelinePhase[]> = {
    'team-plan': ['team-exec'],
    'team-exec': ['team-verify'],
    'team-verify': ['team-fix', 'complete', 'failed'],
    'team-fix': ['team-exec', 'team-verify', 'complete', 'failed'],
    'complete': [],
    'failed': ['team-plan', 'team-exec', 'cancelled'],
    'cancelled': ['team-plan', 'team-exec'],
  };

  return allowed[currentPhase]?.includes(targetPhase) ?? false;
}

export function canEnterExec(state: TeamState): { allowed: boolean; reason?: string } {
  if (!state.artifacts.plan_path && !state.artifacts.prd_path) {
    return { allowed: false, reason: 'plan_path or prd_path artifact required' };
  }
  return { allowed: true };
}

export function canEnterVerify(state: TeamState): { allowed: boolean; reason?: string } {
  if (state.execution.tasks_total === 0) {
    return { allowed: false, reason: 'tasks_total must be > 0' };
  }
  if (state.execution.tasks_completed < state.execution.tasks_total) {
    return { allowed: false, reason: 'tasks_completed < tasks_total' };
  }
  return { allowed: true };
}

export function isFixLoopExhausted(state: TeamState): boolean {
  return state.fix_loop.attempt >= state.fix_loop.max_attempts;
}

export function incrementFixAttempt(state: TeamState, reason: string): TeamState {
  state.fix_loop.attempt += 1;
  state.fix_loop.last_failure_reason = reason;
  return state;
}
