/**
 * Type Definitions for Claude Studio
 *
 * Core type system for multi-agent orchestration.
 */

/**
 * Model tier for agent routing
 */
export type ModelType = "sonnet" | "opus" | "haiku" | "inherit";

/**
 * Cost tier for agent usage
 */
export type AgentCost = "FREE" | "CHEAP" | "EXPENSIVE";

/**
 * Agent category for routing and grouping
 */
export type AgentCategory =
  | "exploration"
  | "specialist"
  | "advisor"
  | "utility"
  | "orchestration"
  | "planner"
  | "reviewer";

/**
 * Trigger condition for delegation
 */
export interface DelegationTrigger {
  domain: string;
  trigger: string;
}

/**
 * Metadata about an agent for dynamic prompt generation
 */
export interface AgentPromptMetadata {
  category: AgentCategory;
  cost: AgentCost;
  promptAlias?: string;
  triggers: DelegationTrigger[];
  useWhen?: string[];
  avoidWhen?: string[];
  promptDescription?: string;
  tools?: string[];
}

/**
 * Base agent configuration
 */
export interface AgentConfig {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  disallowedTools?: string[];
  model?: string;
  defaultModel?: string;
  metadata?: AgentPromptMetadata;
}

/**
 * Extended agent config with all optional fields
 */
export interface FullAgentConfig extends AgentConfig {
  temperature?: number;
  maxTokens?: number;
  thinking?: {
    type: "enabled" | "disabled";
    budgetTokens?: number;
  };
  toolRestrictions?: string[];
}

/**
 * Agent override configuration
 */
export interface AgentOverrideConfig {
  model?: string;
  enabled?: boolean;
  prompt_append?: string;
  temperature?: number;
}

/**
 * Map of agent overrides
 */
export type AgentOverrides = Partial<Record<string, AgentOverrideConfig>>;

/**
 * Factory function for creating agents
 */
export type AgentFactory = (model?: string) => AgentConfig;

/**
 * Available agent descriptor
 */
export interface AvailableAgent {
  name: string;
  description: string;
  metadata: AgentPromptMetadata;
}

/**
 * Session state for tracking active agents and tasks
 */
export interface SessionState {
  sessionId?: string;
  activeAgents: Map<string, AgentState>;
  backgroundTasks: BackgroundTask[];
  contextFiles: string[];
}

/**
 * State of a single agent
 */
export interface AgentState {
  name: string;
  status: "idle" | "running" | "completed" | "error";
  lastMessage?: string;
  startTime?: number;
}

/**
 * Background task descriptor
 */
export interface BackgroundTask {
  id: string;
  agentName: string;
  prompt: string;
  status: "pending" | "running" | "completed" | "error";
  result?: string;
  error?: string;
}

/**
 * Magic keyword definition
 */
export interface MagicKeyword {
  triggers: string[];
  action: (prompt: string) => string;
  description: string;
}

/**
 * Hook event types
 */
export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "Stop"
  | "SessionStart"
  | "SessionEnd"
  | "UserPromptSubmit";

/**
 * Hook definition
 */
export interface HookDefinition {
  event: HookEvent;
  matcher?: string;
  command?: string;
  handler?: (context: HookContext) => Promise<HookResult>;
}

/**
 * Hook context
 */
export interface HookContext {
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  sessionId?: string;
}

/**
 * Hook result
 */
export interface HookResult {
  continue: boolean;
  message?: string;
  modifiedInput?: unknown;
}

/**
 * Command info
 */
export interface CommandInfo {
  name: string;
  description: string;
  template: string;
  filePath: string;
}

/**
 * Expanded command
 */
export interface ExpandedCommand {
  name: string;
  prompt: string;
  description: string;
}

/**
 * Task execution decision
 */
export interface TaskExecutionDecision {
  shouldRunInBackground: boolean;
  reason: string;
}

/**
 * Background task manager interface
 */
export interface BackgroundTaskManager {
  addTask(agentName: string, prompt: string): string;
  getTask(id: string): BackgroundTask | undefined;
  getRunningCount(): number;
  getMaxTasks(): number;
  updateTaskStatus(id: string, status: BackgroundTask["status"], result?: string, error?: string): void;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  agents?: Record<string, { model?: string; enabled?: boolean }>;
  features?: {
    parallelExecution?: boolean;
    lspTools?: boolean;
    astTools?: boolean;
    continuationEnforcement?: boolean;
    autoContextInjection?: boolean;
  };
  permissions?: {
    allowBash?: boolean;
    allowEdit?: boolean;
    allowWrite?: boolean;
    maxBackgroundTasks?: number;
  };
  magicKeywords?: {
    ultrawork?: string[];
    search?: string[];
    analyze?: string[];
    ultrathink?: string[];
  };
}

/**
 * Model family for Claude models
 */
export type ClaudeModelFamily = "HAIKU" | "SONNET" | "OPUS";

/**
 * Model tier
 */
export type ModelTier = "LOW" | "MEDIUM" | "HIGH";
