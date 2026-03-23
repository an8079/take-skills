/**
 * State Recovery Module
 *
 * Handles crash recovery and session restoration:
 * - detectUnfinishedSession(): checks for valid STATE.json
 * - recoverSession(): restores state from STATE.json
 * - clearState(): removes STATE.json on successful completion
 */

import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import {
  StateManager,
  SessionState,
  PipelineProgress,
  GateStatus,
  STATE_FILE,
  getStateManager,
} from "./persistence.js";
import { PhaseTracker } from "../phase-manager/phase-tracker.js";
import { artifactRegistry } from "../artifacts/registry.js";
import type { ArtifactType, ArtifactStatus } from "../artifacts/types.js";

export interface RecoveryResult {
  recovered: boolean;
  state: SessionState | null;
  message: string;
  details?: {
    phaseTracker?: PhaseTracker;
    artifactCount?: number;
    pipelineProgress?: PipelineProgress;
    gateStatuses?: GateStatus[];
  };
}

export interface UnfinishedSession {
  exists: boolean;
  valid: boolean;
  state: SessionState | null;
  age?: number;
  reason?: string;
}

/**
 * Get the default state file path
 */
export function getStatePath(): string {
  return join(process.cwd(), STATE_FILE);
}

/**
 * Detect if there is an unfinished session that needs recovery
 */
export function detectUnfinishedSession(): UnfinishedSession {
  const statePath = getStatePath();

  if (!existsSync(statePath)) {
    return {
      exists: false,
      valid: false,
      state: null,
      reason: "No state file found",
    };
  }

  try {
    const { readFileSync } = require("fs");
    const content = readFileSync(statePath, "utf-8");
    const state = JSON.parse(content) as SessionState;

    // Validate required fields
    if (!state.version || !state.savedAt) {
      return {
        exists: true,
        valid: false,
        state: null,
        reason: "Invalid state file format",
      };
    }

    // Check if session was marked as unfinished
    if (state.unfinished === false) {
      return {
        exists: true,
        valid: false,
        state: null,
        reason: "Session was completed, not unfinished",
      };
    }

    // Calculate age of state file
    const age = Date.now() - state.savedAt;

    return {
      exists: true,
      valid: true,
      state,
      age,
    };
  } catch (error) {
    return {
      exists: true,
      valid: false,
      state: null,
      reason: `Failed to parse state file: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Recover a session from STATE.json
 */
export function recoverSession(): RecoveryResult {
  const detection = detectUnfinishedSession();

  if (!detection.exists || !detection.valid || !detection.state) {
    return {
      recovered: false,
      state: null,
      message: detection.reason || "No unfinished session found",
    };
  }

  const state = detection.state;
  const stateManager = getStateManager();

  try {
    // Restore phase tracker
    let phaseTracker: PhaseTracker | undefined;
    if (state.phaseState) {
      phaseTracker = PhaseTracker.deserialize(state.phaseState);
    }

    // Restore artifact registry
    if (state.artifactRegistry) {
      artifactRegistry.clear();
      for (const artifactData of state.artifactRegistry.artifacts) {
        const content = typeof artifactData.artifact.content === 'string'
          ? artifactData.artifact.content
          : JSON.stringify(artifactData.artifact.content);
        artifactRegistry.register(
          {
            id: artifactData.artifact.frontmatter.id as string,
            type: artifactData.type as ArtifactType,
            content,
            version: artifactData.artifact.frontmatter.version as string,
            status: artifactData.artifact.frontmatter.status as ArtifactStatus,
            sourceWorkflow: artifactData.artifact.frontmatter.sourceWorkflow as string,
            dependsOn: artifactData.artifact.frontmatter.dependsOn as string[],
            owner: artifactData.artifact.frontmatter.owner as string,
          },
          artifactData.filePath
        );
      }
    }

    const artifactCount = state.artifactRegistry?.artifacts.length || 0;

    return {
      recovered: true,
      state,
      message: `Session recovered successfully. State from ${new Date(state.savedAt).toISOString()}.`,
      details: {
        phaseTracker,
        artifactCount,
        pipelineProgress: state.pipelineProgress,
        gateStatuses: state.gateStatuses,
      },
    };
  } catch (error) {
    return {
      recovered: false,
      state,
      message: `Recovery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Clear the STATE.json file (called on successful completion)
 */
export function clearState(): { success: boolean; message: string } {
  const statePath = getStatePath();

  if (!existsSync(statePath)) {
    return {
      success: true,
      message: "No state file to clear",
    };
  }

  try {
    unlinkSync(statePath);
    return {
      success: true,
      message: "State file cleared successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to clear state: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check if recovery is available and should be offered
 */
export function isRecoveryAvailable(): boolean {
  const detection = detectUnfinishedSession();
  return detection.exists && detection.valid;
}

/**
 * Get a summary of the unfinished session for display
 */
export function getUnfinishedSessionSummary(): {
  available: boolean;
  summary: string;
  age?: string;
  details?: {
    phaseCount?: number;
    artifactCount?: number;
    currentStage?: string | null;
    lastGateCheck?: string;
  };
} {
  const detection = detectUnfinishedSession();

  if (!detection.exists || !detection.valid || !detection.state) {
    return {
      available: false,
      summary: detection.reason || "No unfinished session",
    };
  }

  const state = detection.state;
  const age = detection.age ? formatAge(detection.age) : undefined;

  const phaseCount = state.phaseState?.phases.length;
  const artifactCount = state.artifactRegistry?.artifacts.length;
  const currentStage = state.pipelineProgress?.currentStage;
  const lastGateCheck = state.gateStatuses.length > 0
    ? new Date(state.gateStatuses[state.gateStatuses.length - 1].checkedAt).toISOString()
    : undefined;

  return {
    available: true,
    summary: `Unfinished session from ${new Date(state.savedAt).toLocaleString()}`,
    age,
    details: {
      phaseCount,
      artifactCount,
      currentStage,
      lastGateCheck,
    },
  };
}

/**
 * Format age in human-readable format
 */
function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
  }
}
