/**
 * Task Runner
 *
 * Executes tasks with concurrency control, retries, and dependencies.
 */

import { logger } from "../utils/logger.js";
import type {
  TaskRecord,
  TaskStatus,
  RunnerConfig,
  RunnerEvent,
  RunnerEventHandler,
  TaskExecutor,
} from "./types.js";

/**
 * Default runner configuration
 */
export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  maxConcurrent: 3,
  defaultTimeout: 300000, // 5 minutes
  maxRetries: 2,
  pollingInterval: 100,
};

/**
 * Task queue with priority and dependency management
 */
export class TaskRunner {
  private config: RunnerConfig;
  private tasks: Map<string, TaskRecord>;
  private queue: string[]; // Task IDs in queue order
  private running: Set<string>;
  private eventHandlers: Set<RunnerEventHandler>;

  constructor(config: Partial<RunnerConfig> = {}) {
    this.config = { ...DEFAULT_RUNNER_CONFIG, ...config };
    this.tasks = new Map();
    this.queue = [];
    this.running = new Set();
    this.eventHandlers = new Set();
  }

  /**
   * Add an event handler
   */
  on(event: RunnerEventHandler): void {
    this.eventHandlers.add(event);
  }

  /**
   * Remove an event handler
   */
  off(event: RunnerEventHandler): void {
    this.eventHandlers.delete(event);
  }

  /**
   * Emit an event
   */
  private emit(event: RunnerEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (err) {
        logger.warn(`[Runner] Event handler error: ${String(err)}`);
      }
    }
  }

  /**
   * Generate a unique task ID
   */
  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Calculate priority weight for sorting
   */
  private priorityWeight(priority: "P0" | "P1" | "P2"): number {
    switch (priority) {
      case "P0":
        return 0;
      case "P1":
        return 1;
      case "P2":
        return 2;
    }
  }

  /**
   * Check if a task's dependencies are met
   */
  private areDependenciesMet(task: TaskRecord): boolean {
    for (const depId of task.dependencies) {
      const dep = this.tasks.get(depId);
      if (!dep || dep.status !== "completed") {
        return false;
      }
    }
    return true;
  }

  /**
   * Sort queue by priority and dependencies
   */
  private sortQueue(): void {
    this.queue.sort((aId, bId) => {
      const a = this.tasks.get(aId)!;
      const b = this.tasks.get(bId)!;
      // First by priority
      const pw = this.priorityWeight(a.priority) - this.priorityWeight(b.priority);
      if (pw !== 0) return pw;
      // Then by creation time
      return (a.startTime || 0) - (b.startTime || 0);
    });
  }

  /**
   * Add a task to the runner
   */
  addTask(config: {
    name: string;
    type: string;
    prompt: string;
    context?: Record<string, unknown>;
    priority?: "P0" | "P1" | "P2";
    timeout?: number;
    retries?: number;
    dependencies?: string[];
  }): string {
    const id = this.generateId();
    const task: TaskRecord = {
      id,
      name: config.name,
      type: config.type,
      status: "pending",
      prompt: config.prompt,
      context: config.context,
      priority: config.priority || "P1",
      timeout: config.timeout || this.config.defaultTimeout,
      retries: 0,
      maxRetries: config.retries ?? this.config.maxRetries,
      dependencies: config.dependencies || [],
      artifacts: {},
    };

    this.tasks.set(id, task);
    this.queue.push(id);
    this.emit({ type: "task:queued", taskId: id });

    logger.info(`[Runner] Task added: ${id} (${config.name})`);
    return id;
  }

  /**
   * Get a task by ID
   */
  getTask(id: string): TaskRecord | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): TaskRecord[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): TaskRecord[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  /**
   * Get next executable tasks (respecting concurrency)
   */
  private getNextExecutable(): string[] {
    if (this.running.size >= this.config.maxConcurrent) {
      return [];
    }

    const available: string[] = [];
    const slots = this.config.maxConcurrent - this.running.size;

    for (const taskId of this.queue) {
      if (available.length >= slots) break;

      const task = this.tasks.get(taskId)!;
      if (task.status !== "pending") continue;
      if (!this.areDependenciesMet(task)) continue;

      available.push(taskId);
    }

    return available;
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    taskId: string,
    executor: TaskExecutor
  ): Promise<void> {
    const task = this.tasks.get(taskId)!;

    task.status = "running";
    task.startTime = Date.now();
    this.running.add(taskId);
    this.emit({ type: "task:start", taskId });

    logger.info(`[Runner] Task started: ${taskId} (${task.name})`);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Task timeout after ${task.timeout}ms`)),
          task.timeout
        );
      });

      const result = await Promise.race([
        executor(task, task.context || {}),
        timeoutPromise,
      ]);

      task.status = "completed";
      task.result = result;
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      this.running.delete(taskId);
      this.emit({ type: "task:complete", taskId, result });

      logger.info(
        `[Runner] Task completed: ${taskId} in ${task.duration}ms`
      );
    } catch (error) {
      task.endTime = Date.now();
      task.duration = task.endTime - (task.startTime || 0);

      if (error instanceof Error && error.message.includes("timeout")) {
        task.status = "timeout";
        this.emit({ type: "task:timeout", taskId });
        logger.warn(`[Runner] Task timeout: ${taskId}`);
      } else {
        task.error = error instanceof Error ? error.message : String(error);

        if (task.retries < task.maxRetries) {
          task.retries++;
          task.status = "pending";
          this.running.delete(taskId);
          logger.info(
            `[Runner] Task retry ${task.retries}/${task.maxRetries}: ${taskId}`
          );
        } else {
          task.status = "failed";
          this.running.delete(taskId);
          this.emit({ type: "task:fail", taskId, error: task.error });
          logger.error(`[Runner] Task failed: ${taskId}: ${task.error}`);
        }
      }
    }
  }

  /**
   * Run all queued tasks
   */
  async run(
    executor: TaskExecutor,
    onProgress?: (completed: number, total: number) => void
  ): Promise<TaskRecord[]> {
    const total = this.queue.length;
    let completed = 0;

    logger.info(`[Runner] Starting ${total} tasks (max ${this.config.maxConcurrent} concurrent)`);

    // Process queue until all tasks are done
    while (true) {
      // Get next executable tasks
      const executable = this.getNextExecutable();

      // Launch executable tasks
      for (const taskId of executable) {
        // executeTask removes from queue when it transitions from running to complete/failed
        this.executeTask(taskId, executor);
      }

      // Check if we're done
      const pending = this.getTasksByStatus("pending");
      const running = this.running.size;

      if (pending.length === 0 && running === 0) {
        break;
      }

      // Report progress
      completed = Array.from(this.tasks.values()).filter(
        (t) => t.status === "completed" || t.status === "failed"
      ).length;
      onProgress?.(completed, total);

      // Wait before checking again
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.pollingInterval)
      );
    }

    // Final progress update
    onProgress?.(total, total);

    this.emit({ type: "runner:complete" });
    logger.info(`[Runner] All ${total} tasks processed`);

    return Array.from(this.tasks.values());
  }

  /**
   * Cancel all pending tasks
   */
  cancelAll(): void {
    for (const taskId of this.queue) {
      const task = this.tasks.get(taskId)!;
      if (task.status === "pending") {
        task.status = "cancelled";
      }
    }
    this.queue = [];
    logger.info("[Runner] All pending tasks cancelled");
  }

  /**
   * Get runner statistics
   */
  getStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    timeout: number;
    cancelled: number;
    avgDuration?: number;
  } {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter((t) => t.status === "completed" && t.duration);
    const durations = completedTasks.map((t) => t.duration || 0);

    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      running: this.running.size,
      completed: tasks.filter((t) => t.status === "completed").length,
      failed: tasks.filter((t) => t.status === "failed").length,
      timeout: tasks.filter((t) => t.status === "timeout").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
      avgDuration:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : undefined,
    };
  }
}
