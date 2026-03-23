/**
 * Command Contract Tests
 *
 * Verifies that all commands listed in README exist in the commands/ directory
 * and have valid frontmatter.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getBuiltInCommandsDir,
  getCommand,
  getCommandSearchPaths,
} from '../../src/commands/index.js';

const COMMANDS_DIR = path.resolve(process.cwd(), 'commands');

// Commands that should exist according to README
const README_COMMANDS = [
  'interview', 'spec', 'plan', 'code', 'tdd', 'test', 'review',
  'import', 'analyze', 'scope', 'debug',
  'deep-interview', 'auto-interview', 'autopilot', 'ralph', 'ultrawork', 'ultraqa',
  'notify', 'pua', 'rag', 'team', 'test-teams', 'office-hours', 'find-product-remind',
  'structure-thinking'
];

// Normalize line endings to handle CRLF (Windows) and LF (Unix)
function normalizeLineEndings(str: string): string {
  return str.replace(/\r\n/g, '\n');
}

describe('Command Contract Tests', () => {
  describe('README listed commands must exist', () => {
    for (const cmd of README_COMMANDS) {
      it(`command /${cmd} must exist in commands/ directory`, () => {
        const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
        expect(fs.existsSync(filePath), `Command file ${filePath} must exist`).toBe(true);
      });
    }
  });

  describe('Built-in command registry must be wired to the shipped repository commands', () => {
    it('should include the built-in commands directory in search paths', () => {
      expect(getCommandSearchPaths()).toContain(getBuiltInCommandsDir());
    });

    it('should resolve a shipped command from the repository command set', () => {
      const command = getCommand('autopilot');
      expect(command).not.toBeNull();
      expect(command?.filePath.includes(`${path.sep}commands${path.sep}`)).toBe(true);
    });
  });

  describe('All command files must have valid frontmatter', () => {
    const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md') && f !== 'COMMANDS_INDEX.md');

    for (const file of commandFiles) {
      const filePath = path.join(COMMANDS_DIR, file);
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const content = normalizeLineEndings(rawContent);
      const commandName = file.replace('.md', '');

      it(`command ${commandName} must have valid frontmatter`, () => {
        // Check for frontmatter delimiter (handle CRLF)
        expect(content.startsWith('---'), `Command ${commandName} must start with ---`).toBe(true);

        // Extract frontmatter - handle both LF and CRLF
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        expect(frontmatterMatch, `Command ${commandName} must have frontmatter block`).not.toBeNull();

        const frontmatter = frontmatterMatch![1];

        // Check for required fields
        expect(frontmatter).toContain('name:', `Command ${commandName} frontmatter must have name field`);
        expect(frontmatter).toContain('description:', `Command ${commandName} frontmatter must have description field`);

        // Validate frontmatter name exists (don't require exact match with filename)
        const nameMatch = frontmatter.match(/name:\s*(\S+)/);
        expect(nameMatch, `Command ${commandName} frontmatter must have valid name`).not.toBeNull();
      });
    }
  });

  describe('No duplicate commands', () => {
    it('should not have duplicate command files', () => {
      const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md') && f !== 'COMMANDS_INDEX.md');
      const names = commandFiles.map(f => f.replace('.md', ''));
      const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
      expect(duplicates, `Found duplicate commands: ${duplicates.join(', ')}`).toHaveLength(0);
    });
  });
});
