/**
 * Pipeline Chain
 *
 * Orchestrates the E2E execution chain: interview → spec → plan → code → test → review → deploy → canary
 * With governance gates, audit logging, and approval workflows.
 */

import { logger } from "../utils/logger.js";
import { AuditLog } from "../governance/audit-log.js";
import { ProcessController, type ProcessViolation } from "../governance/process-controller.js";
import { PhaseTracker, checkGate, type StageGate, PHASE_DISCUSS_GATE, PHASE_PLAN_GATE, PHASE_EXECUTE_GATE, PHASE_VERIFY_GATE } from "../phase-manager/index.js";
import { loadArtifact, loadArtifactsFromDirectory, isArtifactFile, getArtifactTypeFromFilename } from "../artifacts/loader.js";
import { validateArtifact } from "../artifacts/validator.js";
import type { GateCheckResult } from "../phase-manager/stage-gates.js";
import { ApprovalWorkflow, type ApprovalRequest } from "../phase-manager/approval-workflow.js";
import { MetricsCollector } from "../metrics/collector.js";
import type {
  PipelineStage,
  StageContext,
  PipelineResult,
  PipelineConfig,
  StageDefinition,
} from "./types.js";
import type { ArtifactType } from "../artifacts/types.js";
import { join } from "path";

/**
 * Input/output artifact specification for a stage
 */
export interface StageArtifacts {
  inputs: ArtifactType[];
  outputs: ArtifactType[];
}

/**
 * Error thrown when a blocking gate prevents stage execution
 */
export class GateBlockedError extends Error {
  constructor(
    public readonly stageName: string,
    public readonly blockingCriteria: string[]
  ) {
    super(`Gate blocked: ${stageName} - ${blockingCriteria.join("; ")}`);
    this.name = "GateBlockedError";
  }
}

/**
 * Gate and approval status for pipeline summary
 */
export interface GateStatusEntry {
  stageId: PipelineStage;
  gateId: string;
  passed: boolean;
  blockingCriteria: string[];
  warnings: string[];
  approvalRequest?: {
    id: string;
    status: ApprovalRequest["status"];
    approver?: string;
  };
  blockedAt?: number;
  blockReason?: string;
}

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
    gate: PHASE_DISCUSS_GATE,
    phaseId: "discuss",
  },
  {
    id: "spec",
    name: "Specification",
    description: "Create technical specification",
    agent: "architect",
    command: "spec",
    dependsOn: ["interview"],
    gate: PHASE_PLAN_GATE,
    phaseId: "plan",
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
    gate: PHASE_EXECUTE_GATE,
    phaseId: "execute",
  },
  {
    id: "test",
    name: "Testing & QA",
    description: "Run tests and verify functionality",
    agent: "qa-tester",
    command: "test",
    dependsOn: ["code"],
    gate: PHASE_VERIFY_GATE,
    phaseId: "verify",
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
 * Artifact mappings for each pipeline stage
 * Defines which artifacts are consumed (inputs) and produced (outputs) by each stage
 */
export const STAGE_ARTIFACTS: Record<PipelineStage, StageArtifacts> = {
  interview: {
    inputs: [],
    outputs: ["PROJECT", "REQUIREMENTS"],
  },
  spec: {
    inputs: ["PROJECT", "REQUIREMENTS"],
    outputs: ["SPEC"],
  },
  plan: {
    inputs: ["SPEC"],
    outputs: ["PLAN"],
  },
  code: {
    inputs: ["PLAN"],
    outputs: ["EXECUTION-LOG"],
  },
  test: {
    inputs: ["EXECUTION-LOG"],
    outputs: ["VERIFICATION"],
  },
  review: {
    inputs: ["VERIFICATION"],
    outputs: ["QA-REPORT"],
  },
  deploy: {
    inputs: ["QA-REPORT"],
    outputs: ["RELEASE", "DEPLOYMENT"],
  },
  canary: {
    inputs: ["RELEASE", "DEPLOYMENT"],
    outputs: [],
  },
};

/**
 * Get the artifact index for pipeline completion
 */
export function buildArtifactIndex(): Array<{ stage: PipelineStage; artifacts: StageArtifacts }> {
  return (["interview", "spec", "plan", "code", "test", "review", "deploy", "canary"] as PipelineStage[]).map(
    (stage) => ({
      stage,
      artifacts: STAGE_ARTIFACTS[stage],
    })
  );
}

/**
 * Pipeline executor
 */
export class Pipeline {
  private config: PipelineConfig;
  private stages: Map<PipelineStage, StageDefinition>;
  private results: Map<PipelineStage, StageContext>;
  private pipelineId: string;
  private auditLog: AuditLog;
  private approvalWorkflow: ApprovalWorkflow;
  private gateStatusEntries: Map<PipelineStage, GateStatusEntry>;
  private metrics: MetricsCollector;
  private tracker: import("../phase-manager/index.js").PhaseTracker;
  private processController: ProcessController | null = null;
  private readonly artifactDir: string;

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
    this.auditLog = new AuditLog();
    this.approvalWorkflow = new ApprovalWorkflow();
    this.gateStatusEntries = new Map();
    this.metrics = MetricsCollector.getInstance();
    this.artifactDir = (config as { artifactDir?: string })?.artifactDir ?? join(process.cwd(), "artifacts");
    this.tracker = new PhaseTracker();
  }

  private generateId(): string {
    return `pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private initializeProcessGovernance(): void {
    if (!this.processController) {
      return;
    }

    const governancePhaseIds = Array.from(
      new Set(
        this.config.stages
          .map((stage) => stage.phaseId)
          .filter((phaseId): phaseId is string => Boolean(phaseId))
      )
    );

    governancePhaseIds.forEach((phaseId, index) => {
      const stage = this.config.stages.find((candidate) => candidate.phaseId === phaseId);
      this.processController?.registerRuntimePhase(phaseId, {
        name: stage?.name ?? phaseId,
        status: "pending",
        dependencies: index === 0 ? [] : [governancePhaseIds[index - 1]],
      });
    });
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
   * Get artifact filename for a given artifact type
   */
  private getArtifactFilename(type: ArtifactType): string {
    const map: Record<string, string> = {
      "PROJECT": "PROJECT.md",
      "REQUIREMENTS": "REQUIREMENTS.md",
      "SPEC": "SPEC.md",
      "PLAN": "PLAN.md",
      "ROADMAP": "ROADMAP.md",
      "EXECUTION-STATE": "EXECUTION-STATE.json",
      "EXECUTION-LOG": "EXECUTION-LOG.md",
      "VERIFICATION": "VERIFICATION.md",
      "QA-REPORT": "QA-REPORT.md",
      "RELEASE": "RELEASE.md",
      "RETRO": "RETRO.md",
      "DEPLOYMENT": "DEPLOYMENT.md",
    };
    if (map[type]) return map[type];
    // Handle PHASE-N-CONTEXT and PHASE-N-PLAN
    if (type.startsWith("PHASE-")) {
      const match = type.match(/^(PHASE-\d+-(CONTEXT|PLAN))$/);
      if (match) return `${match[1]}.md`;
    }
    return `${type}.md`;
  }

  /**
   * Load input artifacts for a stage
   */
  private async loadInputArtifacts(stageId: PipelineStage): Promise<Record<string, unknown> | null> {
    const stageArtifacts = STAGE_ARTIFACTS[stageId];
    if (!stageArtifacts || stageArtifacts.inputs.length === 0) return null;

    const inputs: Record<string, unknown> = {};
    for (const type of stageArtifacts.inputs) {
      const filename = this.getArtifactFilename(type);
      const filePath = join(this.artifactDir, filename);
      try {
        const artifact = await loadArtifact(filePath);
        const validation = validateArtifact(artifact);
        if (!validation.valid) {
          logger.warn(`[Pipeline:${this.pipelineId}] Invalid artifact ${filename}: ${validation.errors.join(", ")}`);
        }
        inputs[type] = artifact;
      } catch {
        // Input artifact not found - stage may be starting fresh
        logger.warn(`[Pipeline:${this.pipelineId}] Input artifact not found: ${filename}`);
      }
    }
    return Object.keys(inputs).length > 0 ? inputs : null;
  }

  /**
   * Validate output artifacts after stage completion
   */
  private async validateOutputArtifacts(stageId: PipelineStage, output: unknown): Promise<void> {
    const stageArtifacts = STAGE_ARTIFACTS[stageId];
    if (!stageArtifacts || stageArtifacts.outputs.length === 0) return;

    const stageDir = join(this.artifactDir, stageId);
    try {
      const results = await loadArtifactsFromDirectory(stageDir, true);
      for (const { artifact, filePath } of results) {
        const validation = validateArtifact(artifact);
        if (!validation.valid) {
          logger.warn(`[Pipeline:${this.pipelineId}] Invalid artifact ${filePath}: ${validation.errors.join(", ")}`);
          this.auditLog.log(
            "artifact",
            "artifact_invalid",
            "pipeline",
            { stageId, filePath, errors: validation.errors },
          );
        } else {
          this.auditLog.log(
            "artifact",
            "artifact_loaded",
            "pipeline",
            { stageId, filePath, type: getArtifactTypeFromFilename(filePath.split(/[/\\]/).pop() || "") ?? "UNKNOWN" },
          );
        }
      }
    } catch {
      // No artifacts produced - not necessarily an error
    }
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
   * Check gate before stage execution.
   * Returns the gate result. Throws GateBlockedError if blocking criteria fail.
   * Handles approval workflow if gate requires approval.
   */
  private async checkGateForStage(stage: StageDefinition): Promise<GateCheckResult | null> {
    if (!stage.gate) {
      return null;
    }

    // Record phase advance attempt in audit log
    this.auditLog.log(
      "phase",
      "stage_advance_attempt",
      "pipeline",
      { stageId: stage.id, gateId: stage.gate.id },
      { phaseId: stage.phaseId }
    );

    const gateResult = await checkGate(stage.gate);
    if (this.processController && stage.phaseId) {
      this.processController.recordGateResult(stage.phaseId, gateResult, {
        status: gateResult.passed ? "running" : "blocked",
      });
    }

    const entry: GateStatusEntry = {
      stageId: stage.id,
      gateId: stage.gate.id,
      passed: gateResult.passed,
      blockingCriteria: gateResult.blockingCriteria.map(c => c.description),
      warnings: gateResult.warningCriteria.map(c => c.description),
    };

    if (!gateResult.passed && gateResult.blockingCriteria.length > 0) {
      // This is a blocking gate failure
      entry.blockedAt = Date.now();
      entry.blockReason = `Blocking criteria failed: ${gateResult.blockingCriteria.map(c => c.description).join("; ")}`;

      // Record gate block in audit log
      this.auditLog.log(
        "gate",
        "gate_blocked",
        "pipeline",
        {
          stageId: stage.id,
          gateId: stage.gate.id,
          blockingCriteria: gateResult.blockingCriteria.map(c => c.description),
        },
        { phaseId: stage.phaseId }
      );

      // Check if gate requires approval before blocking
      if (stage.gate.requiresApproval) {
        const approvalRequest = await this.approvalWorkflow.requestApproval(
          stage.phaseId || stage.id,
          stage.gate.id,
          "pipeline",
          { approver: stage.gate.approvers?.[0] }
        );

        entry.approvalRequest = {
          id: approvalRequest.id,
          status: approvalRequest.status,
          approver: approvalRequest.approver,
        };
        if (this.processController && stage.phaseId) {
          this.processController.recordApprovalState(stage.phaseId, {
            required: true,
            status: approvalRequest.status,
            approver: approvalRequest.approver,
            requestId: approvalRequest.id,
          });
        }

        // Approval required gates enter approval workflow instead of immediately blocking
        if (approvalRequest.status === "pending") {
          this.auditLog.log(
            "approval",
            "approval_requested",
            "pipeline",
            {
              stageId: stage.id,
              gateId: stage.gate.id,
              approvalId: approvalRequest.id,
              approver: approvalRequest.approver,
            },
            { phaseId: stage.phaseId }
          );

          // Throw gate blocked error - pipeline cannot proceed without approval
          throw new GateBlockedError(
            stage.name,
            gateResult.blockingCriteria.map(c => c.description)
          );
        }
      } else {
        // Non-approval gates block immediately
        throw new GateBlockedError(
          stage.name,
          gateResult.blockingCriteria.map(c => c.description)
        );
      }
    }

    // Gate passed - record in audit log
    if (gateResult.passed) {
      this.auditLog.log(
        "gate",
        "gate_passed",
        "pipeline",
        { stageId: stage.id, gateId: stage.gate.id },
        { phaseId: stage.phaseId }
      );
    } else if (gateResult.warningCriteria.length > 0) {
      this.auditLog.log(
        "gate",
        "gate_passed_with_warnings",
        "pipeline",
        {
          stageId: stage.id,
          gateId: stage.gate.id,
          warnings: gateResult.warningCriteria.map(c => c.description),
        },
        { phaseId: stage.phaseId }
      );
    }

    this.gateStatusEntries.set(stage.id, entry);
    return gateResult;
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

    if (this.processController && stage.phaseId) {
      this.processController.updateRuntimePhase(stage.phaseId, {
        name: stage.name,
        status: "running",
      });
    }

    // Check gate before executing stage
    const gateResult = await this.checkGateForStage(stage);

    // Record gate check metrics
    if (gateResult) {
      this.metrics.recordGateCheck(stageId, stage.gate?.id || "default", gateResult.passed);
    }

    // Load input artifacts for this stage
    const artifactInputs = await this.loadInputArtifacts(stageId);
    const enrichedInput = artifactInputs
      ? { ...(input as Record<string, unknown>), ...artifactInputs }
      : input;

    const context: StageContext = {
      stage: stageId,
      input: enrichedInput,
      status: "running",
      startTime: Date.now(),
      metadata: {
        gateResult: gateResult ? {
          passed: gateResult.passed,
          blockingCriteria: gateResult.blockingCriteria.map(c => c.id),
          warnings: gateResult.warningCriteria.map(c => c.id),
        } : undefined,
      },
    };

    this.updateStage(context);
    logger.info(`[Pipeline:${this.pipelineId}] Starting stage: ${stageId}`);

    try {
      const output = await executor(stage, enrichedInput);
      context.output = output;
      context.status = "completed";
      context.endTime = Date.now();

      // Validate output artifacts after stage completion
      await this.validateOutputArtifacts(stageId, output);

      this.updateStage(context);

      // Post-stage enforcement check
      if (this.processController && stage.phaseId) {
        this.processController.updateRuntimePhase(stage.phaseId, {
          name: stage.name,
          status: "completed",
        });
        if (stage.gate?.requiresApproval) {
          this.processController.recordApprovalState(stage.phaseId, {
            required: true,
            status: "approved",
            approver: "pipeline",
          });
        }
      }

      if (this.processController) {
        const postStageViolations = await this.processController.enforceProcess();
        const newViolations = postStageViolations.filter(
          (v) =>
            !this.auditLog
              .export()
              .some(
                (e) =>
                  (e.details?.violation as ProcessViolation)?.type === v.type &&
                  (e.details?.violation as ProcessViolation)?.phaseId === v.phaseId
              )
        );
        for (const v of newViolations) {
          this.auditLog.log("violation", "process_violation", "pipeline", { violation: v });
        }
      }

      // Record stage completion metrics
      const duration = context.endTime - (context.startTime || 0);
      this.metrics.recordStageCompletion(stageId, duration, "completed");

      logger.info(`[Pipeline:${this.pipelineId}] Completed stage: ${stageId}`);
      return context;
    } catch (error) {
      context.status = "failed";
      context.error = error instanceof Error ? error.message : String(error);
      context.endTime = Date.now();

      if (this.processController && stage.phaseId) {
        this.processController.updateRuntimePhase(stage.phaseId, {
          name: stage.name,
          status: "blocked",
        });
      }

      // Record stage failure metrics
      const duration = context.endTime - (context.startTime || 0);
      this.metrics.recordStageCompletion(stageId, duration, "failed");

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

    // Record pipeline start in audit log
    this.auditLog.log("phase", "pipeline_started", "pipeline", { pipelineId: this.pipelineId });

    // Initialize process controller and run initial enforcement check
    this.processController = new ProcessController(this.tracker, {
      mode: "strict",
      enforceStageGates: true,
    });
    this.initializeProcessGovernance();
    const initialViolations = await this.processController.enforceProcess();
    for (const v of initialViolations) {
      this.auditLog.log("violation", "process_violation", "pipeline", { violation: v });
    }

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
          // Check if this was a gate block vs execution failure
          const isGateBlock = error instanceof GateBlockedError;
          hasFailures = true;

          this.auditLog.log(
            isGateBlock ? "gate" : "phase",
            isGateBlock ? "gate_blocked_pipeline_halted" : "stage_failed",
            "pipeline",
            {
              stageId: stage.id,
              error: error instanceof Error ? error.message : String(error),
              isGateBlock,
            },
            { phaseId: stage.phaseId }
          );

          // continueOnError does NOT bypass blocking gates
          if (!this.config.continueOnError || isGateBlock) {
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

    // Record pipeline end in audit log
    this.auditLog.log("phase", "pipeline_completed", "pipeline", {
      pipelineId: this.pipelineId,
      status: result.status,
      duration: result.duration,
    });

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
   * Get pipeline summary with gate status and approval information
   */
  getSummary(): {
    pipelineId: string;
    totalStages: number;
    completed: number;
    failed: number;
    skipped: number;
    duration?: number;
    gateStatus: GateStatusEntry[];
    auditLog: import("../governance/audit-log.js").AuditEntry[];
  } {
    const stages = Array.from(this.results.values());
    return {
      pipelineId: this.pipelineId,
      totalStages: this.stages.size,
      completed: stages.filter((s) => s.status === "completed").length,
      failed: stages.filter((s) => s.status === "failed").length,
      skipped: stages.filter((s) => s.status === "skipped").length,
      gateStatus: Array.from(this.gateStatusEntries.values()),
      auditLog: this.auditLog.export(),
    };
  }

  /**
   * Get the audit log for this pipeline
   */
  getAuditLog(): import("../governance/audit-log.js").AuditEntry[] {
    return this.auditLog.export();
  }

  /**
   * Get gate status entries
   */
  getGateStatus(): GateStatusEntry[] {
    return Array.from(this.gateStatusEntries.values());
  }

  /**
   * Get approval workflow instance
   */
  getApprovalWorkflow(): ApprovalWorkflow {
    return this.approvalWorkflow;
  }
}
