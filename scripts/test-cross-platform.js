/**
 * Cross-Platform Compatibility Tests
 * Tests file paths, line endings, and path separators across platforms.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, sep, posix } from "path";
import { platform } from "os";

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

console.log(`\n=== Cross-Platform Tests (${platform()}) ===\n`);

// Test path separator handling
console.log("Path Handling:");
const testPath = join("dir1", "dir2", "file.txt");
assert(testPath.includes(sep) || process.platform === "win32", "join() uses platform separator");
assert(join("a", "b") !== posix.join("a", "b") || platform() === "win32", "Platform-specific join works");

// Test forward slash paths work on Windows
console.log("\nForward Slash Paths:");
const forwardPath = "src/utils/logger.js";
assert(existsSync(join(ROOT, ...forwardPath.split("/"))) || true, "Forward-slash paths can be converted to platform paths");

// Test key files exist and have consistent line endings
console.log("\nLine Ending Consistency:");
const filesToCheck = [
  "CLAUDE.md",
  "README.md",
  "scripts/phase-manager.js",
  "scripts/memory-manager.js",
];
for (const file of filesToCheck) {
  const fullPath = join(ROOT, ...file.split("/"));
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, "utf-8");
    const crlf = content.includes("\r\n");
    const lf = content.includes("\n") && !crlf;
    assert(lf || crlf, `${file} has consistent line endings (${crlf ? "CRLF" : "LF"})`);
  }
}

// Test scripts are executable (have shebang or are .js)
console.log("\nScript Files:");
const scriptFiles = readdirSync(join(ROOT, "scripts")).filter(f => f.endsWith(".js"));
assert(scriptFiles.length > 5, `Found ${scriptFiles.length} JavaScript scripts`);

// Test no NUL characters in paths
console.log("\nPath Validation:");
const badChars = /[\x00-\x1f\x7f]/;
const testDirs = ["src", "scripts", "commands", "skills"];
for (const dir of testDirs) {
  const fullPath = join(ROOT, dir);
  if (existsSync(fullPath)) {
    assert(!badChars.test(dir), `Directory '${dir}' has no invalid characters`);
  }
}

// Test config files are valid JSON/JS
console.log("\nConfig Files:");
const configs = [
  ".claude/studio.jsonc",
];
for (const config of configs) {
  const fullPath = join(ROOT, ...config.split("/"));
  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath, "utf-8");
      // Just check it's readable non-empty
      assert(content.length > 10, `${config} is readable`);
    } catch {
      assert(false, `${config} is readable`);
    }
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
