/**
 * Agents Module
 *
 * Manages agent definitions and configurations for Claude Studio.
 */

import type {
  AgentConfig,
  AgentPromptMetadata,
  ModelType,
  AgentCategory,
  AgentCost,
} from "../types/index.js";

/**
 * Default model for each agent category
 */
export function getDefaultModelForCategory(category: AgentCategory): ModelType {
  switch (category) {
    case "exploration":
      return "haiku";
    case "specialist":
      return "sonnet";
    case "advisor":
      return "opus";
    case "utility":
      return "haiku";
    case "orchestration":
      return "sonnet";
    case "planner":
      return "opus";
    case "reviewer":
      return "sonnet";
    default:
      return "sonnet";
  }
}

/**
 * Check if a model ID is a GPT model
 */
export function isGptModel(modelId: string): boolean {
  return modelId.toLowerCase().includes("gpt");
}

/**
 * Check if a model ID is a Claude model
 */
export function isClaudeModel(modelId: string): boolean {
  return modelId.toLowerCase().includes("claude");
}

/**
 * Cost tiers for different agent types
 */
export const AGENT_COSTS: Record<string, AgentCost> = {
  explore: "CHEAP",
  writer: "CHEAP",
  architect: "EXPENSIVE",
  planner: "EXPENSIVE",
  critic: "EXPENSIVE",
  analyst: "EXPENSIVE",
  executor: "MEDIUM",
  debugger: "MEDIUM",
  verifier: "MEDIUM",
  securityReviewer: "MEDIUM",
  codeReviewer: "EXPENSIVE",
  testEngineer: "MEDIUM",
  designer: "MEDIUM",
  qaTester: "MEDIUM",
  scientist: "MEDIUM",
  tracer: "MEDIUM",
  gitMaster: "MEDIUM",
  codeSimplifier: "EXPENSIVE",
  documentSpecialist: "MEDIUM",
};

/**
 * Built-in agent definitions
 */
export interface AgentDefinition {
  name: string;
  description: string;
  prompt: string;
  category: AgentCategory;
  metadata: AgentPromptMetadata;
}

/**
 * Create a basic agent configuration
 */
export function createAgent(config: {
  name: string;
  description: string;
  prompt: string;
  category: AgentCategory;
  triggers?: Array<{ domain: string; trigger: string }>;
}): AgentConfig {
  return {
    name: config.name,
    description: config.description,
    prompt: config.prompt,
    defaultModel: getDefaultModelForCategory(config.category),
    metadata: {
      category: config.category,
      cost: AGENT_COSTS[config.name] || "MEDIUM",
      triggers: config.triggers || [],
    },
  };
}

/**
 * Built-in agent definitions
 */
export const AGENTS: Record<string, AgentDefinition> = {
  architect: {
    name: "architect",
    description: "Architecture design specialist",
    category: "advisor",
    prompt: `You are an architect agent specialized in system design.

Your responsibilities:
- Design scalable and maintainable system architectures
- Evaluate trade-offs between different approaches
- Provide strategic technical guidance
- Review and refine architectural decisions

When invoked:
1. Understand the requirements and constraints
2. Propose appropriate architectural patterns
3. Consider scalability, reliability, and maintainability
4. Document architectural decisions clearly`,
    metadata: {
      category: "advisor",
      cost: "EXPENSIVE",
      triggers: [
        { domain: "architecture", trigger: "design" },
        { domain: "architecture", trigger: "architect" },
        { domain: "system", trigger: "scalability" },
      ],
      useWhen: ["Designing new systems", "Evaluating architecture", "Planning refactors"],
      avoidWhen: ["Quick bug fixes", "Simple code changes"],
    },
  },

  explorer: {
    name: "explorer",
    description: "Code exploration and search specialist",
    category: "exploration",
    prompt: `You are an explorer agent specialized in code discovery.

Your responsibilities:
- Search and locate relevant code
- Understand codebase structure
- Find patterns and relationships
- Identify files and components

When invoked:
1. Use search tools effectively (Grep, Glob, etc.)
2. Map code relationships
3. Provide context about findings
4. Navigate complex codebases efficiently`,
    metadata: {
      category: "exploration",
      cost: "CHEAP",
      triggers: [
        { domain: "search", trigger: "find" },
        { domain: "search", trigger: "where" },
        { domain: "explore", trigger: "search" },
      ],
      useWhen: ["Finding files", "Understanding structure", "Searching for patterns"],
      avoidWhen: ["Writing new code", "Complex refactoring"],
    },
  },

  planner: {
    name: "planner",
    description: "Strategic planning specialist",
    category: "planner",
    prompt: `You are a planner agent specialized in strategic planning.

Your responsibilities:
- Break down complex tasks into manageable steps
- Identify dependencies and risks
- Estimate effort and timeline
- Coordinate execution strategy

When invoked:
1. Analyze the overall objective
2. Identify key milestones
3. Break down into actionable tasks
4. Suggest execution order and priorities`,
    metadata: {
      category: "planner",
      cost: "EXPENSIVE",
      triggers: [
        { domain: "planning", trigger: "plan" },
        { domain: "planning", trigger: "break down" },
        { domain: "strategy", trigger: "organize" },
      ],
      useWhen: ["Planning projects", "Task breakdown", "Roadmap creation"],
      avoidWhen: ["Quick answers", "Simple queries"],
    },
  },

  executor: {
    name: "executor",
    description: "Code implementation specialist",
    category: "specialist",
    prompt: `You are an executor agent specialized in code implementation.

Your responsibilities:
- Implement features and fixes
- Write clean, maintainable code
- Follow project conventions
- Ensure type safety

When invoked:
1. Understand the requirements clearly
2. Implement with quality and speed
3. Write tests alongside code
4. Handle edge cases appropriately`,
    metadata: {
      category: "specialist",
      cost: "MEDIUM",
      triggers: [
        { domain: "implementation", trigger: "implement" },
        { domain: "implementation", trigger: "build" },
        { domain: "code", trigger: "write" },
      ],
      useWhen: ["Implementing features", "Writing code", "Building functionality"],
      avoidWhen: ["Architectural planning", "Code review"],
    },
  },

  reviewer: {
    name: "reviewer",
    description: "Code review specialist",
    category: "reviewer",
    prompt: `You are a reviewer agent specialized in code evaluation.

Your responsibilities:
- Review code for correctness
- Identify potential bugs and issues
- Suggest improvements
- Ensure code quality

When invoked:
1. Understand the context and requirements
2. Evaluate code structure and patterns
3. Identify issues and risks
4. Provide actionable feedback`,
    metadata: {
      category: "reviewer",
      cost: "EXPENSIVE",
      triggers: [
        { domain: "review", trigger: "review" },
        { domain: "quality", trigger: "check" },
        { domain: "feedback", trigger: "evaluate" },
      ],
      useWhen: ["Code reviews", "Quality assurance", "Pre-commit checks"],
      avoidWhen: ["Initial implementation", "Quick prototyping"],
    },
  },

  debugger: {
    name: "debugger",
    description: "Debugging specialist",
    category: "specialist",
    prompt: `You are a debugger agent specialized in problem solving.

Your responsibilities:
- Investigate and diagnose issues
- Identify root causes
- Propose and validate fixes
- Prevent future occurrences

When invoked:
1. Gather information about the problem
2. Reproduce the issue if possible
3. Identify potential causes
4. Implement and test fixes`,
    metadata: {
      category: "specialist",
      cost: "MEDIUM",
      triggers: [
        { domain: "debug", trigger: "debug" },
        { domain: "fix", trigger: "fix" },
        { domain: "issue", trigger: "investigate" },
      ],
      useWhen: ["Bug investigation", "Problem diagnosis", "Fix validation"],
      avoidWhen: ["New feature development", "Code organization"],
    },
  },
};

/**
 * Get all available agent definitions
 */
export function getAgentDefinitions(): Record<string, AgentConfig> {
  const result: Record<string, AgentConfig> = {};

  for (const [key, agent] of Object.entries(AGENTS)) {
    result[key] = {
      name: agent.name,
      description: agent.description,
      prompt: agent.prompt,
      defaultModel: getDefaultModelForCategory(agent.category),
      metadata: agent.metadata,
    };
  }

  return result;
}

/**
 * Get a specific agent by name
 */
export function getAgent(name: string): AgentConfig | null {
  const agent = AGENTS[name];
  if (!agent) return null;

  return {
    name: agent.name,
    description: agent.description,
    prompt: agent.prompt,
    defaultModel: getDefaultModelForCategory(agent.category),
    metadata: agent.metadata,
  };
}

/**
 * Get all available agent names
 */
export function getAvailableAgents(): string[] {
  return Object.keys(AGENTS);
}
