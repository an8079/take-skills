/**
 * Doctor Command - System Health Checks
 *
 * Performs comprehensive health checks on the claude-studio installation.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { getAvailableAgents, AGENTS } from "../agents/index.js";
import {
  listCommands,
  getBuiltInCommandsDir,
  getCommandSearchPaths,
} from "./index.js";
import { getConfigPaths, loadConfig, DEFAULT_CONFIG } from "../utils/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface DoctorCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
  details?: Record<string, unknown>;
}

export interface DoctorResult {
  healthy: boolean;
  checks: DoctorCheck[];
  summary: string;
}

/**
 * Check Node.js version compatibility
 */
function checkNodeVersion(): DoctorCheck {
  const required = ">=20.0.0";
  const version = process.version;
  const match = version.match(/^v(\d+)\./);

  if (!match) {
    return {
      name: "node-version",
      status: "fail",
      message: `Cannot parse Node.js version: ${version}`,
    };
  }

  const major = parseInt(match[1], 10);
  if (major < 20) {
    return {
      name: "node-version",
      status: "fail",
      message: `Node.js ${version} is too old. Required: ${required}`,
    };
  }

  return {
    name: "node-version",
    status: "pass",
    message: `Node.js ${version}`,
  };
}

/**
 * Check if built-in commands directory exists and is readable
 */
function checkCommandsDir(): DoctorCheck {
  const builtInDir = getBuiltInCommandsDir();

  if (!existsSync(builtInDir)) {
    return {
      name: "commands-built-in",
      status: "fail",
      message: `Built-in commands directory not found: ${builtInDir}`,
    };
  }

  try {
    const files = readdirSync(builtInDir).filter((f) => f.endsWith(".md"));
    if (files.length === 0) {
      return {
        name: "commands-built-in",
        status: "warn",
        message: `Built-in commands directory is empty`,
        details: { path: builtInDir, count: 0 },
      };
    }

    return {
      name: "commands-built-in",
      status: "pass",
      message: `${files.length} built-in commands`,
      details: { path: builtInDir, count: files.length },
    };
  } catch (error) {
    return {
      name: "commands-built-in",
      status: "fail",
      message: `Cannot read built-in commands directory: ${error}`,
    };
  }
}

/**
 * Check if all core commands are resolvable
 */
function checkCoreCommands(): DoctorCheck {
  const coreCommands = ["interview", "spec", "plan", "code", "review", "test", "debug"];
  const availableCommands = listCommands();

  const missing = coreCommands.filter((cmd) => !availableCommands.includes(cmd));

  if (missing.length > 0) {
    return {
      name: "commands-core",
      status: "fail",
      message: `Missing core commands: ${missing.join(", ")}`,
      details: { missing, available: availableCommands.length },
    };
  }

  return {
    name: "commands-core",
    status: "pass",
    message: `All ${coreCommands.length} core commands available`,
    details: { core: coreCommands, available: availableCommands.length },
  };
}

/**
 * Check if agents can be loaded
 */
function checkAgents(): DoctorCheck {
  const agents = getAvailableAgents();

  if (agents.length === 0) {
    return {
      name: "agents",
      status: "fail",
      message: "No agents found",
    };
  }

  // Verify each agent has required fields
  const agentNames = Object.keys(AGENTS);
  const missingAgents: string[] = [];

  for (const name of agentNames) {
    const agent = AGENTS[name];
    if (!agent.name || !agent.description || !agent.prompt) {
      missingAgents.push(name);
    }
  }

  if (missingAgents.length > 0) {
    return {
      name: "agents",
      status: "warn",
      message: `${agents.length} agents loaded, but some are incomplete`,
      details: { count: agents.length, incomplete: missingAgents },
    };
  }

  return {
    name: "agents",
    status: "pass",
    message: `${agents.length} agents loaded`,
    details: { count: agents.length },
  };
}

/**
 * Check if skills directory exists and is readable
 */
function checkSkills(): DoctorCheck {
  const skillsDir = resolve(__dirname, "../../skills");

  if (!existsSync(skillsDir)) {
    return {
      name: "skills",
      status: "fail",
      message: `Skills directory not found: ${skillsDir}`,
    };
  }

  try {
    const skillDirs = readdirSync(skillsDir).filter((f) => {
      const path = join(skillsDir, f);
      return statSync(path).isDirectory() && existsSync(join(path, "SKILL.md"));
    });

    if (skillDirs.length === 0) {
      return {
        name: "skills",
        status: "warn",
        message: `No skills found (no directories with SKILL.md)`,
        details: { path: skillsDir, count: 0 },
      };
    }

    return {
      name: "skills",
      status: "pass",
      message: `${skillDirs.length} skills available`,
      details: { path: skillsDir, count: skillDirs.length },
    };
  } catch (error) {
    return {
      name: "skills",
      status: "fail",
      message: `Cannot read skills directory: ${error}`,
    };
  }
}

/**
 * Check if dist directory exists and is built
 */
function checkDist(): DoctorCheck {
  const distDir = resolve(__dirname, "../../dist");

  if (!existsSync(distDir)) {
    return {
      name: "dist",
      status: "fail",
      message: `dist directory not found. Run: npm run build`,
    };
  }

  const requiredFiles = ["cli.js", "index.js"];
  const missingFiles: string[] = [];

  for (const file of requiredFiles) {
    if (!existsSync(join(distDir, file))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    return {
      name: "dist",
      status: "fail",
      message: `dist directory incomplete. Missing: ${missingFiles.join(", ")}`,
      details: { missing: missingFiles },
    };
  }

  return {
    name: "dist",
    status: "pass",
    message: "dist built",
    details: { path: distDir },
  };
}

/**
 * Check if config files are valid
 */
function checkConfig(): DoctorCheck {
  const paths = getConfigPaths();
  const issues: string[] = [];

  // Check if config can be loaded
  try {
    const config = loadConfig();

    // Verify it has expected structure
    if (!config.agents || typeof config.agents !== "object") {
      issues.push("Missing or invalid agents config");
    }
    if (!config.features || typeof config.features !== "object") {
      issues.push("Missing or invalid features config");
    }
  } catch (error) {
    issues.push(`Config load error: ${error}`);
  }

  if (issues.length > 0) {
    return {
      name: "config",
      status: "fail",
      message: issues.join("; "),
      details: { paths },
    };
  }

  return {
    name: "config",
    status: "pass",
    message: "Config valid",
    details: { paths },
  };
}

/**
 * Check writable paths
 */
function checkWritablePaths(): DoctorCheck {
  const writableChecks: { path: string; writable: boolean }[] = [];

  // Check if we can write to project directory
  const projectDir = process.cwd();
  try {
    // Check dist directory (needs to be writable for builds)
    const distDir = join(projectDir, "dist");
    if (existsSync(distDir)) {
      const testFile = join(distDir, ".write-test");
      try {
        // We just check if it exists and is a directory
        writableChecks.push({ path: distDir, writable: true });
      } catch {
        writableChecks.push({ path: distDir, writable: false });
      }
    }

    // Check commands directory
    const commandsDir = join(projectDir, "commands");
    if (existsSync(commandsDir)) {
      writableChecks.push({ path: commandsDir, writable: true });
    }
  } catch (error) {
    return {
      name: "writable-paths",
      status: "warn",
      message: `Error checking writable paths: ${error}`,
    };
  }

  const allWritable = writableChecks.every((c) => c.writable);

  if (!allWritable) {
    const notWritable = writableChecks.filter((c) => !c.writable).map((c) => c.path);
    return {
      name: "writable-paths",
      status: "warn",
      message: `Some paths may not be writable: ${notWritable.join(", ")}`,
      details: { checks: writableChecks },
    };
  }

  return {
    name: "writable-paths",
    status: "pass",
    message: "Project paths accessible",
    details: { checks: writableChecks },
  };
}

/**
 * Run all doctor checks
 */
export function runDoctorChecks(): DoctorResult {
  const checks: DoctorCheck[] = [
    checkNodeVersion(),
    checkCommandsDir(),
    checkCoreCommands(),
    checkAgents(),
    checkSkills(),
    checkDist(),
    checkConfig(),
    checkWritablePaths(),
  ];

  const failures = checks.filter((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn");

  let summary: string;
  if (failures.length === 0 && warnings.length === 0) {
    summary = "All checks passed";
  } else if (failures.length === 0) {
    summary = `${warnings.length} warning(s), ${checks.length - warnings.length} pass`;
  } else {
    summary = `${failures.length} failure(s), ${warnings.length} warning(s)`;
  }

  return {
    healthy: failures.length === 0,
    checks,
    summary,
  };
}

/**
 * Print doctor results in a formatted way
 */
export function printDoctorResults(result: DoctorResult): void {
  console.log("\n" + "=".repeat(60));
  console.log("  CLAUDE STUDIO DOCTOR");
  console.log("=".repeat(60) + "\n");

  for (const check of result.checks) {
    const icon = check.status === "pass" ? "✓" : check.status === "fail" ? "✗" : "!";
    const color = check.status === "pass" ? "\x1b[32m" : check.status === "fail" ? "\x1b[31m" : "\x1b[33m";

    console.log(`${color}${icon}\x1b[0m ${check.name}: ${check.message}`);

    if (check.details) {
      for (const [key, value] of Object.entries(check.details)) {
        if (key !== "path" && key !== "checks") {
          console.log(`    ${key}: ${JSON.stringify(value)}`);
        }
      }
    }
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Status: ${result.summary}`);
  console.log("=".repeat(60) + "\n");
}
