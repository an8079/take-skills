/**
 * Governance Module
 *
 * Process control, audit logging, compliance checking, and mode management.
 * Ensures disciplined execution with full traceability.
 */

export { ProcessController, type ProcessConfig, type ProcessMode, type ProcessViolation } from "./process-controller.js";
export { AuditLog, type AuditEntry } from "./audit-log.js";

// Governance Modes
export {
  type GovernanceMode,
  type GateStrictness,
  type PhaseName,
  type ModeConfig,
  type ArtifactRequirement,
  GOVERNANCE_MODES,
  LITE_MODE,
  STANDARD_MODE,
  STRICT_MODE,
  getMode,
  isValidMode,
  getDefaultMode,
} from "./modes.js";

// Mode Context
export {
  ModeContext,
  type ModeTransitionEvent,
  type ModeContextOptions,
  createModeContext,
  createLiteContext,
  createStandardContext,
  createStrictContext,
} from "./mode-context.js";
