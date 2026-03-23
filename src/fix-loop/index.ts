/**
 * FixLoop - Main Controller
 *
 * Orchestrates the complete fix loop cycle:
 * bug -> task -> plan -> execute -> review -> qa -> (loop if failed)
 */

import type { TaskRecord } from "./bug-to-task.js";
import type { BugReport } from "./bug-to-task.js";
import { FixLoopIterator, type FixLoopStatus, type FixPhase, type IteratorSnapshot, type PhaseResult, type IteratorCallbacks } from "./iterator.js";
import { bugToTask, bugsToTasks } from "./bug-to-task.js";

/**
 * Fix loop state interface
 */
export interface FixLoopState {
  iteration: number;
  maxIterations: number;
  bugs: BugReport[];
  tasks: TaskRecord[];
  status: FixLoopStatus;
  phase: FixPhase;
  auditLog: Array<{
    iteration: number;
    action: string;
    timestamp: number;
    details: Record<string, unknown>;
  }>;
}

/**
 * Fix loop record for audit log
 */
export interface FixLoopRecord {
  iteration: number;
  action: "bug_generated" | "task_created" | "task_completed" | "qa_failed" | "qa_passed";
  timestamp: number;
  details: Record<string, unknown>;
}

/**
 * Fix loop configuration
 */
export interface FixLoopConfig {
  maxIterations?: number;
  autoProgress?: boolean;
  requireManualApprovalOnMax?: boolean;
  onPhaseStart?: (iteration: number, phase: FixPhase) => void;
  onPhaseComplete?: (iteration: number, phase: FixPhase, result: PhaseResult) => void;
  onIterationStart?: (iteration: number) => void;
  onIterationComplete?: (iteration: number, snapshot: IteratorSnapshot) => void;
  onManualIntervention?: (iteration: number, reason: string) => void;
  onMaxIterations?: (iteration: number) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<FixLoopConfig> = {
  maxIterations: 5,
  autoProgress: true,
  requireManualApprovalOnMax: true,
  onPhaseStart: () => {},
  onPhaseComplete: () => {},
  onIterationStart: () => {},
  onIterationComplete: () => {},
  onManualIntervention: () => {},
  onMaxIterations: () => {},
};

/**
 * Phase executor interface
 */
export interface PhaseExecutor {
  plan: (tasks: TaskRecord[]) => Promise<PhaseResult>;
  execute: (tasks: TaskRecord[]) => Promise<PhaseResult>;
  review: (tasks: TaskRecord[]) => Promise<PhaseResult>;
  qa: (tasks: TaskRecord[]) => Promise<PhaseResult>;
}

/**
 * FixLoop main class
 */
export class FixLoop {
  private config: Required<FixLoopConfig>;
  private iterator: FixLoopIterator;
  private executor?: PhaseExecutor;

  constructor(config: FixLoopConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.iterator = new FixLoopIterator(
      {
        maxIterations: this.config.maxIterations,
        autoProgress: this.config.autoProgress,
        requireManualApprovalOnMax: this.config.requireManualApprovalOnMax,
      },
      {
        onPhaseStart: this.config.onPhaseStart,
        onPhaseComplete: this.config.onPhaseComplete,
        onIterationStart: this.config.onIterationStart,
        onIterationComplete: this.config.onIterationComplete,
        onManualIntervention: this.config.onManualIntervention,
        onMaxIterations: this.config.onMaxIterations,
      }
    );
  }

  /**
   * Set the phase executor
   */
  setExecutor(executor: PhaseExecutor): void {
    this.executor = executor;
  }

  /**
   * Start the fix loop with initial bugs
   */
  start(bugs: BugReport[]): IteratorSnapshot {
    if (!this.executor) {
      throw new Error("Phase executor not set. Call setExecutor() first.");
    }

    this.iterator.initialize(bugs);
    return this.iterator.getSnapshot();
  }

  /**
   * Run one complete iteration (plan -> execute -> review -> qa)
   */
  async runIteration(): Promise<IteratorSnapshot> {
    const snapshot = await this.iterator.startNextIteration();

    if (snapshot.status === "completed" || snapshot.status === "manual_intervention" || snapshot.status === "max_iterations") {
      return snapshot;
    }

    const tasks = this.iterator.getTasks();

    // Plan phase
    const planResult = await this.iterator.executePhase("plan", () =>
      this.executor!.plan(tasks)
    );

    // Execute phase
    const execResult = await this.iterator.executePhase("execute", () =>
      this.executor!.execute(tasks)
    );

    // Review phase
    const reviewResult = await this.iterator.executePhase("review", () =>
      this.executor!.review(tasks)
    );

    // QA phase
    const qaResult = await this.iterator.executePhase("qa", () =>
      this.executor!.qa(tasks)
    );

    // Determine if loop continues
    const qaPassed = qaResult.success;
    return this.iterator.completeIteration(qaPassed);
  }

  /**
   * Run the complete fix loop until completion or max iterations
   */
  async run(): Promise<IteratorSnapshot> {
    let snapshot = this.iterator.getSnapshot();

    while (
      snapshot.status === "idle" ||
      snapshot.status === "running"
    ) {
      snapshot = await this.runIteration();

      if (
        snapshot.status === "completed" ||
        snapshot.status === "max_iterations" ||
        snapshot.status === "manual_intervention"
      ) {
        break;
      }
    }

    return snapshot;
  }

  /**
   * Get current state
   */
  getState(): FixLoopState {
    const snapshot = this.iterator.getSnapshot();
    return {
      iteration: snapshot.iteration,
      maxIterations: this.config.maxIterations,
      bugs: [],
      tasks: snapshot.currentTasks,
      status: snapshot.status,
      phase: snapshot.phase,
      auditLog: snapshot.auditLog.map((r) => ({
        iteration: r.iteration,
        action: r.action,
        timestamp: r.timestamp,
        details: r.details,
      })),
    };
  }

  /**
   * Get current snapshot
   */
  getSnapshot(): IteratorSnapshot {
    return this.iterator.getSnapshot();
  }

  /**
   * Get audit log
   */
  getAuditLog(): FixLoopRecord[] {
    return this.iterator.getAuditLog() as FixLoopRecord[];
  }

  /**
   * Get all tasks
   */
  getTasks(): TaskRecord[] {
    return this.iterator.getTasks();
  }

  /**
   * Trigger manual intervention
   */
  triggerManualIntervention(reason: string): IteratorSnapshot {
    return this.iterator.triggerManualIntervention(reason);
  }

  /**
   * Check if loop is running
   */
  isRunning(): boolean {
    return this.iterator.getStatus() === "running";
  }

  /**
   * Check if loop is complete
   */
  isComplete(): boolean {
    const status = this.iterator.getStatus();
    return status === "completed" || status === "max_iterations" || status === "manual_intervention";
  }

  /**
   * Get iteration results summary
   */
  getIterationSummary(): Array<{
    iteration: number;
    phase: FixPhase;
    status: string;
    duration?: number;
  }> {
    const phases: FixPhase[] = ["plan", "execute", "review", "qa"];
    const summary: Array<{
      iteration: number;
      phase: FixPhase;
      status: string;
      duration?: number;
    }> = [];

    for (let i = 1; i <= this.iterator.getIteration(); i++) {
      for (const phase of phases) {
        const result = this.iterator.getPhaseResult(i, phase);
        if (result) {
          summary.push({
            iteration: i,
            phase,
            status: result.success ? "passed" : "failed",
            duration: result.duration,
          });
        }
      }
    }

    return summary;
  }
}

/**
 * Create a new FixLoop instance with default config
 */
export function createFixLoop(config?: FixLoopConfig): FixLoop {
  return new FixLoop(config);
}

// Re-export types
export type { BugReport } from "./iterator.js";
export type { TaskRecord, TaskPriority, TaskCategory, TaskStatus } from "./bug-to-task.js";
export { bugToTask, bugsToTasks } from "./bug-to-task.js";
