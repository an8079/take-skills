/**
 * Claude Studio
 *
 * A multi-agent orchestration system for Claude Code.
 * Provides intelligent delegation, context management, and tool integration.
 *
 * Main features:
 * - Agent orchestration: Delegate tasks to specialized agents
 * - Parallel execution: Background agents run concurrently
 * - LSP/AST tools: IDE-like capabilities for agents
 * - Context management: Auto-injection from configuration files
 * - Command expansion: SDK-compatible slash command utilities
 */

// Types
export * from "./types/index.js";

// Utils
export { loadConfig, getDefaultConfig, deepMerge } from "./utils/config.js";
export { logger, createLogger, setLogLevel, getLogLevel, LogLevel } from "./utils/logger.js";

// Agents
export {
  AGENTS,
  getAgentDefinitions,
  getAgent,
  getAvailableAgents,
  getDefaultModelForCategory,
  isGptModel,
  isClaudeModel,
  createAgent,
  type AgentDefinition,
} from "./agents/index.js";

// Commands
export {
  expandCommand,
  expandCommandPrompt,
  getCommand,
  getAllCommands,
  listCommands,
  commandExists,
  expandCommands,
  getBuiltInCommand,
  listBuiltInCommands,
  expandBuiltInCommand,
} from "./commands/index.js";

/**
 * Version information
 */
export const VERSION = "1.0.0";

/**
 * Create a session with all agents configured
 */
export interface StudioSession {
  agents: Record<string, { description: string; prompt: string; model?: string }>;
  config: import("./types/index.js").PluginConfig;
  logger: ReturnType<typeof import("./utils/logger.js").createLogger>;
}

export function createSession(): StudioSession {
  const config = loadConfig();
  const agents = getAgentDefinitions();

  return {
    agents,
    config,
    logger: createLogger("claude-studio"),
  };
}
