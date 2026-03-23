#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import packageJson from "../package.json" assert { type: "json" };
import {
  expandCommand,
  expandPipeline,
  getBuiltInCommandsDir,
  getCommand,
  getCommandSearchPaths,
  listCommands,
} from "./commands/index.js";
import { AGENTS, getAvailableAgents } from "./agents/index.js";
import { runDoctorChecks, printDoctorResults } from "./commands/doctor.js";
import { runSetup, printSetupResults } from "./commands/setup.js";
import { runVerify, printVerifyResults } from "./commands/verify.js";
import { getStatus, printStatus } from "./commands/status.js";
import { printPipelineInfo } from "./commands/pipeline-run.js";

const { version } = packageJson;
const program = new Command();

function printInfo(label: string, value: string): void {
  console.log(`${chalk.cyan(label)} ${value}`);
}

function joinArgs(args: string[]): string {
  return args.join(" ").trim();
}

program
  .name("claude-studio")
  .alias("cs")
  .description("Advanced Claude Code development assistant")
  .version(version);

program
  .command("commands")
  .description("List all resolved slash commands")
  .action(() => {
    for (const command of listCommands()) {
      console.log(command);
    }
  });

program
  .command("agents")
  .description("List all built-in agents")
  .action(() => {
    for (const agentName of getAvailableAgents()) {
      const agent = AGENTS[agentName];
      console.log(`${agentName}\t${agent.description}`);
    }
  });

program
  .command("command")
  .description("Resolve a slash command and print the expanded prompt")
  .argument("<name>", "Command name without leading slash")
  .argument("[args...]", "Optional command arguments")
  .action((name: string, args: string[]) => {
    const expanded = expandCommand(name, joinArgs(args ?? []));
    if (!expanded) {
      console.error(chalk.red(`Unknown command: ${name}`));
      process.exitCode = 1;
      return;
    }

    printInfo("Name:", expanded.name);
    printInfo("Description:", expanded.description);
    printInfo("Source:", getCommand(name)?.filePath ?? "unknown");
    console.log("");
    console.log(expanded.prompt);
  });

// Doctor command - enhanced health checks
program
  .command("doctor")
  .description("Run comprehensive health checks on the installation")
  .action(() => {
    const result = runDoctorChecks();
    printDoctorResults(result);
    if (!result.healthy) {
      process.exitCode = 1;
    }
  });

// Setup command - install dependencies and initialize config
program
  .command("setup")
  .description("Install dependencies and initialize configuration")
  .action(() => {
    const result = runSetup();
    printSetupResults(result);
    if (!result.success) {
      process.exitCode = 1;
    }
  });

// Verify command - verify installation integrity
program
  .command("verify")
  .description("Verify installation integrity")
  .action(() => {
    const result = runVerify();
    printVerifyResults(result);
    if (!result.success) {
      process.exitCode = 1;
    }
  });

// Status command - display system status
program
  .command("status")
  .description("Display system status")
  .action(() => {
    const status = getStatus();
    printStatus(status);
  });

// Pipeline command group
const pipelineCmd = program
  .command("pipeline")
  .description("Pipeline operations");

pipelineCmd
  .command("show")
  .description("Print the canonical E2E pipeline and expanded stage prompts")
  .argument("[args...]", "Optional pipeline arguments")
  .action((args: string[]) => {
    const pipeline = expandPipeline(joinArgs(args ?? []));
    printInfo("Pipeline:", pipeline.description);
    console.log("");
    for (const stage of pipeline.stages) {
      console.log(
        `${chalk.green(stage.stage)}\t${stage.agent}\t/${stage.command}`
      );
    }
  });

pipelineCmd
  .command("run")
  .description("Check pipeline readiness and show pipeline info")
  .action(() => {
    printPipelineInfo();
  });

program.parse(process.argv);
