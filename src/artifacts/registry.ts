/**
 * Artifact Registry
 * Central registry for tracking all project artifacts
 * @module artifacts/registry
 */

import type {
  Artifact,
  ArtifactRegistryEntry,
  ArtifactType,
  CreateArtifactOptions,
} from './types';
import { writeArtifact } from './writer';
import { validateArtifact } from './validator';

/**
 * In-memory artifact registry
 */
class ArtifactRegistry {
  private artifacts: Map<string, ArtifactRegistryEntry> = new Map();

  /**
   * Register a new artifact or update existing one
   */
  register(options: CreateArtifactOptions, filePath: string): ArtifactRegistryEntry {
    const now = new Date().toISOString();

    const artifact: Artifact = {
      frontmatter: {
        id: options.id,
        version: options.version || '1.0.0',
        status: options.status || 'draft',
        createdAt: now,
        updatedAt: now,
        sourceWorkflow: options.sourceWorkflow as Artifact['frontmatter']['sourceWorkflow'],
        dependsOn: options.dependsOn || [],
        owner: options.owner,
        approvalState: 'pending',
      },
      content: options.content,
    };

    const entry: ArtifactRegistryEntry = {
      artifact,
      filePath,
      type: options.type,
      lastValidated: now,
    };

    this.artifacts.set(options.id, entry);
    return entry;
  }

  /**
   * Get an artifact by ID
   */
  get(id: string): ArtifactRegistryEntry | undefined {
    return this.artifacts.get(id);
  }

  /**
   * Get all registered artifacts
   */
  getAll(): ArtifactRegistryEntry[] {
    return Array.from(this.artifacts.values());
  }

  /**
   * Get artifacts by type
   */
  getByType(type: ArtifactType): ArtifactRegistryEntry[] {
    return this.getAll().filter((entry) => entry.type === type);
  }

  /**
   * Get artifacts by owner
   */
  getByOwner(owner: string): ArtifactRegistryEntry[] {
    return this.getAll().filter((entry) => entry.artifact.frontmatter.owner === owner);
  }

  /**
   * Get artifacts by status
   */
  getByStatus(status: string): ArtifactRegistryEntry[] {
    return this.getAll().filter((entry) => entry.artifact.frontmatter.status === status);
  }

  /**
   * Get artifacts by approval state
   */
  getByApprovalState(approvalState: string): ArtifactRegistryEntry[] {
    return this.getAll().filter(
      (entry) => entry.artifact.frontmatter.approvalState === approvalState
    );
  }

  /**
   * Get dependencies of an artifact
   */
  getDependencies(id: string): ArtifactRegistryEntry[] {
    const entry = this.artifacts.get(id);
    if (!entry) return [];

    return entry.artifact.frontmatter.dependsOn
      .map((depId) => this.artifacts.get(depId))
      .filter((dep): dep is ArtifactRegistryEntry => dep !== undefined);
  }

  /**
   * Get dependents of an artifact (artifacts that depend on this one)
   */
  getDependents(id: string): ArtifactRegistryEntry[] {
    return this.getAll().filter((entry) =>
      entry.artifact.frontmatter.dependsOn.includes(id)
    );
  }

  /**
   * Update an artifact's status
   */
  updateStatus(id: string, status: string): boolean {
    const entry = this.artifacts.get(id);
    if (!entry) return false;

    entry.artifact.frontmatter.status = status as any;
    entry.artifact.frontmatter.updatedAt = new Date().toISOString();
    entry.lastValidated = new Date().toISOString();
    return true;
  }

  /**
   * Update an artifact's approval state
   */
  updateApprovalState(id: string, approvalState: string): boolean {
    const entry = this.artifacts.get(id);
    if (!entry) return false;

    entry.artifact.frontmatter.approvalState = approvalState as any;
    entry.artifact.frontmatter.updatedAt = new Date().toISOString();
    entry.lastValidated = new Date().toISOString();
    return true;
  }

  /**
   * Remove an artifact from registry
   */
  unregister(id: string): boolean {
    return this.artifacts.delete(id);
  }

  /**
   * Clear all artifacts from registry
   */
  clear(): void {
    this.artifacts.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byApprovalState: Record<string, number>;
  } {
    const entries = this.getAll();
    const stats = {
      total: entries.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byApprovalState: {} as Record<string, number>,
    };

    for (const entry of entries) {
      const type = entry.type;
      const status = entry.artifact.frontmatter.status;
      const approval = entry.artifact.frontmatter.approvalState;

      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      stats.byApprovalState[approval] = (stats.byApprovalState[approval] || 0) + 1;
    }

    return stats;
  }

  /**
   * Persist artifact to disk and register it
   */
  async save(options: CreateArtifactOptions, filePath: string): Promise<ArtifactRegistryEntry> {
    const entry = this.register(options, filePath);
    await writeArtifact(entry.artifact, filePath);
    return entry;
  }
}

/**
 * Singleton instance of the artifact registry
 */
export const artifactRegistry = new ArtifactRegistry();

export { ArtifactRegistry };
