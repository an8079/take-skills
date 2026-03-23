/**
 * Phase Checker
 *
 * Validates phase health and readiness to transition.
 * Checks dependencies, gate criteria, and process compliance.
 */

import { type Phase, STAGE_GATES, getGateForTransition, checkGate, type StageGate } from "../phase-manager/index.js";

export interface PhaseHealth {
  phaseId: string;
  isHealthy: boolean;
  canAdvance: boolean;
  blockers: PhaseBlocker[];
  warnings: PhaseWarning[];
  checkedAt: number;
}

export interface PhaseBlocker {
  type: "dependency" | "gate" | "approval" | "process";
  message: string;
  severity: "critical";
}

export interface PhaseWarning {
  type: "quality" | "coverage" | "documentation";
  message: string;
  severity: "warning";
}

export class PhaseChecker {
  async checkHealth(phase: Phase): Promise<PhaseHealth> {
    const blockers: PhaseBlocker[] = [];
    const warnings: PhaseWarning[] = [];

    // Check if phase has required context for current status
    if (phase.status === "discussing" && !phase.context?.["contextPath"]) {
      blockers.push({
        type: "gate",
        message: "CONTEXT.md not created",
        severity: "critical",
      });
    }

    if (phase.status === "planned" && !phase.context?.["plansExist"]) {
      blockers.push({
        type: "gate",
        message: "Plans not created",
        severity: "critical",
      });
    }

    if (phase.status === "executing" && !phase.context?.["contextPath"]) {
      blockers.push({
        type: "process",
        message: "Cannot execute without context",
        severity: "critical",
      });
    }

    return {
      phaseId: phase.id,
      isHealthy: blockers.length === 0,
      canAdvance: blockers.length === 0,
      blockers,
      warnings,
      checkedAt: Date.now(),
    };
  }

  async checkGateCompliance(
    phase: Phase,
    gate: StageGate
  ): Promise<{ compliant: boolean; issues: string[] }> {
    const result = await checkGate(gate);
    const issues: string[] = [];

    if (!result.passed) {
      for (const c of result.blockingCriteria) {
        issues.push(`Blocking: ${c.description}`);
      }
    }

    for (const c of result.warningCriteria) {
      issues.push(`Warning: ${c.description}`);
    }

    return {
      compliant: result.passed,
      issues,
    };
  }

  getNextValidStatus(phase: Phase): string | null {
    const transitions: Record<string, string> = {
      draft: "discussing",
      discussing: "planned",
      planned: "executing",
      executing: "verifying",
      verifying: "completed",
    };

    return transitions[phase.status] || null;
  }
}
