/**
 * Pipeline Types
 *
 * Type definitions for the E2E execution pipeline.
 */

/**
 * Pipeline stage identifiers
 */
export type PipelineStage =
  | "interview"
  | "spec"
  | "plan"
  | "code"
  | "test"
  | "review"
  | "deploy"
  | "canary";

/**
 * Stage execution status
 */
export type StageStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

/**
 * Stage input/output context
 */
export interface StageContext {
  stage: PipelineStage;
  status: StageStatus;
  input: unknown;
  output?: unknown;
  error?: string;
  startTime?: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Pipeline stage definition
 */
export interface StageDefinition {
  id: PipelineStage;
  name: string;
  description: string;
  agent: string;
  command?: string;
  dependsOn: PipelineStage[];
  optional?: boolean;
  timeout?: number; // ms
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  pipelineId: string;
  status: "completed" | "failed" | "cancelled";
  stages: StageContext[];
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  artifacts?: Record<string, string>;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  stages: StageDefinition[];
  onStageComplete?: (context: StageContext) => void;
  onStageFail?: (context: StageContext, error: Error) => void;
  onPipelineComplete?: (result: PipelineResult) => void;
  continueOnError?: boolean;
  timeout?: number;
}

/**
 * Task definition for the runner
 */
export interface TaskDefinition {
  id: string;
  type: PipelineStage;
  prompt: string;
  context?: Record<string, unknown>;
  priority?: "P0" | "P1" | "P2";
  timeout?: number;
  retries?: number;
  dependencies?: string[];
}

/**
 * Task execution result
 */
export interface TaskResult {
  taskId: string;
  status: "completed" | "failed" | "timeout" | "cancelled";
  output?: unknown;
  error?: string;
  duration?: number;
  startTime: number;
  endTime?: number;
  artifacts?: Record<string, string>;
}

/**
 * Task runner configuration
 */
export interface RunnerConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  maxRetries: number;
  pollingInterval?: number;
}

/**
 * Canary deployment config
 */
export interface CanaryConfig {
  trafficSplit: number; // 0-100
  duration: number; // ms
  metrics: CanaryMetric[];
  passThreshold: number; // 0-100
}

export interface CanaryMetric {
  name: string;
  query: string;
  passValue: number;
}

/**
 * QA verification config
 */
export interface QAConfig {
  testCommands: string[];
  verifyCommands: string[];
  browserCommands?: BrowserCommand[];
  requireAllPass?: boolean;
}

export interface BrowserCommand {
  command: string;
  args?: string;
  expected?: string;
}
