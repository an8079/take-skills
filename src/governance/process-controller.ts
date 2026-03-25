/**
 * Process Controller
 *
 * Central governance for process execution.
 * Enforces phase discipline and maintains process integrity.
 */

import { PhaseTracker, type Phase, type PhaseTransitionRecord } from "../phase-manager/index.js";
import type { GateCheckResult } from "../phase-manager/stage-gates.js";

export type ProcessMode = "strict" | "relaxed" | "yolo";

export interface ProcessConfig {
  mode: ProcessMode;
  autoAdvance: boolean;
  enforceStageGates: boolean;
  requireApproval: boolean;
  allowSkipPhases: boolean;
  maxActivePhases: number;
}

export interface ProcessViolation {
  type: "phase_order" | "gate_blocked" | "approval_missing" | "dependency_blocked";
  severity: "error" | "warning";
  message: string;
  phaseId: string;
  context?: Record<string, unknown>;
}

type RuntimePhaseStatus = "pending" | "running" | "completed" | "blocked";

interface RuntimePhaseRecord {
  phaseId: string;
  name?: string;
  status: RuntimePhaseStatus;
  dependencies: string[];
  gateResult?: {
    gateId: string;
    passed: boolean;
    blockingCriteria: string[];
    warnings: string[];
    checkedAt: number;
  };
  approval?: {
    required: boolean;
    status: "pending" | "approved" | "rejected" | "revoked" | "auto";
    approver?: string;
    requestId?: string;
  };
}

const DEFAULT_CONFIG: ProcessConfig = {
  mode: "strict",
  autoAdvance: false,
  enforceStageGates: true,
  requireApproval: true,
  allowSkipPhases: false,
  maxActivePhases: 1,
};

export class ProcessController {
  private tracker: PhaseTracker;
  private config: ProcessConfig;
  private violations: ProcessViolation[];
  private runtimePhases: Map<string, RuntimePhaseRecord>;

  constructor(trackerOrConfig?: PhaseTracker | Partial<ProcessConfig>, config?: Partial<ProcessConfig>) {
    // Backward compatible: detect if first arg is PhaseTracker or config
    if (trackerOrConfig && typeof trackerOrConfig === "object" && "phases" in trackerOrConfig) {
      // First arg is PhaseTracker
      this.tracker = trackerOrConfig as PhaseTracker;
      this.config = { ...DEFAULT_CONFIG, ...config };
    } else if (trackerOrConfig && typeof trackerOrConfig === "object" && "mode" in trackerOrConfig) {
      // First arg is config (old signature: new ProcessController({ mode: "strict" }))
      this.tracker = new PhaseTracker();
      this.config = { ...DEFAULT_CONFIG, ...trackerOrConfig };
    } else {
      this.tracker = new PhaseTracker();
      this.config = { ...DEFAULT_CONFIG };
    }
    this.violations = [];
    this.runtimePhases = new Map();
  }

  /**
   * Set the phase tracker (for connecting to pipeline's tracker)
   */
  setTracker(tracker: PhaseTracker): void {
    this.tracker = tracker;
  }

  getTracker(): PhaseTracker {
    return this.tracker;
  }

  getConfig(): ProcessConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ProcessConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  addViolation(violation: ProcessViolation): void {
    this.violations.push(violation);
  }

  getViolations(): ProcessViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  registerRuntimePhase(
    phaseId: string,
    options?: {
      name?: string;
      status?: RuntimePhaseStatus;
      dependencies?: string[];
    }
  ): void {
    const existing = this.runtimePhases.get(phaseId);
    this.runtimePhases.set(phaseId, {
      phaseId,
      name: options?.name ?? existing?.name,
      status: options?.status ?? existing?.status ?? "pending",
      dependencies: options?.dependencies ?? existing?.dependencies ?? [],
      gateResult: existing?.gateResult,
      approval: existing?.approval,
    });
  }

  updateRuntimePhase(
    phaseId: string,
    updates: {
      name?: string;
      status?: RuntimePhaseStatus;
      dependencies?: string[];
    }
  ): void {
    this.registerRuntimePhase(phaseId, updates);
  }

  recordGateResult(
    phaseId: string,
    gateResult: GateCheckResult,
    options?: { status?: RuntimePhaseStatus }
  ): void {
    const existing = this.runtimePhases.get(phaseId);
    this.runtimePhases.set(phaseId, {
      phaseId,
      name: existing?.name,
      status: options?.status ?? existing?.status ?? (gateResult.passed ? "running" : "blocked"),
      dependencies: existing?.dependencies ?? [],
      gateResult: {
        gateId: gateResult.gate.id,
        passed: gateResult.passed,
        blockingCriteria: gateResult.blockingCriteria.map((criterion) => criterion.description),
        warnings: gateResult.warningCriteria.map((criterion) => criterion.description),
        checkedAt: gateResult.checkedAt,
      },
      approval: existing?.approval,
    });
  }

  recordApprovalState(
    phaseId: string,
    approval: {
      required: boolean;
      status: "pending" | "approved" | "rejected" | "revoked" | "auto";
      approver?: string;
      requestId?: string;
    }
  ): void {
    const existing = this.runtimePhases.get(phaseId);
    this.runtimePhases.set(phaseId, {
      phaseId,
      name: existing?.name,
      status: existing?.status ?? "pending",
      dependencies: existing?.dependencies ?? [],
      gateResult: existing?.gateResult,
      approval,
    });
  }

  getRuntimePhases(): RuntimePhaseRecord[] {
    return Array.from(this.runtimePhases.values()).map((phase) => ({
      ...phase,
      dependencies: [...phase.dependencies],
      gateResult: phase.gateResult
        ? {
            ...phase.gateResult,
            blockingCriteria: [...phase.gateResult.blockingCriteria],
            warnings: [...phase.gateResult.warnings],
          }
        : undefined,
      approval: phase.approval ? { ...phase.approval } : undefined,
    }));
  }

  validatePhaseTransition(
    phaseId: string,
    event: string
  ): { valid: boolean; violations: ProcessViolation[] } {
    const violations: ProcessViolation[] = [];
    const phase = this.tracker.getPhase(phaseId);

    if (!phase) {
      violations.push({
        type: "phase_order",
        severity: "error",
        message: `Phase ${phaseId} not found`,
        phaseId,
      });
      return { valid: false, violations };
    }

    if (this.config.mode === "strict") {
      const currentPhase = this.tracker.getCurrentPhase();
      if (currentPhase && currentPhase.id !== phaseId) {
        if (!currentPhase.stateMachine.isCompleted() && !currentPhase.stateMachine.isBlocked()) {
          violations.push({
            type: "phase_order",
            severity: "error",
            message: `Phase ${currentPhase.number} must be completed or blocked before starting phase ${phase.number}`,
            phaseId,
            context: { currentPhaseId: currentPhase.id },
          });
        }
      }

      const canStart = this.tracker.canStartPhase(phaseId);
      if (!canStart.allowed) {
        for (const reason of canStart.reasons) {
          violations.push({
            type: "dependency_blocked",
            severity: "error",
            message: reason,
            phaseId,
          });
        }
      }
    }

    this.violations = violations;
    return { valid: violations.length === 0, violations };
  }

  enforceProcess(): ProcessViolation[] {
    const allViolations: ProcessViolation[] = [];

    const trackerPhases = this.tracker.getAllPhases();
    const activeTrackerPhases = trackerPhases.filter((phase) => phase.stateMachine.isActive());

    if (
      this.config.mode === "strict" &&
      activeTrackerPhases.length > this.config.maxActivePhases
    ) {
      for (const phase of activeTrackerPhases.slice(this.config.maxActivePhases)) {
        allViolations.push({
          type: "phase_order",
          severity: "error",
          message: `More than ${this.config.maxActivePhases} tracked phase(s) are active at once`,
          phaseId: phase.id,
          context: { activeTrackedPhases: activeTrackerPhases.map((entry) => entry.id) },
        });
      }
    }

    for (const phase of trackerPhases) {
      if (!phase.stateMachine.isActive()) {
        continue;
      }

      const canStart = this.tracker.canStartPhase(phase.id);
      if (!canStart.allowed) {
        for (const reason of canStart.reasons) {
          allViolations.push({
            type: "dependency_blocked",
            severity: "error",
            message: reason,
            phaseId: phase.id,
          });
        }
      }
    }

    const runtimePhases = Array.from(this.runtimePhases.values());
    const activeRuntimePhases = runtimePhases.filter(
      (phase) => phase.status === "running" || phase.status === "blocked"
    );

    if (
      this.config.mode === "strict" &&
      activeRuntimePhases.length > this.config.maxActivePhases
    ) {
      for (const phase of activeRuntimePhases.slice(this.config.maxActivePhases)) {
        allViolations.push({
          type: "phase_order",
          severity: "error",
          message: `More than ${this.config.maxActivePhases} runtime phase(s) are active at once`,
          phaseId: phase.phaseId,
          context: { activeRuntimePhases: activeRuntimePhases.map((entry) => entry.phaseId) },
        });
      }
    }

    for (const phase of activeRuntimePhases) {
      for (const dependencyId of phase.dependencies) {
        const dependency = this.runtimePhases.get(dependencyId);
        if (!dependency || dependency.status !== "completed") {
          allViolations.push({
            type: "dependency_blocked",
            severity: "error",
            message: `Phase ${phase.phaseId} depends on ${dependencyId} completing first`,
            phaseId: phase.phaseId,
            context: {
              dependencyId,
              dependencyStatus: dependency?.status ?? "missing",
            },
          });
        }
      }

      if (
        this.config.enforceStageGates &&
        phase.gateResult &&
        !phase.gateResult.passed
      ) {
        allViolations.push({
          type: "gate_blocked",
          severity: "error",
          message: `Gate ${phase.gateResult.gateId} blocked phase ${phase.phaseId}: ${phase.gateResult.blockingCriteria.join("; ")}`,
          phaseId: phase.phaseId,
          context: {
            gateId: phase.gateResult.gateId,
            blockingCriteria: phase.gateResult.blockingCriteria,
            warnings: phase.gateResult.warnings,
          },
        });
      }

      if (
        this.config.requireApproval &&
        phase.approval?.required &&
        !["approved", "auto"].includes(phase.approval.status)
      ) {
        allViolations.push({
          type: "approval_missing",
          severity: "error",
          message: `Phase ${phase.phaseId} requires approval before continuing`,
          phaseId: phase.phaseId,
          context: {
            approvalStatus: phase.approval.status,
            approver: phase.approval.approver,
            requestId: phase.approval.requestId,
          },
        });
      }
    }

    this.violations = allViolations;
    return allViolations;
  }

  getProcessStatus(): {
    config: ProcessConfig;
    progress: ReturnType<PhaseTracker["getProgress"]>;
    violations: number;
    currentPhase: Phase | null;
  } {
    return {
      config: this.getConfig(),
      progress: this.tracker.getProgress(),
      violations: this.violations.length,
      currentPhase: this.tracker.getCurrentPhase(),
    };
  }

  reset(): void {
    this.tracker = new PhaseTracker();
    this.violations = [];
    this.runtimePhases.clear();
  }
}
