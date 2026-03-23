/**
 * Commands Module
 *
 * Provides command expansion utilities for SDK integration.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import type { CommandInfo, ExpandedCommand } from "../types/index.js";

/**
 * Normalize line endings so frontmatter parsing works on Windows and Unix.
 */
function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, "\n");
}

/**
 * Get the user commands directory path.
 */
export function getCommandsDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  return join(homeDir, ".claude", "commands");
}

/**
 * Get the project-local commands directory path.
 */
export function getProjectCommandsDir(): string {
  return join(process.cwd(), ".claude", "commands");
}

/**
 * Get the built-in commands shipped with claude-studio.
 */
export function getBuiltInCommandsDir(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  return resolve(moduleDir, "../../commands");
}

/**
 * Get command directories in override order.
 */
export function getCommandSearchPaths(): string[] {
  return [getProjectCommandsDir(), getCommandsDir(), getBuiltInCommandsDir()];
}

/**
 * Parse command frontmatter and content
 */
function parseCommandFile(content: string): { description: string; template: string } {
  const normalized = normalizeLineEndings(content);
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { description: "", template: normalized };
  }

  const frontmatter = frontmatterMatch[1];
  const template = frontmatterMatch[2];

  const descMatch = frontmatter.match(/description:\s*(.+)/);
  const description = descMatch ? descMatch[1].trim() : "";

  return { description, template };
}

/**
 * Get a specific command by name
 */
export function getCommand(name: string): CommandInfo | null {
  for (const commandsDir of getCommandSearchPaths()) {
    const filePath = join(commandsDir, `${name}.md`);

    if (!existsSync(filePath)) {
      continue;
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      const { description, template } = parseCommandFile(content);

      return {
        name,
        description,
        template,
        filePath,
      };
    } catch (error) {
      console.error(`Error reading command ${name}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Get all available commands
 */
export function getAllCommands(): CommandInfo[] {
  const commands: CommandInfo[] = [];
  const seen = new Set<string>();

  for (const commandsDir of getCommandSearchPaths()) {
    if (!existsSync(commandsDir)) {
      continue;
    }

    try {
      const files = readdirSync(commandsDir).filter(
        (f) => f.endsWith(".md") && f !== "COMMANDS_INDEX.md"
      );

      for (const file of files) {
        const name = file.replace(".md", "");
        if (seen.has(name)) {
          continue;
        }

        const command = getCommand(name);
        if (command) {
          commands.push(command);
          seen.add(name);
        }
      }
    } catch (error) {
      console.error(`Error listing commands from ${commandsDir}:`, error);
    }
  }

  return commands;
}

/**
 * List available command names
 */
export function listCommands(): string[] {
  return getAllCommands().map((c) => c.name);
}

/**
 * Expand a command template with arguments
 *
 * @param name - Command name (without leading slash)
 * @param args - Arguments to substitute
 * @returns Expanded command ready for SDK query
 */
export function expandCommand(name: string, args: string = ""): ExpandedCommand | null {
  const command = getCommand(name);

  if (!command) {
    return null;
  }

  const prompt = command.template.replace(/\$ARGUMENTS/g, args);

  return {
    name,
    prompt: prompt.trim(),
    description: command.description,
  };
}

/**
 * Expand a command and return just the prompt string
 */
export function expandCommandPrompt(name: string, args: string = ""): string | null {
  const expanded = expandCommand(name, args);
  return expanded ? expanded.prompt : null;
}

/**
 * Check if a command exists
 */
export function commandExists(name: string): boolean {
  return getCommand(name) !== null;
}

/**
 * Batch expand multiple commands
 */
export function expandCommands(commands: Array<{ name: string; args?: string }>): ExpandedCommand[] {
  return commands
    .map(({ name, args }) => expandCommand(name, args))
    .filter((c): c is ExpandedCommand => c !== null);
}

/**
 * Command registry for built-in commands
 */
export interface BuiltInCommand {
  name: string;
  description: string;
  promptTemplate: string;
}

const BUILT_IN_COMMANDS: BuiltInCommand[] = [
  {
    name: "interview",
    description: "Requirements interview mode",
    promptTemplate:
      "You are entering a requirements interview mode. Ask clarifying questions about: $ARGUMENTS. Help the user articulate their needs clearly.",
  },
  {
    name: "spec",
    description: "Specification design mode",
    promptTemplate:
      "You are creating a technical specification. Based on the requirements: $ARGUMENTS. Document the architecture, interfaces, and acceptance criteria.",
  },
  {
    name: "plan",
    description: "Task planning mode",
    promptTemplate:
      "You are creating a task plan. Break down the work: $ARGUMENTS. Identify dependencies, estimate effort, and suggest execution order.",
  },
  {
    name: "code",
    description: "Code implementation mode",
    promptTemplate:
      "You are implementing code. Follow the specification: $ARGUMENTS. Write clean, type-safe, well-tested code.",
  },
  {
    name: "review",
    description: "Code review mode",
    promptTemplate:
      "You are reviewing code. Examine: $ARGUMENTS. Provide detailed feedback on correctness, style, and potential improvements.",
  },
  {
    name: "test",
    description: "Test and QA mode",
    promptTemplate:
      "You are validating the implementation. Run or describe the most relevant test and QA steps for: $ARGUMENTS. Summarize failures and evidence clearly.",
  },
  {
    name: "deploy",
    description: "Deployment mode",
    promptTemplate:
      "You are preparing and validating a deployment for: $ARGUMENTS. Check prerequisites, rollout steps, and rollback guidance before proceeding.",
  },
  {
    name: "canary",
    description: "Canary release mode",
    promptTemplate:
      "You are supervising a canary release for: $ARGUMENTS. Define traffic shift, health checks, and abort conditions before rollout.",
  },
  {
    name: "debug",
    description: "Debug mode",
    promptTemplate:
      "You are debugging. Investigate the issue: $ARGUMENTS. Identify root causes and propose fixes.",
  },
];

/**
 * Get a built-in command
 */
export function getBuiltInCommand(name: string): BuiltInCommand | null {
  return BUILT_IN_COMMANDS.find((c) => c.name === name) || null;
}

/**
 * Get all built-in command names
 */
export function listBuiltInCommands(): string[] {
  return BUILT_IN_COMMANDS.map((c) => c.name);
}

/**
 * Expand a built-in command
 */
export function expandBuiltInCommand(name: string, args: string = ""): ExpandedCommand | null {
  const command = getBuiltInCommand(name);

  if (!command) {
    return null;
  }

  const prompt = command.promptTemplate.replace(/\$ARGUMENTS/g, args);

  return {
    name: command.name,
    prompt: prompt.trim(),
    description: command.description,
  };
}

/**
 * Pipeline command definition
 */
export interface PipelineCommand {
  name: string;
  stages: PipelineStageCommand[];
  description: string;
}

export interface PipelineStageCommand {
  stage: string;
  command: string;
  prompt: string;
  agent: string;
}

/**
 * Full E2E pipeline stages in order
 */
const PIPELINE_STAGES: PipelineStageCommand[] = [
  {
    stage: "interview",
    command: "interview",
    prompt: "You are entering a requirements interview mode. Ask clarifying questions following the 8 dimensions: business understanding, feature boundaries, technical feasibility, data flow, interface contracts, error handling, non-functional requirements, and deployment. Help the user articulate their needs clearly. $ARGUMENTS",
    agent: "interviewer",
  },
  {
    stage: "spec",
    command: "spec",
    prompt: "You are creating a technical specification. Based on the requirements from interview: $ARGUMENTS. Document the architecture, interfaces, data models, and acceptance criteria in detail.",
    agent: "architect",
  },
  {
    stage: "plan",
    command: "plan",
    prompt: "You are creating a task plan. Break down the specification into actionable tasks. Identify P0/P1/P2 priorities, dependencies, and execution order. $ARGUMENTS",
    agent: "planner",
  },
  {
    stage: "code",
    command: "code",
    prompt: "You are implementing code following the plan. Write clean, type-safe, well-tested code. Follow project conventions and ensure all P0 tasks are completed first. $ARGUMENTS",
    agent: "executor",
  },
  {
    stage: "test",
    command: "test",
    prompt: "You are running tests and QA verification. Execute test commands, verify functionality matches spec, and report any failures. $ARGUMENTS",
    agent: "qa-tester",
  },
  {
    stage: "review",
    command: "review",
    prompt: "You are reviewing code for correctness, style, and potential improvements. Examine all changed files, verify test coverage, and provide actionable feedback. $ARGUMENTS",
    agent: "code-reviewer",
  },
  {
    stage: "deploy",
    command: "deploy",
    prompt: "You are deploying the application. Follow deployment procedures, verify environment configuration, and execute deployment commands. $ARGUMENTS",
    agent: "executor",
  },
  {
    stage: "canary",
    command: "canary",
    prompt: "You are managing a canary release. Monitor metrics, gradually shift traffic, and verify stability before full rollout. Report status continuously. $ARGUMENTS",
    agent: "qa-tester",
  },
];

/**
 * Expand the full E2E pipeline as a sequence of commands
 */
export function expandPipeline(args: string = ""): PipelineCommand {
  return {
    name: "e2e",
    description: "Full E2E execution pipeline: interview → spec → plan → code → test → review → deploy → canary",
    stages: PIPELINE_STAGES.map((s) => ({
      ...s,
      prompt: s.prompt.replace(/\$ARGUMENTS/g, args),
    })),
  };
}

/**
 * Get a specific stage from the pipeline
 */
export function getPipelineStage(stageName: string): PipelineStageCommand | null {
  return PIPELINE_STAGES.find((s) => s.stage === stageName) || null;
}

/**
 * Get all pipeline stage names in order
 */
export function listPipelineStages(): string[] {
  return PIPELINE_STAGES.map((s) => s.stage);
}
