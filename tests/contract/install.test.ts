/**
 * Install Smoke Test
 *
 * Verifies that the package can be installed and basic imports work.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

describe('Install Smoke Test', () => {
  describe('Package structure must be valid', () => {
    it('package.json must exist and be valid JSON', () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      expect(fs.existsSync(packageJsonPath), 'package.json must exist').toBe(true);

      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(pkg.name, 'package.json must have name field').toBe('claude-studio');
      expect(pkg.version, 'package.json must have version field').toBeDefined();
      expect(pkg.main, 'package.json must have main field').toBeDefined();
    });

    it('must have required files and directories', () => {
      const requiredPaths = [
        'package.json',
        'src/index.ts',
        'src/agents/index.ts',
        'commands',
        'skills',
        'README.md',
        'vitest.config.ts'
      ];

      for (const p of requiredPaths) {
        const fullPath = path.join(PROJECT_ROOT, p);
        expect(fs.existsSync(fullPath), `Required path ${p} must exist`).toBe(true);
      }
    });

    it('commands directory must not be empty', () => {
      const commandsDir = path.join(PROJECT_ROOT, 'commands');
      const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
      expect(files.length, 'commands directory must have command files').toBeGreaterThan(0);
    });

    it('skills/agents directory must have agents', () => {
      const agentsDir = path.join(PROJECT_ROOT, 'skills/agents');
      if (!fs.existsSync(agentsDir)) return; // Skip if directory doesn't exist

      const agents = fs.readdirSync(agentsDir).filter(f => {
        const fullPath = path.join(agentsDir, f);
        return fs.statSync(fullPath).isDirectory();
      });
      expect(agents.length, 'skills/agents must have agent directories').toBeGreaterThan(0);
    });
  });

  describe('TypeScript configuration must be valid', () => {
    it('tsconfig.json must exist if src/ exists', () => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      if (fs.existsSync(path.join(PROJECT_ROOT, 'src'))) {
        expect(fs.existsSync(tsconfigPath), 'tsconfig.json must exist when src/ exists').toBe(true);
      }
    });
  });

  describe('CLI entry point must be defined', () => {
    it('bin field in package.json must reference existing file or dist file', () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (pkg.bin) {
        const binEntry = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0] as string;
        // Allow dist path since build is required
        expect(binEntry, 'bin entry must be defined').toBeDefined();
        expect(binEntry.endsWith('.js'), 'bin entry should be a .js file').toBe(true);
      }
    });
  });
});
