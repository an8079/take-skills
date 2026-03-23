/**
 * Pipeline Run Command - Execute the E2E Pipeline
 *
 * Runs the full E2E pipeline: interview → spec → plan → code → test → review → deploy → canary
 */

import chalk from "chalk";
import { expandPipeline, listPipelineStages } from "./index.js";

export interface PipelineRunResult {
  pipeline: string;
  stages: string[];
  status: "ready" | "not-ready";
  message: string;
}

/**
 * Check if pipeline is ready to run
 */
export function checkPipelineReady(): PipelineRunResult {
  const stages = listPipelineStages();
  const pipeline = expandPipeline();

  // Verify all stages have prompts
  const missingPrompts = pipeline.stages.filter((s) => !s.prompt || s.prompt.length === 0);

  if (missingPrompts.length > 0) {
    return {
      pipeline: pipeline.description,
      stages,
      status: "not-ready",
      message: `Missing prompts for stages: ${missingPrompts.map((s) => s.stage).join(", ")}`,
    };
  }

  return {
    pipeline: pipeline.description,
    stages,
    status: "ready",
    message: `Pipeline ready with ${stages.length} stages`,
  };
}

/**
 * Print pipeline info
 */
export function printPipelineInfo(): void {
  const check = checkPipelineReady();

  console.log("\n" + "=".repeat(60));
  console.log("  PIPELINE RUN");
  console.log("=".repeat(60) + "\n");

  console.log(chalk.bold("Pipeline: ") + check.pipeline);
  console.log(chalk.bold("Status:   ") + (check.status === "ready" ? chalk.green("Ready") : chalk.red("Not Ready")));

  console.log(chalk.bold("\nStages:"));
  for (let i = 0; i < check.stages.length; i++) {
    console.log(`  ${i + 1}. ${check.stages[i]}`);
  }

  console.log("\n" + "-".repeat(60));
  console.log(check.message);
  console.log("=".repeat(60) + "\n");

  if (check.status === "ready") {
    console.log(chalk.cyan("Usage:"));
    console.log("  This command runs the full E2E pipeline.");
    console.log("  Each stage will be executed in sequence using the appropriate agent.\n");
  }
}
