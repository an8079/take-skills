/**
 * Phase Checker
 *
 * Validates phase health and readiness to transition.
 * Uses artifact-driven checks to determine phase health and gate compliance.
 */

import { type Phase, STAGE_GATES, getGateForTransition, checkGate, type StageGate } from "../phase-manager/index.js";
import { artifactRegistry } from "../artifacts/registry.js";
import { loadArtifact, artifactExists } from "../artifacts/loader.js";
import { STAGE_ARTIFACTS, type StageArtifacts } from "../pipeline/chain.js";
import type { ArtifactType } from "../artifacts/types.js";

export interface PhaseHealth {
  phaseId: string;
  isHealthy: boolean;
  canAdvance: boolean;
  blockers: PhaseBlocker[];
  warnings: PhaseWarning[];
  checkedAt: number;
  artifactStatus?: ArtifactHealthDetail[];
}

export interface PhaseBlocker {
  type: "dependency" | "gate" | "approval" | "process" | "artifact";
  message: string;
  severity: "critical";
}

export interface PhaseWarning {
  type: "quality" | "coverage" | "documentation";
  message: string;
  severity: "warning";
}

export interface ArtifactHealthDetail {
  artifactType: ArtifactType;
  exists: boolean;
  approved: boolean;
  path?: string;
}

/**
 * Mapping from phase status to expected artifact types
 */
const PHASE_ARTIFACT_MAP: Record<string, ArtifactType[]> = {
  draft: [],
  discussing: ["PROJECT", "REQUIREMENTS"],
  planned: ["PROJECT", "REQUIREMENTS", "SPEC"],
  executing: ["PROJECT", "REQUIREMENTS", "SPEC", "PLAN"],
  verifying: ["PROJECT", "REQUIREMENTS", "SPEC", "PLAN", "EXECUTION-LOG"],
  completed: ["PROJECT", "REQUIREMENTS", "SPEC", "PLAN", "EXECUTION-LOG", "VERIFICATION", "QA-REPORT"],
};

export class PhaseChecker {
  /**
   * Check phase health using artifact-driven validation
   */
  async checkHealth(phase: Phase): Promise<PhaseHealth> {
    const blockers: PhaseBlocker[] = [];
    const warnings: PhaseWarning[] = [];
    const artifactStatus: ArtifactHealthDetail[] = [];

    // Check required artifacts based on phase status
    const requiredArtifacts = PHASE_ARTIFACT_MAP[phase.status] || [];

    for (const artifactType of requiredArtifacts) {
      const entries = artifactRegistry.getByType(artifactType);
      const exists = entries.length > 0;
      const approved = exists && entries.every((e) => e.artifact.frontmatter.approvalState === "approved");

      artifactStatus.push({
        artifactType,
        exists,
        approved,
        path: exists ? entries[0].filePath : undefined,
      });

      if (!exists) {
        blockers.push({
          type: "artifact",
          message: `Required artifact ${artifactType} not found for phase status "${phase.status}"`,
          severity: "critical",
        });
      } else if (!approved) {
        warnings.push({
          type: "documentation",
          message: `Artifact ${artifactType} exists but is not approved`,
          severity: "warning",
        });
      }
    }

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
      artifactStatus,
    };
  }

  /**
   * Check if all input artifacts for a stage exist and are approved
   */
  async checkStageArtifacts(stageId: string): Promise<{ ready: boolean; missing: ArtifactType[] }> {
    const stageArtifacts: StageArtifacts | undefined = STAGE_ARTIFACTS[stageId as keyof typeof STAGE_ARTIFACTS];
    if (!stageArtifacts) {
      return { ready: false, missing: [] };
    }

    const missing: ArtifactType[] = [];
    for (const inputType of stageArtifacts.inputs) {
      const entries = artifactRegistry.getByType(inputType);
      if (entries.length === 0) {
        missing.push(inputType);
      }
    }

    return {
      ready: missing.length === 0,
      missing,
    };
  }

  /**
   * Get output artifacts that should be produced by a stage
   */
  getStageOutputArtifacts(stageId: string): ArtifactType[] {
    const stageArtifacts = STAGE_ARTIFACTS[stageId as keyof typeof STAGE_ARTIFACTS];
    return stageArtifacts?.outputs || [];
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
