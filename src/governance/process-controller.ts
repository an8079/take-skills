/**
 * Process Controller
 *
 * Central governance for process execution.
 * Enforces phase discipline and maintains process integrity.
 */

import { PhaseTracker, type Phase, type PhaseTransitionRecord } from "../phase-manager/index.js";

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

  constructor(config?: Partial<ProcessConfig>) {
    this.tracker = new PhaseTracker();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.violations = [];
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

    for (const phase of this.tracker.getAllPhases()) {
      if (phase.stateMachine.isActive() && this.config.enforceStageGates) {
        // Check if phase should be blocked due to gate failures
        // Implementation depends on gate check results
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
  }
}
