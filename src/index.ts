/**
 * Claude Studio
 *
 * A multi-agent orchestration system for Claude Code.
 * Provides intelligent delegation, context management, and tool integration.
 */

// Types
export * from "./types/index.js";
export type { PluginConfig } from "./types/index.js";

// Utils
import { loadConfig, getDefaultConfig, deepMerge } from "./utils/config.js";
import { logger, createLogger, setLogLevel, getLogLevel, LogLevel } from "./utils/logger.js";
export { loadConfig, getDefaultConfig, deepMerge };
export { logger, createLogger, setLogLevel, getLogLevel, LogLevel };

// Agents
import { AGENTS, getAgentDefinitions, getAgent, getAvailableAgents, getDefaultModelForCategory, isGptModel, isClaudeModel, createAgent } from "./agents/index.js";
export { AGENTS, getAgentDefinitions, getAgent, getAvailableAgents, getDefaultModelForCategory, isGptModel, isClaudeModel, createAgent };

// Commands
import { expandCommand, expandCommandPrompt, getCommand, getAllCommands, listCommands, commandExists, expandCommands, getBuiltInCommand, listBuiltInCommands, expandBuiltInCommand, expandPipeline, getBuiltInCommandsDir, getCommandSearchPaths, getProjectCommandsDir } from "./commands/index.js";
export { expandCommand, expandCommandPrompt, getCommand, getAllCommands, listCommands, commandExists, expandCommands, getBuiltInCommand, listBuiltInCommands, expandBuiltInCommand, expandPipeline, getBuiltInCommandsDir, getCommandSearchPaths, getProjectCommandsDir };

// Pipeline
import { Pipeline, DEFAULT_STAGES } from "./pipeline/index.js";
export { Pipeline, DEFAULT_STAGES };

// Runner
import { TaskRunner, DEFAULT_RUNNER_CONFIG } from "./runner/index.js";
export { TaskRunner, DEFAULT_RUNNER_CONFIG };

// Phase Manager
import { PhaseStateMachine, STAGE_GATES, PhaseTracker, ApprovalWorkflow } from "./phase-manager/index.js";
export { PhaseStateMachine, STAGE_GATES, PhaseTracker, ApprovalWorkflow };

// Governance
import { ProcessController, AuditLog } from "./governance/index.js";
export { ProcessController, AuditLog };

// Validator
import { PhaseChecker, DeliverableChecker } from "./validator/index.js";
export { PhaseChecker, DeliverableChecker };

// Metrics
import { MetricsCollector, metricsCollector, latencySummary, p50, p75, p90, p95, p99, avg, min, max, formatDuration, formatBytes } from "./metrics/index.js";
export { MetricsCollector, metricsCollector, latencySummary, p50, p75, p90, p95, p99, avg, min, max, formatDuration, formatBytes };

// Team Collaboration
import * as Team from "./team/index.js";
export { Team };

// State Tools
export * from "./mcp/state-tools.js";

/**
 * Version information
 */
export const VERSION = "3.1.0";

/**
 * Create a session with all agents configured
 */
export interface StudioSession {
  agents: Record<string, { description: string; prompt: string; model?: string }>;
  config: import("./types/index.js").PluginConfig;
  logger: ReturnType<typeof createLogger>;
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
