/**
 * Artifact System Type Definitions
 * Standardized frontmatter schema and artifact type definitions for project artifacts
 * @module artifacts/types
 */

/**
 * Standard artifact statuses
 */
export type ArtifactStatus = 'draft' | 'active' | 'archived';

/**
 * Artifact approval states
 */
export type ApprovalState = 'pending' | 'approved' | 'rejected';

/**
 * Standard artifact types with their naming conventions
 */
export type ArtifactType =
  | 'PROJECT'
  | 'REQUIREMENTS'
  | 'SPEC'
  | 'PLAN'
  | 'ROADMAP'
  | `PHASE-${number}-CONTEXT`
  | `PHASE-${number}-PLAN`
  | 'EXECUTION-STATE'
  | 'EXECUTION-LOG'
  | 'VERIFICATION'
  | 'QA-REPORT'
  | 'RELEASE'
  | 'RETRO'
  | 'DEPLOYMENT';

/**
 * Frontmatter schema for all artifacts
 * @description Every artifact must have these fields in its frontmatter
 */
export interface ArtifactFrontmatter {
  /** Unique identifier for the artifact */
  id: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Current status of the artifact */
  status: ArtifactStatus;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last update timestamp */
  updatedAt: string;
  /** Source workflow that generated this artifact */
  sourceWorkflow: string;
  /** Array of artifact IDs this artifact depends on */
  dependsOn: string[];
  /** Owner/responsible person for this artifact */
  owner: string;
  /** Current approval state */
  approvalState: ApprovalState;
}

/**
 * Base artifact interface
 */
export interface BaseArtifact {
  frontmatter: ArtifactFrontmatter;
  /** Raw content without frontmatter - string for MD, object for JSON */
  content: string | Record<string, unknown>;
}

/**
 * Project artifact - PROJECT.md
 */
export interface ProjectArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Requirements artifact - REQUIREMENTS.md
 */
export interface RequirementsArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Specification artifact - SPEC.md
 */
export interface SpecArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Plan artifact - PLAN.md
 */
export interface PlanArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Roadmap artifact - ROADMAP.md
 */
export interface RoadmapArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Phase context artifact - PHASE-{n}-CONTEXT.md
 */
export interface PhaseContextArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter & {
    phase?: number;
  };
}

/**
 * Phase plan artifact - PHASE-{n}-PLAN.md
 */
export interface PhasePlanArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter & {
    phase?: number;
  };
}

/**
 * Execution state artifact - EXECUTION-STATE.json
 */
export interface ExecutionStateArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
  content: Record<string, unknown>;
}

/**
 * Execution log artifact - EXECUTION-LOG.md
 */
export interface ExecutionLogArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Verification artifact - VERIFICATION.md
 */
export interface VerificationArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * QA Report artifact - QA-REPORT.md
 */
export interface QAReportArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Release artifact - RELEASE.md
 */
export interface ReleaseArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Retrospective artifact - RETRO.md
 */
export interface RetroArtifact extends BaseArtifact {
  frontmatter: ArtifactFrontmatter;
}

/**
 * Union type of all artifact types
 */
export type Artifact =
  | ProjectArtifact
  | RequirementsArtifact
  | SpecArtifact
  | PlanArtifact
  | RoadmapArtifact
  | PhaseContextArtifact
  | PhasePlanArtifact
  | ExecutionStateArtifact
  | ExecutionLogArtifact
  | VerificationArtifact
  | QAReportArtifact
  | ReleaseArtifact
  | RetroArtifact;

/**
 * Artifact registration entry
 */
export interface ArtifactRegistryEntry {
  artifact: Artifact;
  filePath: string;
  type: ArtifactType;
  lastValidated: string;
}

/**
 * Options for creating a new artifact
 */
export interface CreateArtifactOptions {
  type: ArtifactType;
  id: string;
  version?: string;
  status?: ArtifactStatus;
  sourceWorkflow: string;
  dependsOn?: string[];
  owner: string;
  content: string;
}

/**
 * Frontmatter schema for validation
 */
export const FRONTMATTER_REQUIRED_FIELDS: (keyof ArtifactFrontmatter)[] = [
  'id',
  'version',
  'status',
  'createdAt',
  'updatedAt',
  'sourceWorkflow',
  'dependsOn',
  'owner',
  'approvalState',
];

/**
 * Valid artifact statuses
 */
export const VALID_STATUSES: ArtifactStatus[] = ['draft', 'active', 'archived'];

/**
 * Valid approval states
 */
export const VALID_APPROVAL_STATES: ApprovalState[] = ['pending', 'approved', 'rejected'];

/**
 * Standard artifact file naming patterns
 */
export const ARTIFACT_FILE_PATTERNS: Record<ArtifactType, RegExp> = {
  'PROJECT': /^PROJECT\.md$/,
  'REQUIREMENTS': /^REQUIREMENTS\.md$/,
  'SPEC': /^SPEC\.md$/,
  'PLAN': /^PLAN\.md$/,
  'ROADMAP': /^ROADMAP\.md$/,
  'PHASE-0-CONTEXT': /^PHASE-0-CONTEXT\.md$/,
  'PHASE-0-PLAN': /^PHASE-0-PLAN\.md$/,
  'EXECUTION-STATE': /^EXECUTION-STATE\.json$/,
  'EXECUTION-LOG': /^EXECUTION-LOG\.md$/,
  'VERIFICATION': /^VERIFICATION\.md$/,
  'QA-REPORT': /^QA-REPORT\.md$/,
  'RELEASE': /^RELEASE\.md$/,
  'RETRO': /^RETRO\.md$/,
  'DEPLOYMENT': /^DEPLOYMENT\.md$/,
};
