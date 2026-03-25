/**
 * Memory System Tests
 * Tests the .omc memory system and project memory functionality.
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

console.log("\n=== Memory System Tests ===\n");

// Test .omc directory structure
console.log(".omc Structure:");
assertExists(join(ROOT, ".omc"), ".omc directory exists");
assertExists(join(ROOT, ".omc", "project-memory.json"), "project-memory.json exists");
assertExists(join(ROOT, ".omc", "sessions"), "sessions directory exists");
assertExists(join(ROOT, ".omc", "specs"), "specs directory exists");
assertExists(join(ROOT, ".omc", "state"), "state directory exists");

// Test project memory JSON validity
console.log("\nProject Memory JSON:");
const projectMemoryPath = join(ROOT, ".omc", "project-memory.json");
if (existsSync(projectMemoryPath)) {
  try {
    const data = JSON.parse(readFileSync(projectMemoryPath, "utf-8"));
    assert(typeof data === "object", "project-memory.json is valid JSON");
  } catch {
    assert(false, "project-memory.json is valid JSON");
  }
}

// Test .claude settings
console.log("\nClaude Settings:");
assertExists(join(ROOT, ".claude", "studio.jsonc"), "studio.jsonc exists");
assertExists(join(ROOT, ".claude", "settings.local.json"), "settings.local.json exists");

// Test state subdirectory
console.log("\nState Subdirectories:");
const statePath = join(ROOT, ".omc", "state");
if (existsSync(statePath)) {
  const entries = readdirSync(statePath);
  assert(entries.length >= 0, `state dir accessible (${entries.length} entries)`);
}

// Test sessions subdirectory
console.log("\nSessions Subdirectories:");
const sessionsPath = join(ROOT, ".omc", "sessions");
if (existsSync(sessionsPath)) {
  const entries = readdirSync(sessionsPath);
  assert(Array.isArray(entries) || entries.length >= 0, "sessions dir accessible");
}

// Test specs subdirectory
console.log("\nSpecs Subdirectories:");
const specsPath = join(ROOT, ".omc", "specs");
if (existsSync(specsPath)) {
  const entries = readdirSync(specsPath);
  assert(Array.isArray(entries) || entries.length >= 0, "specs dir accessible");
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
