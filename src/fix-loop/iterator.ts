/**
 * Fix Loop Iterator
 *
 * Controls the iteration lifecycle for bug fix cycles,
 * tracking progress and enforcing max iteration limits.
 */

import type { TaskRecord } from "./bug-to-task.js";
import { bugToTask, bugsToTasks } from "./bug-to-task.js";

/**
 * Bug severity levels
 */
export type BugSeverity = "critical" | "high" | "medium" | "low";

/**
 * Bug report interface
 */
export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  component?: string;
  stackTrace?: string;
  stepsToReproduce?: string[];
  expectedBehavior: string;
  actualBehavior: string;
  timestamp: number;
  reporter?: string;
  tags?: string[];
}

/**
 * Fix loop record for audit trail
 */
export interface FixLoopRecord {
  iteration: number;
  action:
    | "bug_generated"
    | "task_created"
    | "task_completed"
    | "qa_failed"
    | "qa_passed"
    | "loop_started"
    | "loop_completed"
    | "max_iterations_reached"
    | "manual_intervention_triggered";
  timestamp: number;
  details: Record<string, unknown>;
}

/**
 * Fix loop status
 */
export type FixLoopStatus =
  | "idle"
  | "running"
  | "completed"
  | "max_iterations"
  | "manual_intervention";

/**
 * Phase in the fix cycle
 */
export type FixPhase = "plan" | "execute" | "review" | "qa";

/**
 * Configuration for the iterator
 */
export interface IteratorConfig {
  maxIterations: number;
  autoProgress: boolean;
  requireManualApprovalOnMax?: boolean;
}

/**
 * Default iterator configuration
 */
export const DEFAULT_ITERATOR_CONFIG: IteratorConfig = {
  maxIterations: 5,
  autoProgress: true,
  requireManualApprovalOnMax: true,
};

/**
 * Phase result after execution
 */
export interface PhaseResult {
  phase: FixPhase;
  success: boolean;
  duration: number;
  output: unknown;
  errors?: string[];
}

/**
 * Iterator state snapshot
 */
export interface IteratorSnapshot {
  iteration: number;
  phase: FixPhase;
  status: FixLoopStatus;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  currentTasks: TaskRecord[];
  auditLog: FixLoopRecord[];
}

/**
 * Iterator callbacks
 */
export interface IteratorCallbacks {
  onPhaseStart?: (iteration: number, phase: FixPhase) => void;
  onPhaseComplete?: (iteration: number, phase: FixPhase, result: PhaseResult) => void;
  onIterationStart?: (iteration: number) => void;
  onIterationComplete?: (iteration: number, snapshot: IteratorSnapshot) => void;
  onManualIntervention?: (iteration: number, reason: string) => void;
  onMaxIterations?: (iteration: number) => void;
}

/**
 * Iterator class that controls the fix loop iteration
 */
export class FixLoopIterator {
  private iteration: number = 0;
  private phase: FixPhase = "plan";
  private status: FixLoopStatus = "idle";
  private config: IteratorConfig;
  private callbacks: IteratorCallbacks;
  private auditLog: FixLoopRecord[] = [];
  private bugs: BugReport[] = [];
  private tasks: TaskRecord[] = [];
  private phaseResults: Map<string, PhaseResult> = new Map();

  constructor(config: Partial<IteratorConfig> = {}, callbacks: IteratorCallbacks = {}) {
    this.config = { ...DEFAULT_ITERATOR_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * Initialize the iterator with initial bugs
   */
  initialize(bugs: BugReport[]): void {
    this.bugs = bugs;
    this.tasks = bugsToTasks(bugs);
    this.iteration = 0;
    this.phase = "plan";
    this.status = "idle";
    this.auditLog = [];
    this.phaseResults.clear();

    this.log("loop_started", {
      bugCount: bugs.length,
      maxIterations: this.config.maxIterations,
    });
  }

  /**
   * Get current snapshot of iterator state
   */
  getSnapshot(): IteratorSnapshot {
    return {
      iteration: this.iteration,
      phase: this.phase,
      status: this.status,
      tasksTotal: this.tasks.length,
      tasksCompleted: this.tasks.filter((t) => t.status === "completed").length,
      tasksFailed: this.tasks.filter((t) => t.status === "blocked" || t.status === "pending").length,
      currentTasks: [...this.tasks],
      auditLog: [...this.auditLog],
    };
  }

  /**
   * Get current iteration number
   */
  getIteration(): number {
    return this.iteration;
  }

  /**
   * Get current phase
   */
  getPhase(): FixPhase {
    return this.phase;
  }

  /**
   * Get current status
   */
  getStatus(): FixLoopStatus {
    return this.status;
  }

  /**
   * Get all tasks
   */
  getTasks(): TaskRecord[] {
    return [...this.tasks];
  }

  /**
   * Get audit log
   */
  getAuditLog(): FixLoopRecord[] {
    return [...this.auditLog];
  }

  /**
   * Check if max iterations reached
   */
  isMaxIterationsReached(): boolean {
    return this.iteration >= this.config.maxIterations;
  }

  /**
   * Check if all tasks are completed
   */
  isAllTasksCompleted(): boolean {
    return this.tasks.every((t) => t.status === "completed");
  }

  /**
   * Log an action to the audit trail
   */
  private log(action: FixLoopRecord["action"], details: Record<string, unknown> = {}): void {
    this.auditLog.push({
      iteration: this.iteration,
      action,
      timestamp: Date.now(),
      details,
    });
  }

  /**
   * Start next iteration
   */
  async startNextIteration(): Promise<IteratorSnapshot> {
    if (this.status === "completed" || this.status === "max_iterations" || this.status === "manual_intervention") {
      return this.getSnapshot();
    }

    this.iteration++;
    this.phase = "plan";
    this.status = "running";

    this.callbacks.onIterationStart?.(this.iteration);
    this.log("bug_generated", {
      bugCount: this.bugs.length,
      pendingTasks: this.tasks.filter((t) => t.status === "pending").length,
    });

    return this.getSnapshot();
  }

  /**
   * Execute a phase and record result
   */
  async executePhase(phase: FixPhase, executor: () => Promise<PhaseResult>): Promise<PhaseResult> {
    if (this.status !== "running") {
      throw new Error("Iterator is not in running state");
    }

    this.phase = phase;
    this.callbacks.onPhaseStart?.(this.iteration, phase);

    const startTime = Date.now();
    const result = await executor();
    result.duration = Date.now() - startTime;

    this.phaseResults.set(`${this.iteration}_${phase}`, result);
    this.callbacks.onPhaseComplete?.(this.iteration, phase, result);

    if (result.success) {
      this.log(`qa_passed` as FixLoopRecord["action"], {
        phase,
        duration: result.duration,
      });
    } else {
      this.log(`qa_failed` as FixLoopRecord["action"], {
        phase,
        duration: result.duration,
        errors: result.errors,
      });
    }

    return result;
  }

  /**
   * Complete current iteration and check for next
   */
  completeIteration(qaPassed: boolean): IteratorSnapshot {
    if (qaPassed || this.isAllTasksCompleted()) {
      this.status = "completed";
      this.log("loop_completed", {
        totalIterations: this.iteration,
        tasksCompleted: this.tasks.filter((t) => t.status === "completed").length,
      });
    } else if (this.isMaxIterationsReached()) {
      if (this.config.requireManualApprovalOnMax) {
        this.status = "manual_intervention";
        this.callbacks.onManualIntervention?.(this.iteration, "Max iterations reached");
        this.log("manual_intervention_triggered", {
          reason: "max_iterations_reached",
          iteration: this.iteration,
        });
      } else {
        this.status = "max_iterations";
        this.callbacks.onMaxIterations?.(this.iteration);
        this.log("max_iterations_reached", {
          iteration: this.iteration,
        });
      }
    }

    this.callbacks.onIterationComplete?.(this.iteration, this.getSnapshot());
    return this.getSnapshot();
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: TaskRecord["status"]): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      task.updatedAt = Date.now();
      if (status === "completed") {
        this.log("task_completed", { taskId, status });
      }
    }
  }

  /**
   * Trigger manual intervention
   */
  triggerManualIntervention(reason: string): IteratorSnapshot {
    this.status = "manual_intervention";
    this.log("manual_intervention_triggered", { reason });
    this.callbacks.onManualIntervention?.(this.iteration, reason);
    return this.getSnapshot();
  }

  /**
   * Get phase result for specific iteration and phase
   */
  getPhaseResult(iteration: number, phase: FixPhase): PhaseResult | undefined {
    return this.phaseResults.get(`${iteration}_${phase}`);
  }

  /**
   * Reset the iterator
   */
  reset(): void {
    this.iteration = 0;
    this.phase = "plan";
    this.status = "idle";
    this.tasks = [];
    this.bugs = [];
    this.auditLog = [];
    this.phaseResults.clear();
  }
}
