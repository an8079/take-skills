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
}

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  maxConcurrent: 3,
  defaultTimeout: 300000,
  maxRetries: 2,
  pollingInterval: 100,
};
