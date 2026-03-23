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
  AgentConcurrencyConfig,
  PriorityLevel,
  PriorityQueueEntry,
  AgentType,
} from "./types.js";

/**
 * Priority queue weights for sorting
 */
const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Priority Queue for agent tasks with priority levels
 */
export class PriorityQueue {
  private buckets: Map<PriorityLevel, PriorityQueueEntry[]>;
  private agentTypeBuckets: Map<AgentType, PriorityQueueEntry[]>;
  private allEntries: Map<string, PriorityQueueEntry>;

  constructor() {
    this.buckets = new Map([
      ["critical", []],
      ["high", []],
      ["normal", []],
      ["low", []],
    ]);
    this.agentTypeBuckets = new Map();
    this.allEntries = new Map();
  }

  /**
   * Enqueue a task
   */
  enqueue(taskId: string, priority: PriorityLevel, agentType: AgentType): void {
    const entry: PriorityQueueEntry = {
      taskId,
      priority,
      agentType,
      enqueuedAt: Date.now(),
    };

    // Add to priority bucket
    const priorityBucket = this.buckets.get(priority) || [];
    priorityBucket.push(entry);
    this.buckets.set(priority, priorityBucket);

    // Add to agent type bucket
    if (!this.agentTypeBuckets.has(agentType)) {
      this.agentTypeBuckets.set(agentType, []);
    }
    this.agentTypeBuckets.get(agentType)!.push(entry);

    // Track in main map
    this.allEntries.set(taskId, entry);
  }

  /**
   * Dequeue the highest priority task for a specific agent type
   */
  dequeue(agentType: AgentType): PriorityQueueEntry | undefined {
    const entries = this.agentTypeBuckets.get(agentType);
    if (!entries || entries.length === 0) return undefined;

    // Find highest priority entry for this agent type
    let bestIndex = -1;
    let bestWeight = Infinity;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const weight = PRIORITY_WEIGHTS[entry.priority];
      if (weight < bestWeight) {
        bestWeight = weight;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) return undefined;

    const [removed] = entries.splice(bestIndex, 1);
    this.allEntries.delete(removed.taskId);

    // Remove from priority bucket
    const priorityBucket = this.buckets.get(removed.priority) || [];
    const idx = priorityBucket.findIndex((e) => e.taskId === removed.taskId);
    if (idx !== -1) priorityBucket.splice(idx, 1);

    return removed;
  }

  /**
   * Get next task using fair round-robin across agent types
   */
  dequeueFair(agentTypes: AgentType[], agentConcurrency: Record<AgentType, number>, runningByType: Map<AgentType, number>): PriorityQueueEntry | undefined {
    // Build list of agent types that have available slots
    const availableTypes: AgentType[] = [];
    for (const type of agentTypes) {
      const max = agentConcurrency[type] ?? Infinity;
      const current = runningByType.get(type) || 0;
      if (current < max) {
        availableTypes.push(type);
      }
    }

    if (availableTypes.length === 0) return undefined;

    // Round-robin: pick the agent type with the oldest entry
    let oldestEntry: PriorityQueueEntry | undefined;
    let oldestTime = Infinity;
    let oldestType: AgentType | undefined;

    for (const type of availableTypes) {
      const entries = this.agentTypeBuckets.get(type);
      if (!entries || entries.length === 0) continue;

      // Find highest priority entry for this type
      let bestIndex = -1;
      let bestWeight = Infinity;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const weight = PRIORITY_WEIGHTS[entry.priority];
        if (weight < bestWeight) {
          bestWeight = weight;
          bestIndex = i;
        }
      }

      if (bestIndex !== -1) {
        const entry = entries[bestIndex];
        if (entry.enqueuedAt < oldestTime) {
          oldestTime = entry.enqueuedAt;
          oldestEntry = entry;
          oldestType = type;
        }
      }
    }

    if (oldestEntry && oldestType) {
      // Remove from agent type bucket
      const entries = this.agentTypeBuckets.get(oldestType)!;
      const idx = entries.findIndex((e) => e.taskId === oldestEntry!.taskId);
      if (idx !== -1) entries.splice(idx, 1);

      // Remove from priority bucket
      const priorityBucket = this.buckets.get(oldestEntry.priority) || [];
      const pIdx = priorityBucket.findIndex((e) => e.taskId === oldestEntry!.taskId);
      if (pIdx !== -1) priorityBucket.splice(pIdx, 1);

      this.allEntries.delete(oldestEntry.taskId);
    }

    return oldestEntry;
  }

  /**
   * Remove a specific task
   */
  remove(taskId: string): boolean {
    const entry = this.allEntries.get(taskId);
    if (!entry) return false;

    // Remove from agent type bucket
    const typeEntries = this.agentTypeBuckets.get(entry.agentType);
    if (typeEntries) {
      const idx = typeEntries.findIndex((e) => e.taskId === taskId);
      if (idx !== -1) typeEntries.splice(idx, 1);
    }

    // Remove from priority bucket
    const priorityBucket = this.buckets.get(entry.priority) || [];
    const idx = priorityBucket.findIndex((e) => e.taskId === taskId);
    if (idx !== -1) priorityBucket.splice(idx, 1);

    this.allEntries.delete(taskId);
    return true;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.allEntries.size;
  }

  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this.allEntries.size === 0;
  }

  /**
   * Get all queued task IDs
   */
  getAllTaskIds(): string[] {
    return Array.from(this.allEntries.keys());
  }
}

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
  private priorityQueue: PriorityQueue | null;
  private running: Set<string>;
  private runningByType: Map<AgentType, number>;
  private eventHandlers: Set<RunnerEventHandler>;

  constructor(config: Partial<RunnerConfig> = {}) {
    this.config = { ...DEFAULT_RUNNER_CONFIG, ...config };
    this.tasks = new Map();
    this.queue = [];
    this.running = new Set();
    this.runningByType = new Map();
    this.eventHandlers = new Set();
    this.priorityQueue = this.config.agentConcurrency?.priorityQueue
      ? new PriorityQueue()
      : null;
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
    agentType?: AgentType;
    taskPriority?: PriorityLevel;
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

    // Add to priority queue if enabled
    if (this.priorityQueue && config.agentType) {
      this.priorityQueue.enqueue(
        id,
        config.taskPriority || "normal",
        config.agentType
      );
    }

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
   * Get next executable tasks (respecting per-agent-type concurrency limits)
   */
  private getNextExecutable(): string[] {
    if (this.running.size >= this.config.maxConcurrent) {
      return [];
    }

    const agentConcurrency = this.config.agentConcurrency;
    const maxByType = agentConcurrency?.maxConcurrent;

    // If priority queue is enabled, use fair scheduling
    if (this.priorityQueue && maxByType) {
      const available: string[] = [];
      const agentTypes = Object.keys(maxByType) as AgentType[];

      while (available.length < (this.config.maxConcurrent - this.running.size)) {
        const entry = this.priorityQueue.dequeueFair(
          agentTypes,
          maxByType,
          this.runningByType
        );

        if (!entry) break;

        const task = this.tasks.get(entry.taskId);
        if (!task || task.status !== "pending") continue;
        if (!this.areDependenciesMet(task)) {
          // Re-enqueue if dependencies not met
          this.priorityQueue.enqueue(entry.taskId, entry.priority, entry.agentType);
          continue;
        }

        available.push(entry.taskId);
      }

      return available;
    }

    // Legacy behavior: simple global concurrency limit
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
    const agentType = task.context?.agentType as AgentType | undefined;

    task.status = "running";
    task.startTime = Date.now();
    this.running.add(taskId);

    // Track running count per agent type
    if (agentType && this.runningByType) {
      this.runningByType.set(agentType, (this.runningByType.get(agentType) || 0) + 1);
    }

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

      // Decrement running count per agent type
      if (agentType && this.runningByType) {
        const current = this.runningByType.get(agentType) || 0;
        this.runningByType.set(agentType, Math.max(0, current - 1));
      }

      this.emit({ type: "task:complete", taskId, result });

      logger.info(
        `[Runner] Task completed: ${taskId} in ${task.duration}ms`
      );
    } catch (error) {
      task.endTime = Date.now();
      task.duration = task.endTime - (task.startTime || 0);

      // Decrement running count per agent type on error
      if (agentType && this.runningByType) {
        const current = this.runningByType.get(agentType) || 0;
        this.runningByType.set(agentType, Math.max(0, current - 1));
      }

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

          // Re-add to priority queue if using one
          if (this.priorityQueue && task.context?.agentType) {
            const taskPriority = task.context.taskPriority as PriorityLevel || "normal";
            this.priorityQueue.enqueue(taskId, taskPriority, task.context.agentType as AgentType);
          }

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
