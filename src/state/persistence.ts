/**
 * State Persistence Module
 *
 * Handles saving and loading the complete session state including:
 * - Phase state (PhaseTracker)
 * - Artifact registry
 * - Pipeline progress
 * - Gate status
 *
 * Auto-saves on phase transitions and artifact updates.
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { PhaseTracker, type ProjectPhaseState } from "../phase-manager/phase-tracker.js";
import { STAGE_GATES, type StageGate, type GateCheckResult } from "../phase-manager/stage-gates.js";
import { artifactRegistry } from "../artifacts/registry.js";
import type { ArtifactRegistryEntry, ArtifactType, ArtifactStatus } from "../artifacts/types.js";

export const STATE_FILE = "STATE.json";

export interface PipelineProgress {
  currentStage: string | null;
  completedStages: string[];
  stageHistory: Array<{
    stage: string;
    enteredAt: number;
    exitedAt: number | null;
    exitReason?: string;
  }>;
}

export interface GateStatus {
  gateId: string;
  passed: boolean;
  blockingCriteria: string[];
  warningCriteria: string[];
  checkedAt: number;
}

export interface SessionState {
  version: string;
  savedAt: number;
  phaseState: ProjectPhaseState | null;
  artifactRegistry: SerializedArtifactRegistry | null;
  pipelineProgress: PipelineProgress;
  gateStatuses: GateStatus[];
  unfinished: boolean;
}

export interface SerializedArtifactRegistry {
  artifacts: Array<{
    id: string;
    type: string;
    filePath: string;
    artifact: {
      frontmatter: Record<string, unknown>;
      content: string | Record<string, unknown>;
    };
    lastValidated: string;
  }>;
}

export class StateManager {
  private statePath: string;
  private autoSaveEnabled: boolean = true;
  private lastSave: number = 0;
  private phaseTracker: PhaseTracker | null = null;
  private onTransitionCallback: (() => void) | null = null;
  private onArtifactUpdateCallback: (() => void) | null = null;

  constructor(statePath?: string) {
    this.statePath = statePath || join(process.cwd(), STATE_FILE);
  }

  /**
   * Enable or disable auto-save
   */
  setAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
  }

  /**
   * Set the phase tracker to monitor for transitions
   */
  setPhaseTracker(tracker: PhaseTracker): void {
    this.phaseTracker = tracker;
  }

  /**
   * Register callback for phase transitions
   */
  onPhaseTransition(callback: () => void): void {
    this.onTransitionCallback = callback;
  }

  /**
   * Register callback for artifact updates
   */
  onArtifactUpdate(callback: () => void): void {
    this.onArtifactUpdateCallback = callback;
  }

  /**
   * Triggered when a phase transition occurs
   */
  notifyPhaseTransition(): void {
    if (this.autoSaveEnabled) {
      this.save();
    }
    this.onTransitionCallback?.();
  }

  /**
   * Triggered when an artifact is updated
   */
  notifyArtifactUpdate(): void {
    if (this.autoSaveEnabled) {
      this.save();
    }
    this.onArtifactUpdateCallback?.();
  }

  /**
   * Get the state file path
   */
  getStatePath(): string {
    return this.statePath;
  }

  /**
   * Check if state file exists
   */
  hasState(): boolean {
    return existsSync(this.statePath);
  }

  /**
   * Get the last save timestamp
   */
  getLastSave(): number {
    return this.lastSave;
  }

  /**
   * Serialize the artifact registry
   */
  private serializeArtifactRegistry(): SerializedArtifactRegistry {
    const entries = artifactRegistry.getAll();
    return {
      artifacts: entries.map((entry) => ({
        id: entry.artifact.frontmatter.id,
        type: entry.type,
        filePath: entry.filePath,
        artifact: {
          frontmatter: entry.artifact.frontmatter as unknown as Record<string, unknown>,
          content: entry.artifact.content,
        },
        lastValidated: entry.lastValidated,
      })),
    };
  }

  /**
   * Deserialize and restore artifact registry
   */
  private deserializeArtifactRegistry(data: SerializedArtifactRegistry): void {
    artifactRegistry.clear();
    for (const artifactData of data.artifacts) {
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

  /**
   * Save current state to disk
   */
  save(phaseState?: ProjectPhaseState | null, pipelineProgress?: PipelineProgress, gateStatuses?: GateStatus[]): void {
    const state: SessionState = {
      version: "1.0.0",
      savedAt: Date.now(),
      phaseState: phaseState !== undefined ? phaseState : (this.phaseTracker?.serialize() ?? null),
      artifactRegistry: this.serializeArtifactRegistry(),
      pipelineProgress: pipelineProgress || {
        currentStage: null,
        completedStages: [],
        stageHistory: [],
      },
      gateStatuses: gateStatuses || [],
      unfinished: true,
    };

    try {
      writeFileSync(this.statePath, JSON.stringify(state, null, 2), "utf-8");
      this.lastSave = state.savedAt;
    } catch (error) {
      console.error("Failed to save state:", error);
      throw error;
    }
  }

  /**
   * Load state from disk
   */
  load(): SessionState | null {
    if (!this.hasState()) {
      return null;
    }

    try {
      const content = readFileSync(this.statePath, "utf-8");
      const state = JSON.parse(content) as SessionState;
      return state;
    } catch (error) {
      console.error("Failed to load state:", error);
      return null;
    }
  }

  /**
   * Load and restore state into live objects
   */
  restore(): {
    phaseTracker: PhaseTracker | null;
    artifactRegistryRestored: boolean;
    pipelineProgress: PipelineProgress | null;
    gateStatuses: GateStatus[];
  } {
    const state = this.load();

    if (!state) {
      return {
        phaseTracker: null,
        artifactRegistryRestored: false,
        pipelineProgress: null,
        gateStatuses: [],
      };
    }

    // Restore phase tracker
    let phaseTracker: PhaseTracker | null = null;
    if (state.phaseState) {
      phaseTracker = PhaseTracker.deserialize(state.phaseState);
    }

    // Restore artifact registry
    if (state.artifactRegistry) {
      this.deserializeArtifactRegistry(state.artifactRegistry);
    }

    return {
      phaseTracker,
      artifactRegistryRestored: !!state.artifactRegistry,
      pipelineProgress: state.pipelineProgress,
      gateStatuses: state.gateStatuses,
    };
  }

  /**
   * Clear the state file (on successful completion)
   */
  clear(): void {
    if (existsSync(this.statePath)) {
      try {
        const fs = require("fs");
        fs.unlinkSync(this.statePath);
      } catch (error) {
        console.error("Failed to clear state:", error);
        throw error;
      }
    }
  }

  /**
   * Mark session as complete and clear state
   */
  complete(): void {
    this.clear();
  }
}

// Singleton instance for global use
let globalStateManager: StateManager | null = null;

export function getStateManager(): StateManager {
  if (!globalStateManager) {
    globalStateManager = new StateManager();
  }
  return globalStateManager;
}

export function createStateManager(statePath?: string): StateManager {
  globalStateManager = new StateManager(statePath);
  return globalStateManager;
}
