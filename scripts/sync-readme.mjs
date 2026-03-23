#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function runCliCommand(args) {
  try {
    return execSync(`npx tsx src/cli.ts ${args}`, {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (e) {
    console.error(`Failed to run CLI command: ${args}`);
    return '';
  }
}

function getCommands() {
  const output = runCliCommand('commands');
  if (!output) return [];
  return output.split('\n').filter(line => line.trim());
}

function getAgents() {
  const output = runCliCommand('agents');
  if (!output) return [];
  return output.split('\n').filter(line => line.trim()).map(line => {
    const [name, ...descParts] = line.split('\t');
    return { name, description: descParts.join('\t').trim() };
  });
}

function getVersion() {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
  return pkg.version;
}

function syncReadme() {
  const readmePath = resolve(root, 'README.md');
  let readme = readFileSync(readmePath, 'utf-8');
  const version = getVersion();
  const commands = getCommands();
  const agents = getAgents();

  // Update version
  readme = readme.replace(
    /> \*\*版本：\*\* v[\d.]+/,
    `> **版本：** v${version}`
  );

  // Build commands section
  const commandListStr = commands.map(cmd => {
    return `| \`${cmd}\` | |`;
  }).join('\n');

  // Build agents section
  const agentListStr = agents.map(agent => {
    return `| ${agent.name} | ${agent.description} |`;
  }).join('\n');

  // Replace commands section with markers (match existing marker style)
  if (readme.includes('<!-- AUTO-COMMANDS -->')) {
    readme = readme.replace(
      /<!-- AUTO-COMMANDS -->[\s\S]*?<!-- \/AUTO-COMMANDS -->/,
      `<!-- AUTO-COMMANDS -->\n| 命令 | 用途 |\n|------|------|\n${commandListStr}\n<!-- /AUTO-COMMANDS -->`
    );
  }

  // Replace agents section with markers (match existing marker style)
  if (readme.includes('<!-- AUTO-AGENTS -->')) {
    readme = readme.replace(
      /<!-- AUTO-AGENTS -->[\s\S]*?<!-- \/AUTO-AGENTS -->/,
      `<!-- AUTO-AGENTS -->\n| Agent | 专长 |\n|-------|------|\n${agentListStr}\n<!-- /AUTO-AGENTS -->`
    );
  }

  writeFileSync(readmePath, readme, 'utf-8');
  console.log(`README.md synced successfully`);
  console.log(`- Version: v${version}`);
  console.log(`- Commands: ${commands.length}`);
  console.log(`- Agents: ${agents.length}`);
}

syncReadme();
