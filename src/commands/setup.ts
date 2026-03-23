/**
 * Setup Command - Installation and Initialization
 *
 * Installs dependencies and initializes configuration.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { getConfigPaths, DEFAULT_CONFIG } from "../utils/config.js";
import { runDoctorChecks, printDoctorResults } from "./doctor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface SetupResult {
  success: boolean;
  steps: { name: string; status: "ok" | "skip" | "fail"; message?: string }[];
}

/**
 * Create user configuration directory and default config
 */
function initUserConfig(): { status: "ok" | "skip" | "fail"; message?: string } {
  const paths = getConfigPaths();
  const configDir = dirname(paths.user);

  try {
    // Create user config directory if it doesn't exist
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Create user config file if it doesn't exist
    if (!existsSync(paths.user)) {
      const defaultConfigStr = JSON.stringify(DEFAULT_CONFIG, null, 2);
      writeFileSync(paths.user, defaultConfigStr, "utf-8");
      return { status: "ok", message: `Created user config at ${paths.user}` };
    }

    return { status: "skip", message: "User config already exists" };
  } catch (error) {
    return { status: "fail", message: `Failed to create user config: ${error}` };
  }
}

/**
 * Create project configuration directory if needed
 */
function initProjectConfig(): { status: "ok" | "skip" | "fail"; message?: string } {
  const paths = getConfigPaths();
  const projectConfigDir = dirname(paths.project);

  try {
    if (!existsSync(projectConfigDir)) {
      mkdirSync(projectConfigDir, { recursive: true });
    }

    if (!existsSync(paths.project)) {
      const minimalConfig = {
        agents: {},
        features: { parallelExecution: true },
        permissions: {},
      };
      writeFileSync(paths.project, JSON.stringify(minimalConfig, null, 2), "utf-8");
      return { status: "ok", message: `Created project config at ${paths.project}` };
    }

    return { status: "skip", message: "Project config already exists" };
  } catch (error) {
    return { status: "fail", message: `Failed to create project config: ${error}` };
  }
}

/**
 * Create user commands directory if needed
 */
function initUserCommands(): { status: "ok" | "skip" | "fail"; message?: string } {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const userCommandsDir = join(homeDir, ".claude", "commands");

  try {
    if (!existsSync(userCommandsDir)) {
      mkdirSync(userCommandsDir, { recursive: true });
      return { status: "ok", message: `Created user commands directory at ${userCommandsDir}` };
    }
    return { status: "skip", message: "User commands directory already exists" };
  } catch (error) {
    return { status: "fail", message: `Failed to create user commands directory: ${error}` };
  }
}

/**
 * Verify dist is built (run build if needed)
 */
function checkBuild(): { status: "ok" | "skip" | "fail"; message?: string } {
  const distDir = join(process.cwd(), "dist");

  try {
    if (!existsSync(join(distDir, "cli.js"))) {
      return {
        status: "skip",
        message: "dist not built. Run: npm run build",
      };
    }
    return { status: "ok", message: "dist is built" };
  } catch (error) {
    return { status: "fail", message: `Build check failed: ${error}` };
  }
}

/**
 * Run setup
 */
export function runSetup(): SetupResult {
  const steps: SetupResult["steps"] = [];

  console.log(chalk.cyan("\nRunning claude-studio setup...\n"));

  // Run doctor checks first
  const doctorResult = runDoctorChecks();
  if (!doctorResult.healthy) {
    console.log(chalk.yellow("Warning: Doctor checks failed. Fix issues before proceeding.\n"));
    printDoctorResults(doctorResult);
  }

  // Step 1: User config
  steps.push({ name: "user-config", ...initUserConfig() });

  // Step 2: Project config
  steps.push({ name: "project-config", ...initProjectConfig() });

  // Step 3: User commands directory
  steps.push({ name: "user-commands", ...initUserCommands() });

  // Step 4: Build check
  steps.push({ name: "build", ...checkBuild() });

  return {
    success: steps.every((s) => s.status !== "fail"),
    steps,
  };
}

/**
 * Print setup results
 */
export function printSetupResults(result: SetupResult): void {
  console.log("\n" + "=".repeat(60));
  console.log("  SETUP RESULTS");
  console.log("=".repeat(60) + "\n");

  for (const step of result.steps) {
    const icon = step.status === "ok" ? "✓" : step.status === "skip" ? "○" : "✗";
    const color = step.status === "ok" ? "\x1b[32m" : step.status === "skip" ? "\x1b[33m" : "\x1b[31m";

    console.log(`${color}${icon}\x1b[0m ${step.name}: ${step.message || step.status}`);
  }

  console.log("\n" + "-".repeat(60));
  if (result.success) {
    console.log(chalk.green("Setup completed successfully!"));
  } else {
    console.log(chalk.red("Setup completed with errors. Please fix and retry."));
  }
  console.log("=".repeat(60) + "\n");
}
