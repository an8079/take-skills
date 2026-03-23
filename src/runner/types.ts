/**
 * Runner Types
 *
 * Type definitions for the task runner.
 */

/**
 * Task status
 */
export type TaskStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "timeout"
  | "cancelled";

/**
 * Agent types for concurrency management
 */
export type AgentType =
  | "interviewer"
  | "architect"
  | "explorer"
  | "planner"
  | "executor"
  | "reviewer"
  | "code-reviewer"
  | "qa-tester"
  | "security-engineer"
  | "devops-automator"
  | "technical-writer"
  | "debugger";

/**
 * Task priority levels for priority queue
 */
export type PriorityLevel = "critical" | "high" | "normal" | "low";

/**
 * Agent concurrency configuration
 */
export interface AgentConcurrencyConfig {
  maxConcurrent: Record<AgentType, number>;
  priorityQueue: boolean;
}

/**
 * Priority queue entry
 */
export interface PriorityQueueEntry {
  taskId: string;
  priority: PriorityLevel;
  agentType: AgentType;
  enqueuedAt: number;
}

/**
 * Task execution record
 */
export interface TaskRecord {
  id: string;
  name: string;
  type: string;
  status: TaskStatus;
  prompt: string;
  context?: Record<string, unknown>;
  priority: "P0" | "P1" | "P2";
  result?: unknown;
  error?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  retries: number;
  maxRetries: number;
  timeout: number;
  dependencies: string[];
  artifacts: Record<string, string>;
}

/**
 * Runner events
 */
export type RunnerEvent =
  | { type: "task:queued"; taskId: string }
  | { type: "task:start"; taskId: string }
  | { type: "task:complete"; taskId: string; result: unknown }
  | { type: "task:fail"; taskId: string; error: string }
  | { type: "task:timeout"; taskId: string }
  | { type: "runner:complete" }
  | { type: "runner:error"; error: string };

/**
 * Runner event handler
 */
export type RunnerEventHandler = (event: RunnerEvent) => void;

/**
 * Task executor function
 */
export type TaskExecutor = (
  task: TaskRecord,
  context: Record<string, unknown>
) => Promise<unknown>;

/**
 * Runner configuration
 */
export interface RunnerConfig {
  maxConcurrent: number;
  defaultTimeout: number;
  maxRetries: number;
  pollingInterval: number;
  onEvent?: RunnerEventHandler;
  agentConcurrency?: AgentConcurrencyConfig;
}

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  maxConcurrent: 3,
  defaultTimeout: 300000,
  maxRetries: 2,
  pollingInterval: 100,
  agentConcurrency: {
    maxConcurrent: {
      interviewer: 2,
      architect: 1,
      explorer: 3,
      planner: 1,
      executor: 3,
      reviewer: 2,
      "code-reviewer": 2,
      "qa-tester": 2,
      "security-engineer": 1,
      "devops-automator": 1,
      "technical-writer": 2,
      debugger: 2,
    },
    priorityQueue: true,
  },
};
