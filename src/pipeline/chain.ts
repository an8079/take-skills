/**
 * Pipeline Chain
 *
 * Orchestrates the E2E execution chain: interview → spec → plan → code → test → review → deploy → canary
 */

import { logger } from "../utils/logger.js";
import type {
  PipelineStage,
  StageContext,
  PipelineResult,
  PipelineConfig,
  StageDefinition,
} from "./types.js";

/**
 * Default pipeline stages
 */
export const DEFAULT_STAGES: StageDefinition[] = [
  {
    id: "interview",
    name: "Requirements Interview",
    description: "Deep interview to understand requirements",
    agent: "interviewer",
    command: "interview",
    dependsOn: [],
  },
  {
    id: "spec",
    name: "Specification",
    description: "Create technical specification",
    agent: "architect",
    command: "spec",
    dependsOn: ["interview"],
  },
  {
    id: "plan",
    name: "Task Planning",
    description: "Break down into executable tasks",
    agent: "planner",
    command: "plan",
    dependsOn: ["spec"],
  },
  {
    id: "code",
    name: "Code Implementation",
    description: "Implement features and fixes",
    agent: "executor",
    command: "code",
    dependsOn: ["plan"],
  },
  {
    id: "test",
    name: "Testing & QA",
    description: "Run tests and verify functionality",
    agent: "qa-tester",
    command: "test",
    dependsOn: ["code"],
  },
  {
    id: "review",
    name: "Code Review",
    description: "Review code quality and correctness",
    agent: "code-reviewer",
    command: "review",
    dependsOn: ["test"],
  },
  {
    id: "deploy",
    name: "Deployment",
    description: "Deploy to target environment",
    agent: "executor",
    dependsOn: ["review"],
    optional: true,
  },
  {
    id: "canary",
    name: "Canary Release",
    description: "Gradual traffic shift and monitoring",
    agent: "qa-tester",
    dependsOn: ["deploy"],
    optional: true,
  },
];

/**
 * Pipeline executor
 */
export class Pipeline {
  private config: PipelineConfig;
  private stages: Map<PipelineStage, StageDefinition>;
  private results: Map<PipelineStage, StageContext>;
  private pipelineId: string;

  constructor(config?: Partial<PipelineConfig>) {
    this.config = {
      stages: config?.stages ?? DEFAULT_STAGES,
      continueOnError: config?.continueOnError ?? false,
      timeout: config?.timeout ?? 3600000, // 1 hour default
      onStageComplete: config?.onStageComplete,
      onStageFail: config?.onStageFail,
      onPipelineComplete: config?.onPipelineComplete,
    };

    this.stages = new Map();
    for (const stage of this.config.stages) {
      this.stages.set(stage.id, stage);
    }

    this.results = new Map();
    this.pipelineId = this.generateId();
  }

  private generateId(): string {
    return `pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Check if a stage's dependencies are met
   */
  private areDependenciesMet(stage: StageDefinition): boolean {
    for (const depId of stage.dependsOn) {
      const depResult = this.results.get(depId);
      if (!depResult || depResult.status !== "completed") {
        return false;
      }
    }
    return true;
  }

  /**
   * Get next executable stages
   */
  getNextStages(): StageDefinition[] {
    const next: StageDefinition[] = [];
    for (const [stageId, stage] of this.stages) {
      const result = this.results.get(stageId);
      // Skip if already executed
      if (result && (result.status === "completed" || result.status === "skipped")) {
        continue;
      }
      // Check if dependencies are met
      if (this.areDependenciesMet(stage)) {
        next.push(stage);
      }
    }
    return next;
  }

  /**
   * Get all pending stages
   */
  getPendingStages(): StageDefinition[] {
    return Array.from(this.stages.values()).filter((stage) => {
      const result = this.results.get(stage.id);
      return !result || result.status === "pending";
    });
  }

  /**
   * Get stage status
   */
  getStageStatus(stageId: PipelineStage): StageContext | undefined {
    return this.results.get(stageId);
  }

  /**
   * Update stage result
   */
  updateStage(context: StageContext): void {
    this.results.set(context.stage, context);
    this.config.onStageComplete?.(context);
  }

  /**
   * Mark stage as failed
   */
  failStage(stageId: PipelineStage, error: string): void {
    const context: StageContext = {
      stage: stageId,
      input: null,
      status: "failed",
      error,
      endTime: Date.now(),
    };
    this.results.set(stageId, context);
    this.config.onStageFail?.(context, new Error(error));
  }

  /**
   * Skip a stage
   */
  skipStage(stageId: PipelineStage, reason?: string): void {
    const context: StageContext = {
      stage: stageId,
      input: null,
      status: "skipped",
      error: reason,
      endTime: Date.now(),
    };
    this.results.set(stageId, context);
  }

  /**
   * Execute a single stage
   */
  async executeStage(
    stageId: PipelineStage,
    input: unknown,
    executor: (stage: StageDefinition, input: unknown) => Promise<unknown>
  ): Promise<StageContext> {
    const stage = this.stages.get(stageId);
    if (!stage) {
      throw new Error(`Unknown stage: ${stageId}`);
    }

    const context: StageContext = {
      stage: stageId,
      input,
      status: "running",
      startTime: Date.now(),
    };

    this.updateStage(context);
    logger.info(`[Pipeline:${this.pipelineId}] Starting stage: ${stageId}`);

    try {
      const output = await executor(stage, input);
      context.output = output;
      context.status = "completed";
      context.endTime = Date.now();
      this.updateStage(context);
      logger.info(`[Pipeline:${this.pipelineId}] Completed stage: ${stageId}`);
      return context;
    } catch (error) {
      context.status = "failed";
      context.error = error instanceof Error ? error.message : String(error);
      context.endTime = Date.now();
      this.failStage(stageId, context.error);
      throw error;
    }
  }

  /**
   * Execute the full pipeline
   */
  async execute(
    initialInput: unknown,
    executor: (stage: StageDefinition, input: unknown) => Promise<unknown>
  ): Promise<PipelineResult> {
    const result: PipelineResult = {
      pipelineId: this.pipelineId,
      status: "completed",
      stages: [],
      startTime: Date.now(),
    };

    logger.info(`[Pipeline:${this.pipelineId}] Starting pipeline execution`);

    try {
      // Run stages sequentially, executing parallel branches when possible
      let currentInput = initialInput;
      let hasFailures = false;

      for (const stage of this.config.stages) {
        // Check if dependencies are met
        if (!this.areDependenciesMet(stage)) {
          // Skip stages with unmet dependencies
          this.skipStage(stage.id, "Unmet dependencies");
          continue;
        }

        // Check if stage should be skipped
        if (stage.optional && !this.shouldRunOptionalStage(stage)) {
          this.skipStage(stage.id, "Optional stage skipped");
          continue;
        }

        try {
          const context = await this.executeStage(stage.id, currentInput, executor);
          if (context.output !== undefined) {
            currentInput = context.output;
          }
        } catch (error) {
          hasFailures = true;
          if (!this.config.continueOnError) {
            result.status = "failed";
            result.error = error instanceof Error ? error.message : String(error);
            break;
          }
        }
      }

      if (!hasFailures) {
        result.status = "completed";
      }
    } catch (error) {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : String(error);
    }

    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;
    result.stages = Array.from(this.results.values());

    logger.info(
      `[Pipeline:${this.pipelineId}] Pipeline ${result.status} in ${result.duration}ms`
    );

    this.config.onPipelineComplete?.(result);
    return result;
  }

  /**
   * Determine if an optional stage should run
   */
  private shouldRunOptionalStage(_stage: StageDefinition): boolean {
    // Default: run optional stages if previous stages succeeded
    return true;
  }

  /**
   * Get pipeline summary
   */
  getSummary(): {
    pipelineId: string;
    totalStages: number;
    completed: number;
    failed: number;
    skipped: number;
    duration?: number;
  } {
    const stages = Array.from(this.results.values());
    return {
      pipelineId: this.pipelineId,
      totalStages: this.stages.size,
      completed: stages.filter((s) => s.status === "completed").length,
      failed: stages.filter((s) => s.status === "failed").length,
      skipped: stages.filter((s) => s.status === "skipped").length,
    };
  }
}
