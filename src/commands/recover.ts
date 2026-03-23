/**
 * Recover Command
 *
 * Recovers an unfinished session from STATE.json.
 */

import chalk from "chalk";
import {
  detectUnfinishedSession,
  recoverSession,
  clearState,
  getUnfinishedSessionSummary,
} from "../state/index.js";

export interface RecoverResult {
  success: boolean;
  recovered: boolean;
  message: string;
}

/**
 * Run the recover command
 */
export function runRecover(): RecoverResult {
  const summary = getUnfinishedSessionSummary();

  if (!summary.available) {
    return {
      success: false,
      recovered: false,
      message: "No unfinished session found to recover.",
    };
  }

  console.log(chalk.cyan("\n=== Session Recovery ===\n"));
  console.log(chalk.white(summary.summary));
  if (summary.age) {
    console.log(chalk.gray(`Last saved: ${summary.age}`));
  }

  if (summary.details) {
    console.log("");
    if (summary.details.phaseCount !== undefined) {
      console.log(chalk.cyan("Phases:     ") + summary.details.phaseCount);
    }
    if (summary.details.artifactCount !== undefined) {
      console.log(chalk.cyan("Artifacts:  ") + summary.details.artifactCount);
    }
    if (summary.details.currentStage !== undefined) {
      console.log(chalk.cyan("Stage:      ") + (summary.details.currentStage || "None"));
    }
  }

  console.log("");

  // Attempt recovery
  const result = recoverSession();

  if (result.recovered) {
    console.log(chalk.green("\n✓ Session recovered successfully!\n"));

    if (result.details) {
      if (result.details.phaseTracker) {
        const progress = result.details.phaseTracker.getProgress();
        console.log(chalk.cyan("Phase Progress:"));
        console.log(`  Total: ${progress.total}`);
        console.log(`  Completed: ${progress.completed}`);
        console.log(`  Active: ${progress.active}`);
        console.log(`  Blocked: ${progress.blocked}`);
        console.log(`  Draft: ${progress.draft}`);
        console.log("");
      }

      if (result.details.artifactCount !== undefined) {
        console.log(chalk.cyan(`Artifacts Restored: ${result.details.artifactCount}\n`));
      }
    }

    return {
      success: true,
      recovered: true,
      message: result.message,
    };
  } else {
    console.log(chalk.red("\n✗ Recovery failed\n"));
    console.log(chalk.gray(result.message));

    return {
      success: false,
      recovered: false,
      message: result.message,
    };
  }
}

/**
 * Print recover results
 */
export function printRecoverResults(result: RecoverResult): void {
  if (result.recovered) {
    console.log(chalk.green("Session recovery completed successfully."));
  } else {
    console.log(chalk.yellow("No session to recover."));
    console.log(chalk.gray(result.message));
  }
}

/**
 * Run clear state (for after successful completion)
 */
export function runClearState(): { success: boolean; message: string } {
  return clearState();
}

/**
 * Print clear state results
 */
export function printClearStateResults(result: { success: boolean; message: string }): void {
  if (result.success) {
    console.log(chalk.green("✓ ") + result.message);
  } else {
    console.log(chalk.red("✗ ") + result.message);
  }
}
