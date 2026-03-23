/**
 * Version Contract Tests
 *
 * Verifies that version numbers are consistent across:
 * - package.json
 * - src/index.ts (VERSION export)
 * - README.md
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

describe('Version Contract Tests', () => {
  it('package.json version must exist', () => {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(pkg.version, 'package.json must have version field').toBeDefined();
    expect(pkg.version, 'package.json version must be non-empty').not.toBe('');
  });

  it('src/index.ts VERSION must exist', () => {
    const srcIndexPath = path.join(PROJECT_ROOT, 'src/index.ts');
    const content = fs.readFileSync(srcIndexPath, 'utf-8');
    const versionMatch = content.match(/export\s+const\s+VERSION\s*=\s*["']([^"']+)["']/);
    expect(versionMatch, 'src/index.ts must export VERSION constant').not.toBeNull();
  });

  it('README.md version must exist', () => {
    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    const content = fs.readFileSync(readmePath, 'utf-8');
    // Match version format like "**版本：** v3.0.0" - handle bold markdown and full-width colon
    // The actual pattern is **版本：** v3.0.0 (note the ** between colon and space)
    const versionMatch = content.match(/\*\*版本[：:]\*\*\s*v?(\d+\.\d+\.\d+)/);
    expect(versionMatch, 'README.md must contain version information').not.toBeNull();
  });

  it('package.json version must equal src/index.ts VERSION', () => {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const pkgVersion = pkg.version;

    const srcIndexPath = path.join(PROJECT_ROOT, 'src/index.ts');
    const srcContent = fs.readFileSync(srcIndexPath, 'utf-8');
    const versionMatch = srcContent.match(/export\s+const\s+VERSION\s*=\s*["']([^"']+)["']/);
    expect(versionMatch, 'src/index.ts VERSION must exist').not.toBeNull();
    const srcVersion = versionMatch![1];

    expect(pkgVersion, `package.json version (${pkgVersion}) must equal src/index.ts VERSION (${srcVersion})`)
      .toBe(srcVersion);
  });

  it('package.json version must equal README.md version', () => {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const pkgVersion = pkg.version;

    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');
    const versionMatch = readmeContent.match(/\*\*版本[：:]\*\*\s*v?(\d+\.\d+\.\d+)/);
    expect(versionMatch, 'README.md must contain version information').not.toBeNull();
    const readmeVersion = versionMatch![1];

    expect(pkgVersion, `package.json version (${pkgVersion}) must equal README.md version (${readmeVersion})`)
      .toBe(readmeVersion);
  });

  it('src/index.ts VERSION must equal README.md version', () => {
    const srcIndexPath = path.join(PROJECT_ROOT, 'src/index.ts');
    const srcContent = fs.readFileSync(srcIndexPath, 'utf-8');
    const versionMatch = srcContent.match(/export\s+const\s+VERSION\s*=\s*["']([^"']+)["']/);
    expect(versionMatch, 'src/index.ts VERSION must exist').not.toBeNull();
    const srcVersion = versionMatch![1];

    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');
    const readmeVersionMatch = readmeContent.match(/\*\*版本[：:]\*\*\s*v?(\d+\.\d+\.\d+)/);
    expect(readmeVersionMatch, 'README.md must contain version information').not.toBeNull();
    const readmeVersion = readmeVersionMatch![1];

    expect(srcVersion, `src/index.ts VERSION (${srcVersion}) must equal README.md version (${readmeVersion})`)
      .toBe(readmeVersion);
  });
});
