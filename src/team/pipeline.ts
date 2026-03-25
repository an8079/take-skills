/**
 * Team Pipeline - 团队协作管道
 *
 * 5 阶段管道: team-plan → team-exec → team-verify → team-fix → complete
 */

import type { TeamState, TeamPipelinePhase } from './types.js';
import {
  readTeamState,
  writeTeamState,
  markTeamPhase,
  canTransitionTo,
  canEnterExec,
  canEnterVerify,
  isFixLoopExhausted,
  incrementFixAttempt,
} from './state.js';
import { getTaskStats, listTasks } from './task-manager.js';

export interface PipelineContext {
  teamName: string;
  sessionId: string;
  projectPath: string;
}

export interface PhaseResult {
  success: boolean;
  nextPhase?: TeamPipelinePhase;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Execute team-plan phase
 */
async function executePlan(ctx: PipelineContext, state: TeamState): Promise<PhaseResult> {
  console.log(`[Pipeline] Executing team-plan phase for ${ctx.teamName}`);

  // In plan phase, the analyst creates a plan
  // This would typically spawn an analyst agent to analyze and create plan

  return {
    success: true,
    nextPhase: 'team-exec',
    data: {
      plan_created: true,
      tasks_determined: state.execution.tasks_total > 0,
    },
  };
}

/**
 * Execute team-exec phase
 */
async function executeExec(ctx: PipelineContext, state: TeamState): Promise<PhaseResult> {
  console.log(`[Pipeline] Executing team-exec phase for ${ctx.teamName}`);

  const stats = getTaskStats(ctx.teamName);

  // Update execution stats
  state.execution.tasks_total = stats.total;
  state.execution.tasks_completed = stats.completed;
  state.execution.tasks_failed = stats.failed;

  return {
    success: true,
    nextPhase: 'team-verify',
    data: {
      tasks_completed: stats.completed,
      tasks_total: stats.total,
    },
  };
}

/**
 * Execute team-verify phase
 */
async function executeVerify(ctx: PipelineContext, state: TeamState): Promise<PhaseResult> {
  console.log(`[Pipeline] Executing team-verify phase for ${ctx.teamName}`);

  const canVerify = canEnterVerify(state);
  if (!canVerify.allowed) {
    return {
      success: false,
      nextPhase: 'team-fix',
      error: canVerify.reason,
    };
  }

  const stats = getTaskStats(ctx.teamName);
  const allPassed = stats.completed === stats.total && stats.failed === 0;

  if (allPassed) {
    return {
      success: true,
      nextPhase: 'complete',
      data: { all_tasks_passed: true },
    };
  } else {
    return {
      success: false,
      nextPhase: 'team-fix',
      error: `${stats.failed} tasks failed`,
    };
  }
}

/**
 * Execute team-fix phase
 */
async function executeFix(ctx: PipelineContext, state: TeamState): Promise<PhaseResult> {
  console.log(`[Pipeline] Executing team-fix phase for ${ctx.teamName}`);

  if (isFixLoopExhausted(state)) {
    return {
      success: false,
      nextPhase: 'failed',
      error: 'Max fix attempts exhausted',
    };
  }

  // Increment fix attempt
  incrementFixAttempt(state, state.fix_loop.last_failure_reason || 'Unknown failure');

  // After fix, go back to exec to retry
  return {
    success: true,
    nextPhase: 'team-exec',
    data: {
      fix_attempt: state.fix_loop.attempt,
      max_attempts: state.fix_loop.max_attempts,
    },
  };
}

/**
 * Execute a specific phase
 */
export async function executePhase(
  ctx: PipelineContext,
  phase: TeamPipelinePhase
): Promise<PhaseResult> {
  const state = readTeamState(ctx.teamName, ctx.sessionId);
  if (!state) {
    return { success: false, error: 'Team state not found' };
  }

  switch (phase) {
    case 'team-plan':
      return executePlan(ctx, state);
    case 'team-exec':
      return executeExec(ctx, state);
    case 'team-verify':
      return executeVerify(ctx, state);
    case 'team-fix':
      return executeFix(ctx, state);
    case 'complete':
    case 'failed':
      return { success: phase === 'complete', nextPhase: phase };
    default:
      return { success: false, error: `Unknown phase: ${phase}` };
  }
}

/**
 * Transition to a new phase
 */
export function transitionPhase(
  ctx: PipelineContext,
  targetPhase: TeamPipelinePhase
): { success: boolean; error?: string } {
  const state = readTeamState(ctx.teamName, ctx.sessionId);
  if (!state) {
    return { success: false, error: 'Team state not found' };
  }

  if (!canTransitionTo(state.phase, targetPhase)) {
    return {
      success: false,
      error: `Cannot transition from ${state.phase} to ${targetPhase}`,
    };
  }

  // Check prerequisites for exec phase
  if (targetPhase === 'team-exec') {
    const canExec = canEnterExec(state);
    if (!canExec.allowed) {
      return { success: false, error: canExec.reason };
    }
  }

  // Check prerequisites for verify phase
  if (targetPhase === 'team-verify') {
    const canVerify = canEnterVerify(state);
    if (!canVerify.allowed) {
      return { success: false, error: canVerify.reason };
    }
  }

  // Mark phase transition
  markTeamPhase(state, targetPhase);
  writeTeamState(state, ctx.teamName, ctx.sessionId);

  return { success: true };
}

/**
 * Run the complete team pipeline
 */
export async function runTeamPipeline(
  ctx: PipelineContext,
  options: {
    maxIterations?: number;
    onPhaseChange?: (phase: TeamPipelinePhase) => void;
    onTaskComplete?: (taskId: string) => void;
  } = {}
): Promise<{ success: boolean; finalPhase: TeamPipelinePhase; iterations: number }> {
  const maxIterations = options.maxIterations || 10;
  let iterations = 0;

  // Initialize state if not exists
  let state = readTeamState(ctx.teamName, ctx.sessionId);
  if (!state) {
    state = {
      schema_version: 1,
      mode: 'team',
      active: true,
      session_id: ctx.sessionId,
      project_path: ctx.projectPath,
      phase: 'team-plan',
      phase_history: [{ phase: 'team-plan', entered_at: Date.now() }],
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
        max_attempts: 3,
      },
      started_at: Date.now(),
      updated_at: Date.now(),
    };
    writeTeamState(state, ctx.teamName, ctx.sessionId);
  }

  // Pipeline loop
  while (state.active && iterations < maxIterations) {
    const result = await executePhase(ctx, state.phase);

    if (!result.success && result.nextPhase === 'team-fix') {
      // Fix loop - try again
      iterations++;
      state.iteration = iterations;
      transitionPhase(ctx, 'team-fix');
      state = readTeamState(ctx.teamName, ctx.sessionId)!;
      continue;
    }

    if (result.nextPhase === 'complete' || result.nextPhase === 'failed') {
      return {
        success: result.nextPhase === 'complete',
        finalPhase: result.nextPhase,
        iterations,
      };
    }

    if (result.nextPhase) {
      options.onPhaseChange?.(result.nextPhase);
      transitionPhase(ctx, result.nextPhase);
      state = readTeamState(ctx.teamName, ctx.sessionId)!;
    }

    iterations++;
    state.iteration = iterations;
    writeTeamState(state, ctx.teamName, ctx.sessionId);
  }

  return {
    success: false,
    finalPhase: state?.phase || 'failed',
    iterations,
  };
}
