/**
 * Artifact Writer
 * Write artifacts with standardized frontmatter to filesystem
 * @module artifacts/writer
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Artifact, ArtifactFrontmatter } from './types';
import { serializeFrontmatter } from './loader';

/**
 * Options for writing an artifact
 */
export interface WriteArtifactOptions {
  /** Artifact to write */
  artifact: Artifact;
  /** Target file path */
  filePath: string;
  /** Create parent directories if they don't exist */
  createDirs?: boolean;
}

/**
 * Write an artifact to disk with frontmatter
 * @param artifact - The artifact to write
 * @param filePath - Target file path
 */
export async function writeArtifact(
  artifact: Artifact,
  filePath: string
): Promise<void> {
  const frontmatter = serializeFrontmatter(artifact.frontmatter);
  const isJson = filePath.endsWith('.json');

  let content: string;
  if (isJson && typeof artifact.content === 'object') {
    // For JSON artifacts, serialize content as JSON after frontmatter
    const jsonContent = JSON.stringify(artifact.content, null, 2);
    content = `${frontmatter}\n${jsonContent}`;
  } else {
    content = `${frontmatter}\n${artifact.content}`;
  }

  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Write multiple artifacts in batch
 * @param artifacts - Array of artifact write options
 */
export async function writeArtifacts(
  artifacts: WriteArtifactOptions[]
): Promise<void> {
  await Promise.all(
    artifacts.map(({ artifact, filePath, createDirs }) =>
      writeArtifactWithOptions({ artifact, filePath, createDirs })
    )
  );
}

/**
 * Write artifact with additional options
 */
async function writeArtifactWithOptions(options: WriteArtifactOptions): Promise<void> {
  const { artifact, filePath, createDirs = true } = options;

  if (createDirs) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  await writeArtifact(artifact, filePath);
}

/**
 * Update an existing artifact's content and timestamp
 * @param filePath - Path to existing artifact
 * @param updates - Partial updates to apply
 */
export async function updateArtifact(
  filePath: string,
  updates: {
    content?: string;
    status?: Artifact['frontmatter']['status'];
    owner?: string;
    approvalState?: Artifact['frontmatter']['approvalState'];
  }
): Promise<Artifact> {
  const { loadArtifact } = await import('./loader');

  const artifact = await loadArtifact(filePath);

  if (updates.content !== undefined) {
    artifact.content = updates.content;
  }

  artifact.frontmatter.updatedAt = new Date().toISOString();

  if (updates.status !== undefined) {
    artifact.frontmatter.status = updates.status;
  }

  if (updates.owner !== undefined) {
    artifact.frontmatter.owner = updates.owner;
  }

  if (updates.approvalState !== undefined) {
    artifact.frontmatter.approvalState = updates.approvalState;
  }

  await writeArtifact(artifact, filePath);

  return artifact;
}

/**
 * Create a new artifact with frontmatter
 * @param options - Artifact creation options
 */
export async function createArtifact(options: {
  id: string;
  type: string;
  sourceWorkflow: string;
  owner: string;
  content: string;
  version?: string;
  status?: Artifact['frontmatter']['status'];
  dependsOn?: string[];
}): Promise<Artifact> {
  const now = new Date().toISOString();

  const frontmatter: ArtifactFrontmatter = {
    id: options.id,
    version: options.version || '1.0.0',
    status: options.status || 'draft',
    createdAt: now,
    updatedAt: now,
    sourceWorkflow: options.sourceWorkflow,
    dependsOn: options.dependsOn || [],
    owner: options.owner,
    approvalState: 'pending',
  };

  const artifact: Artifact = {
    frontmatter,
    content: options.content,
  } as Artifact;

  return artifact;
}
