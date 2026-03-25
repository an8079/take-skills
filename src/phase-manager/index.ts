/**
 * Phase Manager
 *
 * Main module exporting all phase management components.
 *
 * Key improvements over get-shit-done:
 * - Explicit state machine with guards and hooks
 * - Stage gates with configurable criteria
 * - Formal approval workflows with audit trail
 * - Dependency tracking between phases
 * - Serializable state for persistence
 */

export {
  PhaseStateMachine,
  type PhaseStatus,
  type TransitionEvent,
  type StateMachineContext,
  createPhaseStateMachine,
  VALID_TRANSITIONS,
} from "./state-machine.js";

export { STAGE_GATES, type StageGate, PHASE_DISCUSS_GATE, PHASE_PLAN_GATE, PHASE_EXECUTE_GATE, PHASE_VERIFY_GATE } from "./stage-gates.js";
export { getGateForTransition, checkGate, formatGateReport } from "./stage-gates.js";
export { PhaseTracker, type Phase, type ProjectPhaseState, type PhaseTransitionRecord } from "./phase-tracker.js";
export { ApprovalWorkflow, type ApprovalRequest, type ApprovalPolicy } from "./approval-workflow.js";
