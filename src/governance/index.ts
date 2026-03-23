/**
 * Governance Module
 *
 * Process control, audit logging, and compliance checking.
 * Ensures disciplined execution with full traceability.
 */

export { ProcessController, type ProcessConfig, type ProcessMode, type ProcessViolation } from "./process-controller.js";
export { AuditLog, type AuditEntry } from "./audit-log.js";
