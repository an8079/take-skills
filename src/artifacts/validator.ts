/**
 * Artifact Validator
 * Validate artifact frontmatter and content integrity
 * @module artifacts/validator
 */

import type {
  Artifact,
  ArtifactFrontmatter,
  ArtifactType,
  ApprovalState,
  ArtifactStatus,
} from './types';
import {
  FRONTMATTER_REQUIRED_FIELDS,
  VALID_STATUSES,
  VALID_APPROVAL_STATES,
} from './types';

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate frontmatter required fields
 */
export function validateFrontmatterRequiredFields(
  frontmatter: Record<string, unknown>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of FRONTMATTER_REQUIRED_FIELDS) {
    if (frontmatter[field] === undefined || frontmatter[field] === null) {
      errors.push({
        field,
        message: `Missing required frontmatter field: ${field}`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Validate frontmatter field types
 */
export function validateFrontmatterTypes(
  frontmatter: Record<string, unknown>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // id must be string
  if (typeof frontmatter.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Field "id" must be a string',
      severity: 'error',
    });
  }

  // version must be string (semver format recommended)
  if (typeof frontmatter.version !== 'string') {
    errors.push({
      field: 'version',
      message: 'Field "version" must be a string',
      severity: 'error',
    });
  }

  // status must be valid enum value
  if (!VALID_STATUSES.includes(frontmatter.status as ArtifactStatus)) {
    errors.push({
      field: 'status',
      message: `Field "status" must be one of: ${VALID_STATUSES.join(', ')}`,
      severity: 'error',
    });
  }

  // createdAt must be ISO date string
  if (typeof frontmatter.createdAt !== 'string' || isNaN(Date.parse(frontmatter.createdAt as string))) {
    errors.push({
      field: 'createdAt',
      message: 'Field "createdAt" must be a valid ISO 8601 date string',
      severity: 'error',
    });
  }

  // updatedAt must be ISO date string
  if (typeof frontmatter.updatedAt !== 'string' || isNaN(Date.parse(frontmatter.updatedAt as string))) {
    errors.push({
      field: 'updatedAt',
      message: 'Field "updatedAt" must be a valid ISO 8601 date string',
      severity: 'error',
    });
  }

  // sourceWorkflow must be string
  if (typeof frontmatter.sourceWorkflow !== 'string') {
    errors.push({
      field: 'sourceWorkflow',
      message: 'Field "sourceWorkflow" must be a string',
      severity: 'error',
    });
  }

  // dependsOn must be array
  if (!Array.isArray(frontmatter.dependsOn)) {
    errors.push({
      field: 'dependsOn',
      message: 'Field "dependsOn" must be an array',
      severity: 'error',
    });
  } else {
    // All dependsOn items must be strings
    for (let i = 0; i < frontmatter.dependsOn.length; i++) {
      if (typeof frontmatter.dependsOn[i] !== 'string') {
        errors.push({
          field: `dependsOn[${i}]`,
          message: 'All items in "dependsOn" must be strings',
          severity: 'error',
        });
      }
    }
  }

  // owner must be string
  if (typeof frontmatter.owner !== 'string') {
    errors.push({
      field: 'owner',
      message: 'Field "owner" must be a string',
      severity: 'error',
    });
  }

  // approvalState must be valid enum value
  if (!VALID_APPROVAL_STATES.includes(frontmatter.approvalState as ApprovalState)) {
    errors.push({
      field: 'approvalState',
      message: `Field "approvalState" must be one of: ${VALID_APPROVAL_STATES.join(', ')}`,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate artifact filename matches type
 */
export function validateArtifactFilename(
  filePath: string,
  expectedType: ArtifactType
): ValidationError[] {
  const errors: ValidationError[] = [];
  const filename = filePath.split(/[\\/]/).pop() || '';

  const typePatterns: Record<ArtifactType, RegExp> = {
    'PROJECT': /^PROJECT\.md$/,
    'REQUIREMENTS': /^REQUIREMENTS\.md$/,
    'SPEC': /^SPEC\.md$/,
    'PLAN': /^PLAN\.md$/,
    'ROADMAP': /^ROADMAP\.md$/,
    'PHASE-0-CONTEXT': /^PHASE-\d+-CONTEXT\.md$/,
    'PHASE-0-PLAN': /^PHASE-\d+-PLAN\.md$/,
    'EXECUTION-STATE': /^EXECUTION-STATE\.json$/,
    'EXECUTION-LOG': /^EXECUTION-LOG\.json$/,
    'VERIFICATION': /^VERIFICATION\.md$/,
    'QA-REPORT': /^QA-REPORT\.md$/,
    'RELEASE': /^RELEASE\.md$/,
    'RETRO': /^RETRO\.md$/,
  };

  const pattern = typePatterns[expectedType];
  if (pattern && !pattern.test(filename)) {
    errors.push({
      field: 'filename',
      message: `Filename "${filename}" does not match expected type "${expectedType}"`,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate semantic version format
 */
export function validateSemver(version: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;

  if (!semverRegex.test(version)) {
    errors.push({
      field: 'version',
      message: `Version "${version}" is not valid semver format (expected: major.minor.patch)`,
      severity: 'warning',
    });
  }

  return errors;
}

/**
 * Validate timestamp ordering (createdAt <= updatedAt)
 */
export function validateTimestampOrdering(
  frontmatter: ArtifactFrontmatter
): ValidationError[] {
  const errors: ValidationError[] = [];

  const createdAt = new Date(frontmatter.createdAt);
  const updatedAt = new Date(frontmatter.updatedAt);

  if (updatedAt < createdAt) {
    errors.push({
      field: 'updatedAt',
      message: 'Field "updatedAt" cannot be earlier than "createdAt"',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Full artifact validation
 */
export function validateArtifact(
  artifact: Artifact,
  options?: {
    filename?: string;
    expectedType?: ArtifactType;
  }
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate required fields
  errors.push(...validateFrontmatterRequiredFields(artifact.frontmatter as unknown as Record<string, unknown>));

  // Validate field types
  errors.push(...validateFrontmatterTypes(artifact.frontmatter as unknown as Record<string, unknown>));

  // Validate timestamps
  errors.push(...validateTimestampOrdering(artifact.frontmatter as unknown as ArtifactFrontmatter));

  // Validate semver format
  warnings.push(...validateSemver(artifact.frontmatter.version));

  // Validate filename matches type if provided
  if (options?.filename && options?.expectedType) {
    errors.push(...validateArtifactFilename(options.filename, options.expectedType));
  }

  // Content validation for JSON artifacts
  const isJsonArtifact = artifact.content && typeof artifact.content === 'object' && !Array.isArray(artifact.content);
  if (isJsonArtifact && typeof artifact.content !== 'object') {
    errors.push({
      field: 'content',
      message: 'JSON artifact content must be an object',
      severity: 'error',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate artifact dependencies exist
 */
export function validateDependencies(
  artifact: Artifact,
  existingIds: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const deps = artifact.frontmatter.dependsOn;

  for (const depId of deps) {
    if (!existingIds.includes(depId)) {
      errors.push({
        field: 'dependsOn',
        message: `Dependency "${depId}" does not exist in registry`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Check if artifact has circular dependencies
 */
export function detectCircularDependencies(
  artifact: Artifact,
  getDependencies: (id: string) => string[]
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(id: string, path: string[]): void {
    visited.add(id);
    recursionStack.add(id);
    path.push(id);

    for (const depId of getDependencies(id)) {
      if (!visited.has(depId)) {
        dfs(depId, [...path]);
      } else if (recursionStack.has(depId)) {
        // Found cycle
        const cycleStart = path.indexOf(depId);
        cycles.push([...path.slice(cycleStart), depId]);
      }
    }

    recursionStack.delete(id);
  }

  dfs(artifact.frontmatter.id, []);

  return cycles;
}
