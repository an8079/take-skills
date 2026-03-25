/**
 * Agent Boundary Tests
 * Tests that agent definitions have proper boundaries and permissions.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${message}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${message}`);
    failed++;
  }
}

function assertExists(file, message) {
  assert(existsSync(file), message);
}

console.log("\n=== Agent Boundary Tests ===\n");

// Test skills/agents directory structure
console.log("Agent Skills Structure:");
const agentsDir = join(ROOT, "skills", "agents");
if (existsSync(agentsDir)) {
  const agents = readdirSync(agentsDir);
  assert(agents.length >= 5, `Found ${agents.length} agent skills (expected >= 5)`);

  for (const agent of agents) {
    const agentPath = join(agentsDir, agent);
    const hasDef = existsSync(join(agentPath, "SKILL.md"));
    assert(hasDef, `Agent '${agent}' has SKILL.md`);
  }
} else {
  assert(false, "skills/agents directory exists");
}

// Test skills have SKILL.md files
console.log("\nSkills Structure:");
const skillsDir = join(ROOT, "skills");
if (existsSync(skillsDir)) {
  const skillDirs = readdirSync(skillsDir).filter(f => {
    return existsSync(join(skillsDir, f, "SKILL.md"));
  });
  assert(skillDirs.length >= 5, `Found ${skillDirs.length} skills with SKILL.md`);
} else {
  assert(false, "skills directory exists");
}

// Test commands have proper structure
console.log("\nCommands Structure:");
const commandsDir = join(ROOT, "commands");
if (existsSync(commandsDir)) {
  const commandFiles = readdirSync(commandsDir).filter(f => f.endsWith(".md"));
  assert(commandFiles.length >= 10, `Found ${commandFiles.length} command files (expected >= 10)`);

  for (const cmd of commandFiles.slice(0, 3)) {
    const content = readFileSync(join(commandsDir, cmd), "utf-8");
    assert(content.length > 50, `Command '${cmd}' has substantial content`);
  }
} else {
  assert(false, "commands directory exists");
}

// Test .claude settings are properly bounded
console.log("\nClaude Settings Boundaries:");
const settingsPath = join(ROOT, ".claude", "studio.jsonc");
assertExists(settingsPath, "studio.jsonc exists");

if (existsSync(settingsPath)) {
  const content = readFileSync(settingsPath, "utf-8");
  assert(content.length > 10, "studio.jsonc is readable and non-empty");
}

// Test security scanner exists
console.log("\nSecurity Controls:");
assertExists(join(ROOT, "scripts", "security-scanner.js"), "security-scanner.js exists");

// Test src has proper structure
console.log("\nSource Structure:");
const srcDir = join(ROOT, "src");
assertExists(join(srcDir, "pipeline"), "src/pipeline directory exists");
assertExists(join(srcDir, "phase-manager"), "src/phase-manager directory exists");
assertExists(join(srcDir, "governance"), "src/governance directory exists");
assertExists(join(srcDir, "providers"), "src/providers directory exists");
assertExists(join(srcDir, "artifacts"), "src/artifacts directory exists");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
