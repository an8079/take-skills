/**
 * State Module
 *
 * Re-exports all state management components.
 */

export type {
  SessionState,
  PipelineProgress,
  GateStatus,
  SerializedArtifactRegistry,
} from "./persistence.js";
export {
  StateManager,
  STATE_FILE,
  getStateManager,
  createStateManager,
} from "./persistence.js";

export {
  detectUnfinishedSession,
  recoverSession,
  clearState,
  isRecoveryAvailable,
  getUnfinishedSessionSummary,
  getStatePath,
  type RecoveryResult,
  type UnfinishedSession,
} from "./recovery.js";
