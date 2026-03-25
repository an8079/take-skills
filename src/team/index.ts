/**
 * Team Module - 团队协作核心
 *
 * Re-exports all team collaboration components.
 */

// Types
export type {
  TeamPipelinePhase,
  TaskStatus,
  TeamConfig,
  WorkerInfo,
  TeamRole,
  TeamTask,
  TeamState,
  TeamMessage,
  SharedMemory,
} from './types.js';

// State Management
export {
  initTeamState,
  readTeamState,
  writeTeamState,
  markTeamPhase,
  canTransitionTo,
  canEnterExec,
  canEnterVerify,
  isFixLoopExhausted,
  incrementFixAttempt,
} from './state.js';

// Paths
export { getTeamPaths, getWorkerPaths, getSessionPaths } from './paths.js';

// Task Management
export {
  createTask,
  getTask,
  listTasks,
  updateTask,
  claimTask,
  releaseTask,
  getTaskStats,
} from './task-manager.js';

// Team Pipeline
export { runTeamPipeline, transitionPhase, executePhase } from './pipeline.js';

// Message Router
export {
  sendMessage,
  broadcastMessage,
  sendShutdownRequest,
  sendShutdownResponse,
  getInboxMessages,
  clearInbox,
  getOutboxMessages,
  appendTeamEvent,
} from './message-router.js';

// Heartbeat
export {
  updateHeartbeat,
  getHeartbeat,
  getAllHeartbeats,
  isWorkerStale,
  getStaleWorkers,
  getTeamHealth,
  markWorkerReady,
  isWorkerReady,
} from './heartbeat.js';

// Shared Memory
export {
  initSharedMemory,
  readSharedMemory,
  updateSharedMemory,
  getSharedValue,
  setSharedValue,
  deleteSharedKey,
  clearSharedMemory,
} from './shared-memory.js';

// Progress Tracker
export { generateProgressReport, formatProgressReport } from './progress-tracker.js';
