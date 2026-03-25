/**
 * Progress Tracker - 进度追踪
 */

import type { TeamState } from './types.js';
import { getTaskStats } from './task-manager.js';
import { getTeamHealth } from './heartbeat.js';
import { readTeamState } from './state.js';

export interface ProgressReport {
  teamName: string;
  phase: string;
  iteration: number;
  progress: {
    tasksTotal: number;
    tasksCompleted: number;
    tasksFailed: number;
    completionRate: number;
  };
  team: {
    totalWorkers: number;
    activeWorkers: number;
    idleWorkers: number;
    staleWorkers: string[];
  };
  artifacts: {
    hasPlan: boolean;
    hasPrd: boolean;
    hasVerifyReport: boolean;
  };
  fixLoop: {
    attempt: number;
    maxAttempts: number;
    exhausted: boolean;
  };
  blockers: string[];
}

/**
 * Generate a progress report for the team
 */
export function generateProgressReport(teamName: string, sessionId?: string): ProgressReport | null {
  const state = readTeamState(teamName, sessionId);
  if (!state) {
    return null;
  }

  const taskStats = getTaskStats(teamName);
  const health = getTeamHealth(teamName);

  const completionRate =
    taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  return {
    teamName,
    phase: state.phase,
    iteration: state.iteration,
    progress: {
      tasksTotal: taskStats.total,
      tasksCompleted: taskStats.completed,
      tasksFailed: taskStats.failed,
      completionRate: Math.round(completionRate * 100) / 100,
    },
    team: {
      totalWorkers: health.totalWorkers,
      activeWorkers: health.activeWorkers,
      idleWorkers: health.idleWorkers,
      staleWorkers: health.staleWorkers,
    },
    artifacts: {
      hasPlan: !!state.artifacts.plan_path,
      hasPrd: !!state.artifacts.prd_path,
      hasVerifyReport: !!state.artifacts.verify_report_path,
    },
    fixLoop: {
      attempt: state.fix_loop.attempt,
      maxAttempts: state.fix_loop.max_attempts,
      exhausted: state.fix_loop.attempt >= state.fix_loop.max_attempts,
    },
    blockers: [], // Would be populated from blocked tasks
  };
}

/**
 * Format progress as a readable string
 */
export function formatProgressReport(report: ProgressReport): string {
  const lines: string[] = [
    `## Team Progress: ${report.teamName}`,
    '',
    `**Phase:** ${report.phase}`,
    `**Iteration:** ${report.iteration}/${report.fixLoop.maxAttempts}`,
    '',
    '### Task Progress',
    `- Total: ${report.progress.tasksTotal}`,
    `- Completed: ${report.progress.tasksCompleted}`,
    `- Failed: ${report.progress.tasksFailed}`,
    `- Completion: ${report.progress.completionRate}%`,
    '',
    '### Team Health',
    `- Total Workers: ${report.team.totalWorkers}`,
    `- Active: ${report.team.activeWorkers}`,
    `- Idle: ${report.team.idleWorkers}`,
    `- Stale: ${report.team.staleWorkers.length}`,
    '',
    '### Artifacts',
    `- Plan: ${report.artifacts.hasPlan ? '✓' : '✗'}`,
    `- PRD: ${report.artifacts.hasPrd ? '✓' : '✗'}`,
    `- Verify Report: ${report.artifacts.hasVerifyReport ? '✓' : '✗'}`,
    '',
    '### Fix Loop',
    `- Attempt: ${report.fixLoop.attempt}/${report.fixLoop.maxAttempts}`,
    `- Exhausted: ${report.fixLoop.exhausted ? 'Yes ⚠️' : 'No'}`,
  ];

  if (report.blockers.length > 0) {
    lines.push('', '### Blockers');
    for (const blocker of report.blockers) {
      lines.push(`- ${blocker}`);
    }
  }

  return lines.join('\n');
}
