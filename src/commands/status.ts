/**
 * Status Command - Display System Status
 *
 * Shows the current state of the claude-studio system.
 */

import chalk from "chalk";
import { join } from "path";
import { existsSync } from "fs";
import { getAvailableAgents, AGENTS } from "../agents/index.js";
import { listCommands, getBuiltInCommandsDir, getCommandSearchPaths } from "./index.js";
import { getConfigPaths } from "../utils/config.js";

export interface StatusInfo {
  version: string;
  node: string;
  system: {
    commands: { total: number; builtIn: number; searchPaths: string[] };
    agents: { total: number; categories: Record<string, number> };
    skills: { available: boolean };
    dist: { built: boolean };
    config: { user: string | null; project: string | null };
  };
  health: "healthy" | "degraded" | "unhealthy";
}

/**
 * Get system status
 */
export function getStatus(): StatusInfo {
  const version = "3.0.0"; // Should match package.json version
  const node = process.version;

  const builtInDir = getBuiltInCommandsDir();
  const searchPaths = getCommandSearchPaths();
  const commands = listCommands();
  const agents = getAvailableAgents();
  const configPaths = getConfigPaths();

  // Count commands by source
  const builtInExists = existsSync(builtInDir);
  const userDir = searchPaths[0];
  const userCommandsDir = join(process.env.HOME || process.env.USERPROFILE || "", ".claude", "commands");

  // Count agents by category
  const agentCategories: Record<string, number> = {};
  for (const agentName of agents) {
    const agent = AGENTS[agentName];
    if (agent) {
      const cat = agent.category || "unknown";
      agentCategories[cat] = (agentCategories[cat] || 0) + 1;
    }
  }

  // Check skills
  const skillsAvailable = existsSync(join(import.meta.url.replace("file://", ""), "../../skills")) ||
    existsSync(join(process.cwd(), "skills"));

  // Check dist
  const distBuilt = existsSync(join(process.cwd(), "dist", "cli.js"));

  // Determine health
  let health: StatusInfo["health"] = "healthy";
  if (!distBuilt || !builtInExists || commands.length < 5) {
    health = "unhealthy";
  } else if (agents.length < 3 || !distBuilt) {
    health = "degraded";
  }

  return {
    version,
    node,
    system: {
      commands: {
        total: commands.length,
        builtIn: builtInExists ? commands.length : 0,
        searchPaths,
      },
      agents: {
        total: agents.length,
        categories: agentCategories,
      },
      skills: {
        available: skillsAvailable,
      },
      dist: {
        built: distBuilt,
      },
      config: {
        user: existsSync(configPaths.user) ? configPaths.user : null,
        project: existsSync(configPaths.project) ? configPaths.project : null,
      },
    },
    health,
  };
}

/**
 * Print status
 */
export function printStatus(status: StatusInfo): void {
  const healthColor =
    status.health === "healthy" ? "\x1b[32m" : status.health === "degraded" ? "\x1b[33m" : "\x1b[31m";
  const healthIcon = status.health === "healthy" ? "✓" : status.health === "degraded" ? "!" : "✗";

  console.log("\n" + "=".repeat(60));
  console.log("  CLAUDE STUDIO STATUS");
  console.log("=".repeat(60) + "\n");

  // Basic info
  console.log(chalk.cyan("Version:    ") + status.version);
  console.log(chalk.cyan("Node.js:    ") + status.node);
  console.log(chalk.cyan("Health:     ") + `${healthColor}${healthIcon} ${status.health}\x1b[0m`);

  console.log("\n" + "-".repeat(60));

  // Commands
  console.log(chalk.bold("\nCommands:"));
  console.log(`  Total: ${status.system.commands.total}`);
  console.log(`  Search paths:`);
  for (const path of status.system.commands.searchPaths) {
    console.log(`    - ${path}`);
  }

  // Agents
  console.log(chalk.bold("\nAgents:"));
  console.log(`  Total: ${status.system.agents.total}`);
  for (const [cat, count] of Object.entries(status.system.agents.categories)) {
    console.log(`    ${cat}: ${count}`);
  }

  // Skills
  console.log(chalk.bold("\nSkills:"));
  console.log(`  Available: ${status.system.skills.available ? chalk.green("Yes") : chalk.red("No")}`);

  // Dist
  console.log(chalk.bold("\nBuild:"));
  console.log(
    `  dist/: ${status.system.dist.built ? chalk.green("Built") : chalk.red("Not built")}`
  );

  // Config
  console.log(chalk.bold("\nConfig:"));
  console.log(
    `  User: ${status.system.config.user ? chalk.green(status.system.config.user) : chalk.yellow("Not set")}`
  );
  console.log(
    `  Project: ${status.system.config.project ? chalk.green(status.system.config.project) : chalk.yellow("Not set")}`
  );

  console.log("\n" + "=".repeat(60) + "\n");
}
