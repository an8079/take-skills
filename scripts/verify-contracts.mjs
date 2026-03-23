#!/usr/bin/env node
/**
 * Contract Verification Script
 *
 * Standalone script to verify documentation contracts without running full test suite.
 * Can be run with: node scripts/verify-contracts.mjs
 *
 * Exits with code 0 if all contracts pass, non-zero otherwise.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

let exitCode = 0;

// Normalize line endings to handle CRLF (Windows) and LF (Unix)
function normalizeLineEndings(str) {
  return str.replace(/\r\n/g, '\n');
}

function log(section, message, status) {
  const statusIcon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '•';
  console.log(`${statusIcon} [${section}] ${message}`);
}

function logError(section, message) {
  log(section, message, 'FAIL');
  exitCode = 1;
}

// ============ Commands Contract ============
function verifyCommands() {
  console.log('\n--- Command Contract Verification ---\n');

  const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands');
  const README_COMMANDS = [
    'interview', 'spec', 'plan', 'code', 'tdd', 'test', 'review',
    'import', 'analyze', 'scope', 'debug',
    'deep-interview', 'auto-interview', 'autopilot', 'ralph', 'ultrawork', 'ultraqa',
    'notify', 'pua', 'rag', 'team', 'test-teams', 'office-hours', 'find-product-remind',
    'structure-thinking'
  ];

  let allPass = true;

  for (const cmd of README_COMMANDS) {
    const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
    if (!fs.existsSync(filePath)) {
      logError('COMMANDS', `Command /${cmd} does not exist`);
      allPass = false;
    } else {
      log('COMMANDS', `Command /${cmd} exists`);
    }
  }

  // Check frontmatter
  const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md') && f !== 'COMMANDS_INDEX.md');
  for (const file of commandFiles) {
    const filePath = path.join(COMMANDS_DIR, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const content = normalizeLineEndings(rawContent);
    const commandName = file.replace('.md', '');

    if (!content.startsWith('---')) {
      logError('COMMANDS', `Command ${commandName} missing frontmatter delimiter`);
      allPass = false;
      continue;
    }

    // Handle both LF and CRLF
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      logError('COMMANDS', `Command ${commandName} missing frontmatter block`);
      allPass = false;
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    if (!frontmatter.includes('name:') || !frontmatter.includes('description:')) {
      logError('COMMANDS', `Command ${commandName} frontmatter missing required fields`);
      allPass = false;
      continue;
    }

    log('COMMANDS', `Command /${commandName} frontmatter valid`);
  }

  return allPass;
}

// ============ Agents Contract ============
function verifyAgents() {
  console.log('\n--- Agent Contract Verification ---\n');

  const SKILLS_AGENTS_DIR = path.join(PROJECT_ROOT, 'skills/agents');
  const README_AGENTS = [
    'software-architect', 'senior-developer', 'code-reviewer', 'security-engineer',
    'backend-architect', 'frontend-developer', 'devops-automator', 'data-engineer',
    'technical-writer', 'sre'
  ];

  let allPass = true;

  for (const agent of README_AGENTS) {
    const dirPath = path.join(SKILLS_AGENTS_DIR, agent);
    const skillFile = path.join(dirPath, 'SKILL.md');

    if (!fs.existsSync(dirPath)) {
      logError('AGENTS', `Agent ${agent} directory does not exist`);
      allPass = false;
      continue;
    }

    if (!fs.existsSync(skillFile)) {
      logError('AGENTS', `Agent ${agent} SKILL.md does not exist`);
      allPass = false;
      continue;
    }

    const rawContent = fs.readFileSync(skillFile, 'utf-8');
    const content = normalizeLineEndings(rawContent);

    if (!content.startsWith('---')) {
      logError('AGENTS', `Agent ${agent} SKILL.md missing frontmatter`);
      allPass = false;
      continue;
    }

    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      logError('AGENTS', `Agent ${agent} SKILL.md missing frontmatter block`);
      allPass = false;
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    if (!frontmatter.includes('name:') || !frontmatter.includes('description:')) {
      logError('AGENTS', `Agent ${agent} frontmatter missing required fields`);
      allPass = false;
      continue;
    }

    log('AGENTS', `Agent ${agent} valid`);
  }

  return allPass;
}

// ============ Version Contract ============
function verifyVersion() {
  console.log('\n--- Version Contract Verification ---\n');

  let allPass = true;

  // package.json
  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const pkgVersion = pkg.version;
  log('VERSION', `package.json version: ${pkgVersion}`);

  // src/index.ts
  const srcIndexPath = path.join(PROJECT_ROOT, 'src/index.ts');
  const srcContent = fs.readFileSync(srcIndexPath, 'utf-8');
  const srcMatch = srcContent.match(/export\s+const\s+VERSION\s*=\s*["']([^"']+)["']/);
  if (!srcMatch) {
    logError('VERSION', 'src/index.ts VERSION not found');
    allPass = false;
  } else {
    const srcVersion = srcMatch[1];
    log('VERSION', `src/index.ts VERSION: ${srcVersion}`);

    if (pkgVersion !== srcVersion) {
      logError('VERSION', `package.json (${pkgVersion}) !== src/index.ts (${srcVersion})`);
      allPass = false;
    }
  }

  // README.md - match "版本：v3.0.0" or "版本: v3.0.0"
  const readmePath = path.join(PROJECT_ROOT, 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const readmeMatch = readmeContent.match(/\*\*版本[：:]\*\*\s*v?(\d+\.\d+\.\d+)/);
  if (!readmeMatch) {
    logError('VERSION', 'README.md version not found');
    allPass = false;
  } else {
    const readmeVersion = readmeMatch[1];
    log('VERSION', `README.md version: ${readmeVersion}`);

    if (pkgVersion !== readmeVersion) {
      logError('VERSION', `package.json (${pkgVersion}) !== README.md (${readmeVersion})`);
      allPass = false;
    }
  }

  return allPass;
}

// ============ Install Contract ============
function verifyInstall() {
  console.log('\n--- Install Contract Verification ---\n');

  let allPass = true;

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
    if (!fs.existsSync(fullPath)) {
      logError('INSTALL', `Required path ${p} does not exist`);
      allPass = false;
    } else {
      log('INSTALL', `Required path ${p} exists`);
    }
  }

  // Check commands not empty
  const commandsDir = path.join(PROJECT_ROOT, 'commands');
  const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
  if (cmdFiles.length === 0) {
    logError('INSTALL', 'commands directory is empty');
    allPass = false;
  } else {
    log('INSTALL', `commands directory has ${cmdFiles.length} files`);
  }

  return allPass;
}

// ============ Main ============
console.log('======================================');
console.log('  Contract Verification Script');
console.log('======================================');

const commandsOk = verifyCommands();
const agentsOk = verifyAgents();
const versionOk = verifyVersion();
const installOk = verifyInstall();

console.log('\n======================================');
console.log('  Summary');
console.log('======================================');
console.log(`  Commands: ${commandsOk ? 'PASS' : 'FAIL'}`);
console.log(`  Agents:   ${agentsOk ? 'PASS' : 'FAIL'}`);
console.log(`  Version:  ${versionOk ? 'PASS' : 'FAIL'}`);
console.log(`  Install:  ${installOk ? 'PASS' : 'FAIL'}`);
console.log('======================================\n');

if (exitCode !== 0) {
  console.log('Some contracts failed. Fix the issues above.\n');
  process.exit(exitCode);
} else {
  console.log('All contracts passed!\n');
  process.exit(0);
}
