/**
 * Artifact System
 * Standardized artifact management with frontmatter schema
 * @module artifacts
 *
 * @example
 * import { createArtifact, writeArtifact, loadArtifact, validateArtifact, artifactRegistry } from './artifacts';
 *
 * // Create and save a new artifact
 * const artifact = await createArtifact({
 *   id: 'REQ-001',
 *   type: 'REQUIREMENTS',
 *   sourceWorkflow: 'requirements-gathering',
 *   owner: 'product-owner',
 *   content: '# Requirements\n\nFeature description...'
 * });
 *
 * await writeArtifact(artifact, './REQUIREMENTS.md');
 *
 * // Load and validate
 * const loaded = await loadArtifact('./REQUIREMENTS.md');
 * const result = validateArtifact(loaded);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 *
 * // Register and track
 * artifactRegistry.register({ ... }, './REQUIREMENTS.md');
 * const deps = artifactRegistry.getDependencies('REQ-001');
 */

export * from './types';
export * from './loader';
export * from './writer';
export * from './validator';
export * from './registry';
