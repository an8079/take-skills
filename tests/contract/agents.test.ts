/**
 * Agent Contract Tests
 *
 * Verifies that all agents listed in README exist and have valid metadata.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SKILLS_AGENTS_DIR = path.resolve(process.cwd(), 'skills/agents');
const SRC_AGENTS_DIR = path.resolve(process.cwd(), 'src/agents');

// Agents that should exist according to README
const README_AGENTS = [
  'software-architect', 'senior-developer', 'code-reviewer', 'security-engineer',
  'backend-architect', 'frontend-developer', 'devops-automator', 'data-engineer',
  'technical-writer', 'sre'
];

describe('Agent Contract Tests', () => {
  describe('README listed agents must exist', () => {
    for (const agent of README_AGENTS) {
      it(`agent ${agent} must exist in skills/agents/`, () => {
        const dirPath = path.join(SKILLS_AGENTS_DIR, agent);
        expect(fs.existsSync(dirPath), `Agent directory ${dirPath} must exist`).toBe(true);

        const skillFile = path.join(dirPath, 'SKILL.md');
        expect(fs.existsSync(skillFile), `Agent SKILL.md ${skillFile} must exist`).toBe(true);
      });
    }
  });

  describe('All agent SKILL.md files must have valid frontmatter', () => {
    if (!fs.existsSync(SKILLS_AGENTS_DIR)) {
      it.skip('skills/agents directory does not exist', () => {});
      return;
    }

    const agentDirs = fs.readdirSync(SKILLS_AGENTS_DIR).filter(f => {
      const fullPath = path.join(SKILLS_AGENTS_DIR, f);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const agentDir of agentDirs) {
      const skillFile = path.join(SKILLS_AGENTS_DIR, agentDir, 'SKILL.md');

      if (!fs.existsSync(skillFile)) {
        it(`agent ${agentDir} must have SKILL.md`, () => {
          expect(fs.existsSync(skillFile)).toBe(true);
        });
        continue;
      }

      it(`agent ${agentDir} SKILL.md must have valid frontmatter`, () => {
        const content = fs.readFileSync(skillFile, 'utf-8');

        // Check for frontmatter delimiter
        expect(content.startsWith('---'), `Agent ${agentDir} SKILL.md must start with ---`).toBe(true);

        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        expect(frontmatterMatch, `Agent ${agentDir} SKILL.md must have frontmatter block`).not.toBeNull();

        const frontmatter = frontmatterMatch![1];

        // Check for required fields
        expect(frontmatter).toContain('name:', `Agent ${agentDir} frontmatter must have name field`);
        expect(frontmatter).toContain('description:', `Agent ${agentDir} frontmatter must have description field`);
      });
    }
  });

  describe('Built-in agents in src/agents/index.ts must have metadata', () => {
    it('should export AGENTS with required metadata', () => {
      // Verify the agents index file exists
      const agentsIndexPath = path.join(SRC_AGENTS_DIR, 'index.ts');
      expect(fs.existsSync(agentsIndexPath), `src/agents/index.ts must exist`).toBe(true);

      const content = fs.readFileSync(agentsIndexPath, 'utf-8');

      // Check for AGENTS export
      expect(content).toContain('export const AGENTS');

      // Check for AgentDefinition interface with metadata
      expect(content).toContain('metadata: AgentPromptMetadata');
    });
  });
});
