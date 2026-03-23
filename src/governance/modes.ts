/**
 * Governance Modes
 *
 * Three-tier governance configuration: lite, standard, strict.
 * Controls gate strictness, artifact requirements, audit depth, and team features.
 */

export type GovernanceMode = "lite" | "standard" | "strict" | "enterprise";

export type UserRole = "admin" | "developer" | "viewer";

export interface ModeCapabilities {
  auditFileLogging: boolean;
  complianceCheckHooks: boolean;
  roleBasedAccess: boolean;
  multiAgentCoordination: boolean;
  approvalWorkflows: boolean;
  autoEscalation: boolean;
  requireCodeSignoff: boolean;
  requireSecurityReview: boolean;
  blockOnVulnerabilities: boolean;
  maxActivePhases: number;
  allowSkipPhases: boolean;
}

export type GateStrictness = "none" | "warning" | "required";

export type PhaseName = "interview" | "spec" | "plan" | "execute" | "review" | "qa" | "ship";

export interface GateConfig {
  interview: GateStrictness;
  spec: GateStrictness;
  plan: GateStrictness;
  execute: GateStrictness;
  review: GateStrictness;
  qa: GateStrictness;
  ship: GateStrictness;
}

export interface ArtifactRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

export interface ModeConfig {
  id: GovernanceMode;
  name: string;
  description: string;
  gates: GateConfig;
  artifacts: {
    minRequired: ArtifactRequirement[];
    optional: ArtifactRequirement[];
  };
  audit: {
    enabled: boolean;
    logPhaseTransitions: boolean;
    logApprovals: boolean;
    logGateViolations: boolean;
    logConfigChanges: boolean;
    logTeamEvents: boolean;
  };
  security: {
    enabled: boolean;
    requireCodeSignoff: boolean;
    requireSecurityReview: boolean;
    blockOnVulnerabilities: boolean;
  };
  teamFeatures: {
    enabled: boolean;
    multiAgentCoordination: boolean;
    roleEnforcement: boolean;
    approvalWorkflows: boolean;
    autoEscalation: boolean;
  };
  process: {
    allowSkipPhases: boolean;
    maxActivePhases: number;
    autoAdvance: boolean;
    requireExplicitComplete: boolean;
  };
}

// ---------------------------------------------------------------------------
// Artifact Definitions
// ---------------------------------------------------------------------------

const CORE_ARTIFACTS: ArtifactRequirement[] = [
  { id: "context", name: "CONTEXT.md", description: "Phase context and decisions", required: true },
  { id: "spec", name: "SPEC.md", description: "Specification document", required: true },
];

const STANDARD_ARTIFACTS: ArtifactRequirement[] = [
  ...CORE_ARTIFACTS,
  { id: "plan", name: "PLAN.md", description: "Implementation plan", required: true },
  { id: "test-results", name: "Test Results", description: "Test execution results", required: true },
  { id: "review-notes", name: "Review Notes", description: "Code review findings", required: true },
];

const STRICT_ARTIFACTS: ArtifactRequirement[] = [
  ...STANDARD_ARTIFACTS,
  { id: "security-scan", name: "Security Scan Report", description: "Security vulnerability scan", required: true },
  { id: "audit-trail", name: "Audit Trail", description: "Complete decision audit trail", required: true },
  { id: "signoff", name: "Sign-off Records", description: "Formal approval sign-offs", required: true },
  { id: "threat-model", name: "Threat Model", description: "Security threat assessment", required: false },
  { id: "performance-bench", name: "Performance Benchmarks", description: "Performance test results", required: false },
];

const OPTIONAL_ARTIFACTS: ArtifactRequirement[] = [
  { id: "architecture-diagram", name: "Architecture Diagram", description: "Visual architecture representation", required: false },
  { id: "api-contract", name: "API Contract", description: "API specification", required: false },
  { id: "database-schema", name: "Database Schema", description: "Schema documentation", required: false },
  { id: "deployment-guide", name: "Deployment Guide", description: "Deployment instructions", required: false },
];

// ---------------------------------------------------------------------------
// Lite Mode - Minimal governance for quick iterations
// ---------------------------------------------------------------------------

export const LITE_MODE: ModeConfig = {
  id: "lite",
  name: "Lite",
  description: "Minimal governance for rapid iterations. Few gates, reduced artifacts.",

  gates: {
    interview: "warning",
    spec: "warning",
    plan: "none",
    execute: "none",
    review: "warning",
    qa: "warning",
    ship: "none",
  },

  artifacts: {
    minRequired: CORE_ARTIFACTS,
    optional: OPTIONAL_ARTIFACTS,
  },

  audit: {
    enabled: false,
    logPhaseTransitions: false,
    logApprovals: false,
    logGateViolations: false,
    logConfigChanges: false,
    logTeamEvents: false,
  },

  security: {
    enabled: false,
    requireCodeSignoff: false,
    requireSecurityReview: false,
    blockOnVulnerabilities: false,
  },

  teamFeatures: {
    enabled: false,
    multiAgentCoordination: false,
    roleEnforcement: false,
    approvalWorkflows: false,
    autoEscalation: false,
  },

  process: {
    allowSkipPhases: true,
    maxActivePhases: 3,
    autoAdvance: true,
    requireExplicitComplete: false,
  },
};

// ---------------------------------------------------------------------------
// Standard Mode - Balanced governance for most projects
// ---------------------------------------------------------------------------

export const STANDARD_MODE: ModeConfig = {
  id: "standard",
  name: "Standard",
  description: "Balanced governance with core gates enforced. Suitable for most projects.",

  gates: {
    interview: "required",
    spec: "required",
    plan: "required",
    execute: "warning",
    review: "required",
    qa: "required",
    ship: "required",
  },

  artifacts: {
    minRequired: STANDARD_ARTIFACTS,
    optional: OPTIONAL_ARTIFACTS,
  },

  audit: {
    enabled: true,
    logPhaseTransitions: true,
    logApprovals: true,
    logGateViolations: true,
    logConfigChanges: true,
    logTeamEvents: false,
  },

  security: {
    enabled: true,
    requireCodeSignoff: true,
    requireSecurityReview: false,
    blockOnVulnerabilities: true,
  },

  teamFeatures: {
    enabled: true,
    multiAgentCoordination: true,
    roleEnforcement: false,
    approvalWorkflows: true,
    autoEscalation: false,
  },

  process: {
    allowSkipPhases: false,
    maxActivePhases: 1,
    autoAdvance: false,
    requireExplicitComplete: true,
  },
};

// ---------------------------------------------------------------------------
// Strict Mode - Full governance for security-sensitive or compliance projects
// ---------------------------------------------------------------------------

export const STRICT_MODE: ModeConfig = {
  id: "strict",
  name: "Strict",
  description: "Full governance with complete audit trail, security gates, and formal approvals.",

  gates: {
    interview: "required",
    spec: "required",
    plan: "required",
    execute: "required",
    review: "required",
    qa: "required",
    ship: "required",
  },

  artifacts: {
    minRequired: STRICT_ARTIFACTS,
    optional: OPTIONAL_ARTIFACTS,
  },

  audit: {
    enabled: true,
    logPhaseTransitions: true,
    logApprovals: true,
    logGateViolations: true,
    logConfigChanges: true,
    logTeamEvents: true,
  },

  security: {
    enabled: true,
    requireCodeSignoff: true,
    requireSecurityReview: true,
    blockOnVulnerabilities: true,
  },

  teamFeatures: {
    enabled: true,
    multiAgentCoordination: true,
    roleEnforcement: true,
    approvalWorkflows: true,
    autoEscalation: true,
  },

  process: {
    allowSkipPhases: false,
    maxActivePhases: 1,
    autoAdvance: false,
    requireExplicitComplete: true,
  },
};

// ---------------------------------------------------------------------------
// Mode Registry
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Enterprise Mode - Full governance with audit logging, compliance, and RBAC
// ---------------------------------------------------------------------------

export const ENTERPRISE_MODE: ModeConfig = {
  id: "enterprise",
  name: "Enterprise",
  description: "Maximum governance with audit file logging, compliance hooks, and role-based access control.",

  gates: {
    interview: "required",
    spec: "required",
    plan: "required",
    execute: "required",
    review: "required",
    qa: "required",
    ship: "required",
  },

  artifacts: {
    minRequired: STRICT_ARTIFACTS,
    optional: OPTIONAL_ARTIFACTS,
  },

  audit: {
    enabled: true,
    logPhaseTransitions: true,
    logApprovals: true,
    logGateViolations: true,
    logConfigChanges: true,
    logTeamEvents: true,
  },

  security: {
    enabled: true,
    requireCodeSignoff: true,
    requireSecurityReview: true,
    blockOnVulnerabilities: true,
  },

  teamFeatures: {
    enabled: true,
    multiAgentCoordination: true,
    roleEnforcement: true,
    approvalWorkflows: true,
    autoEscalation: true,
  },

  process: {
    allowSkipPhases: false,
    maxActivePhases: 1,
    autoAdvance: false,
    requireExplicitComplete: true,
  },
};

export const GOVERNANCE_MODES: Record<GovernanceMode, ModeConfig> = {
  lite: LITE_MODE,
  standard: STANDARD_MODE,
  strict: STRICT_MODE,
  enterprise: ENTERPRISE_MODE,
};

export function getMode(mode: GovernanceMode): ModeConfig {
  return GOVERNANCE_MODES[mode];
}

export function isValidMode(mode: string): mode is GovernanceMode {
  return mode === "lite" || mode === "standard" || mode === "strict" || mode === "enterprise";
}

export function getCapabilities(mode: GovernanceMode): ModeCapabilities {
  const config = GOVERNANCE_MODES[mode];
  return {
    auditFileLogging: config.id === "enterprise",
    complianceCheckHooks: config.id === "enterprise",
    roleBasedAccess: config.teamFeatures.roleEnforcement,
    multiAgentCoordination: config.teamFeatures.multiAgentCoordination,
    approvalWorkflows: config.teamFeatures.approvalWorkflows,
    autoEscalation: config.teamFeatures.autoEscalation,
    requireCodeSignoff: config.security.requireCodeSignoff,
    requireSecurityReview: config.security.requireSecurityReview,
    blockOnVulnerabilities: config.security.blockOnVulnerabilities,
    maxActivePhases: config.process.maxActivePhases,
    allowSkipPhases: config.process.allowSkipPhases,
  };
}

export function getDefaultMode(): ModeConfig {
  return STANDARD_MODE;
}
