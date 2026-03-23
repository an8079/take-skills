/**
 * Artifact Loader
 * Load and parse artifacts from filesystem
 * @module artifacts/loader
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Artifact, ArtifactFrontmatter, ArtifactType } from './types';

/**
 * Frontmatter parsing result
 */
export interface ParsedFrontmatter {
  frontmatter: ArtifactFrontmatter;
  content: string;
}

/**
 * Parse frontmatter from file content
 * @param content - Raw file content with frontmatter
 * @returns Parsed frontmatter and remaining content
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid frontmatter format: missing or malformed --- delimiters');
  }

  const [, frontmatterStr, fileContent] = match;
  const frontmatter = parseFrontmatterFields(frontmatterStr);

  return {
    frontmatter,
    content: fileContent.trim(),
  };
}

/**
 * Parse frontmatter fields from YAML-like string
 */
function parseFrontmatterFields(frontmatterStr: string): ArtifactFrontmatter {
  const lines = frontmatterStr.split('\n');
  const frontmatter: Record<string, unknown> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | string[] = line.slice(colonIndex + 1).trim();

    // Handle array syntax: [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim());
    }

    frontmatter[key] = value;
  }

  return frontmatter as unknown as ArtifactFrontmatter;
}

/**
 * Serialize frontmatter to YAML-like string
 */
export function serializeFrontmatter(frontmatter: ArtifactFrontmatter): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push(`id: ${frontmatter.id}`);
  lines.push(`version: ${frontmatter.version}`);
  lines.push(`status: ${frontmatter.status}`);
  lines.push(`createdAt: ${frontmatter.createdAt}`);
  lines.push(`updatedAt: ${frontmatter.updatedAt}`);
  lines.push(`sourceWorkflow: ${frontmatter.sourceWorkflow}`);
  lines.push(`dependsOn: [${frontmatter.dependsOn.join(', ')}]`);
  lines.push(`owner: ${frontmatter.owner}`);
  lines.push(`approvalState: ${frontmatter.approvalState}`);
  lines.push('---');

  return lines.join('\n');
}

/**
 * Load an artifact from a file
 * @param filePath - Path to the artifact file
 * @returns Loaded artifact
 */
export async function loadArtifact(filePath: string): Promise<Artifact> {
  const content = await fs.readFile(filePath, 'utf-8');
  const { frontmatter, content: artifactContent } = parseFrontmatter(content);

  const isJson = filePath.endsWith('.json');

  return {
    frontmatter,
    content: isJson ? JSON.parse(artifactContent) : artifactContent,
  } as Artifact;
}

/**
 * Load multiple artifacts from a directory
 * @param dirPath - Directory containing artifacts
 * @param recursive - Whether to search recursively
 * @returns Array of loaded artifacts with their paths
 */
export async function loadArtifactsFromDirectory(
  dirPath: string,
  recursive = false
): Promise<Array<{ artifact: Artifact; filePath: string }>> {
  const results: Array<{ artifact: Artifact; filePath: string }> = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() && recursive) {
      const subResults = await loadArtifactsFromDirectory(fullPath, true);
      results.push(...subResults);
    } else if (entry.isFile() && isArtifactFile(entry.name)) {
      try {
        const artifact = await loadArtifact(fullPath);
        results.push({ artifact, filePath: fullPath });
      } catch (error) {
        console.warn(`Failed to load artifact at ${fullPath}:`, error);
      }
    }
  }

  return results;
}

/**
 * Check if a filename matches artifact naming conventions
 */
export function isArtifactFile(filename: string): boolean {
  const artifactPatterns = [
    /^PROJECT\.md$/,
    /^REQUIREMENTS\.md$/,
    /^SPEC\.md$/,
    /^PLAN\.md$/,
    /^ROADMAP\.md$/,
    /^PHASE-\d+-CONTEXT\.md$/,
    /^PHASE-\d+-PLAN\.md$/,
    /^EXECUTION-STATE\.json$/,
    /^EXECUTION-LOG\.md$/,
    /^VERIFICATION\.md$/,
    /^QA-REPORT\.md$/,
    /^RELEASE\.md$/,
    /^RETRO\.md$/,
  ];

  return artifactPatterns.some((pattern) => pattern.test(filename));
}

/**
 * Get artifact type from filename
 */
export function getArtifactTypeFromFilename(filename: string): ArtifactType | null {
  const typeMap: Record<string, ArtifactType> = {
    'PROJECT.md': 'PROJECT',
    'REQUIREMENTS.md': 'REQUIREMENTS',
    'SPEC.md': 'SPEC',
    'PLAN.md': 'PLAN',
    'ROADMAP.md': 'ROADMAP',
    'EXECUTION-STATE.json': 'EXECUTION-STATE',
    'EXECUTION-LOG.md': 'EXECUTION-LOG',
    'VERIFICATION.md': 'VERIFICATION',
    'QA-REPORT.md': 'QA-REPORT',
    'RELEASE.md': 'RELEASE',
    'RETRO.md': 'RETRO',
  };

  if (typeMap[filename]) return typeMap[filename];

  // Check phase-specific patterns
  const phaseContextMatch = filename.match(/^PHASE-(\d+)-CONTEXT\.md$/);
  if (phaseContextMatch) {
    return `PHASE-${phaseContextMatch[1]}-CONTEXT` as ArtifactType;
  }

  const phasePlanMatch = filename.match(/^PHASE-(\d+)-PLAN\.md$/);
  if (phasePlanMatch) {
    return `PHASE-${phasePlanMatch[1]}-PLAN` as ArtifactType;
  }

  return null;
}

/**
 * Check if an artifact exists at the given path
 */
export async function artifactExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
