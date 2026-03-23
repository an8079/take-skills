/**
 * Verify Command - Installation Integrity Verification
 *
 * Verifies that the claude-studio installation is complete and functional.
 */

import chalk from "chalk";
import { runDoctorChecks, printDoctorResults } from "./doctor.js";
import { listCommands } from "./index.js";
import { getAvailableAgents } from "../agents/index.js";

export interface VerifyResult {
  success: boolean;
  checks: {
    category: string;
    status: "pass" | "fail";
    message?: string;
  }[];
  summary: string;
}

/**
 * Verify installation integrity
 */
export function runVerify(): VerifyResult {
  const checks: VerifyResult["checks"] = [];

  // Run doctor checks as the primary verification
  const doctorResult = runDoctorChecks();

  checks.push({
    category: "system-health",
    status: doctorResult.healthy ? "pass" : "fail",
    message: doctorResult.summary,
  });

  // Verify core commands
  const coreCommands = ["interview", "spec", "plan", "code", "review"];
  const availableCommands = listCommands();
  const missingCommands = coreCommands.filter((cmd) => !availableCommands.includes(cmd));

  checks.push({
    category: "core-commands",
    status: missingCommands.length === 0 ? "pass" : "fail",
    message:
      missingCommands.length === 0
        ? `All ${coreCommands.length} core commands available`
        : `Missing: ${missingCommands.join(", ")}`,
  });

  // Verify agents
  const agents = getAvailableAgents();
  checks.push({
    category: "agents",
    status: agents.length > 0 ? "pass" : "fail",
    message: `${agents.length} agents loaded`,
  });

  // Verify dist
  const distCheck = doctorResult.checks.find((c) => c.name === "dist");
  if (distCheck) {
    checks.push({
      category: "dist",
      status: distCheck.status === "pass" ? "pass" : "fail",
      message: distCheck.message,
    });
  }

  const failures = checks.filter((c) => c.status === "fail");
  const summary =
    failures.length === 0
      ? "Verification passed - installation is complete"
      : `Verification failed - ${failures.length} check(s) failed`;

  return {
    success: failures.length === 0,
    checks,
    summary,
  };
}

/**
 * Print verify results
 */
export function printVerifyResults(result: VerifyResult): void {
  console.log("\n" + "=".repeat(60));
  console.log("  VERIFY RESULTS");
  console.log("=".repeat(60) + "\n");

  for (const check of result.checks) {
    const icon = check.status === "pass" ? "✓" : "✗";
    const color = check.status === "pass" ? "\x1b[32m" : "\x1b[31m";

    console.log(`${color}${icon}\x1b[0m ${check.category}: ${check.message}`);
  }

  console.log("\n" + "-".repeat(60));
  if (result.success) {
    console.log(chalk.green(result.summary));
  } else {
    console.log(chalk.red(result.summary));
    console.log(chalk.yellow("\nRun 'claude-studio setup' to fix issues.\n"));
  }
  console.log("=".repeat(60) + "\n");
}
