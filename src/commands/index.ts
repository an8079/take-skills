/**
 * Commands Module
 *
 * Provides command expansion utilities for SDK integration.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import type { CommandInfo, ExpandedCommand } from "../types/index.js";

/**
 * Get the commands directory path
 */
export function getCommandsDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  return join(homeDir, ".claude", "commands");
}

/**
 * Parse command frontmatter and content
 */
function parseCommandFile(content: string): { description: string; template: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { description: "", template: content };
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
  const commandsDir = getCommandsDir();
  const filePath = join(commandsDir, `${name}.md`);

  if (!existsSync(filePath)) {
    return null;
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

/**
 * Get all available commands
 */
export function getAllCommands(): CommandInfo[] {
  const commandsDir = getCommandsDir();

  if (!existsSync(commandsDir)) {
    return [];
  }

  try {
    const files = readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
    const commands: CommandInfo[] = [];

    for (const file of files) {
      const name = file.replace(".md", "");
      const command = getCommand(name);
      if (command) {
        commands.push(command);
      }
    }

    return commands;
  } catch (error) {
    console.error("Error listing commands:", error);
    return [];
  }
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
