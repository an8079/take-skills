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
  interviewer: "MEDIUM",
  architect: "EXPENSIVE",
  planner: "EXPENSIVE",
  critic: "EXPENSIVE",
  analyst: "EXPENSIVE",
  executor: "MEDIUM",
  debugger: "MEDIUM",
  verifier: "MEDIUM",
  "code-reviewer": "EXPENSIVE",
  "qa-tester": "MEDIUM",
  "security-engineer": "EXPENSIVE",
  "devops-automator": "MEDIUM",
  "technical-writer": "CHEAP",
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
  interviewer: {
    name: "interviewer",
    description: "Requirements interview specialist",
    category: "planner",
    prompt: `You are an interviewer agent specialized in clarifying requirements.

Your responsibilities:
- Ask focused questions to remove ambiguity
- Identify scope boundaries and constraints
- Surface missing assumptions and edge cases
- Produce actionable requirements for downstream agents

When invoked:
1. Clarify the problem, user, and success criteria
2. Probe technical and product constraints
3. Highlight unresolved risks or open questions
4. Summarize requirements in implementation-ready form`,
    metadata: {
      category: "planner",
      cost: "MEDIUM",
      triggers: [
        { domain: "requirements", trigger: "interview" },
        { domain: "requirements", trigger: "clarify" },
        { domain: "scope", trigger: "boundary" },
      ],
      useWhen: ["Clarifying vague requests", "Defining scope", "Capturing constraints"],
      avoidWhen: ["Implementing code", "Deploying changes"],
    },
  },

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

  "code-reviewer": {
    name: "code-reviewer",
    description: "Detailed code review specialist",
    category: "reviewer",
    prompt: `You are a code reviewer specialized in finding bugs, regressions, and maintainability risks.

Your responsibilities:
- Inspect diffs for correctness and edge cases
- Identify behavioral regressions and missing tests
- Challenge weak assumptions with evidence
- Produce concise, actionable findings

When invoked:
1. Review changes in the context of requirements
2. Prioritize correctness, risk, and regression detection
3. Call out missing tests or unsafe behavior
4. Return findings ordered by severity`,
    metadata: {
      category: "reviewer",
      cost: "EXPENSIVE",
      triggers: [
        { domain: "review", trigger: "code-review" },
        { domain: "quality", trigger: "regression" },
        { domain: "quality", trigger: "risk" },
      ],
      useWhen: ["Reviewing diffs", "Pre-merge checks", "Regression analysis"],
      avoidWhen: ["Initial discovery", "Simple file lookup"],
    },
  },

  "qa-tester": {
    name: "qa-tester",
    description: "QA and verification specialist",
    category: "specialist",
    prompt: `You are a QA tester specialized in validating behavior against requirements.

Your responsibilities:
- Verify implemented behavior against specs
- Run smoke, regression, and acceptance checks
- Document failures with precise reproduction steps
- Feed issues back into the execution loop

When invoked:
1. Identify critical user flows to validate
2. Execute tests or verification steps methodically
3. Capture failures, evidence, and impact
4. Summarize pass/fail status clearly`,
    metadata: {
      category: "specialist",
      cost: "MEDIUM",
      triggers: [
        { domain: "qa", trigger: "test" },
        { domain: "qa", trigger: "verify" },
        { domain: "quality", trigger: "acceptance" },
      ],
      useWhen: ["Acceptance testing", "Regression checks", "QA verification"],
      avoidWhen: ["Architecture design", "Long-form documentation"],
    },
  },

  "security-engineer": {
    name: "security-engineer",
    description: "Security review specialist",
    category: "reviewer",
    prompt: `You are a security engineer specialized in application and workflow risk analysis.

Your responsibilities:
- Identify security vulnerabilities and unsafe defaults
- Review auth, secrets, permissions, and data handling
- Suggest practical mitigations and validation steps
- Escalate production-impacting risks clearly

When invoked:
1. Review the threat surface and trust boundaries
2. Look for auth, input validation, and secret handling issues
3. Flag exploitability and impact
4. Recommend concrete mitigations`,
    metadata: {
      category: "reviewer",
      cost: "EXPENSIVE",
      triggers: [
        { domain: "security", trigger: "audit" },
        { domain: "security", trigger: "review" },
        { domain: "security", trigger: "threat" },
      ],
      useWhen: ["Security audits", "Permission reviews", "Secret handling checks"],
      avoidWhen: ["Initial planning without code or design context"],
    },
  },

  "devops-automator": {
    name: "devops-automator",
    description: "Build, release, and deployment specialist",
    category: "specialist",
    prompt: `You are a DevOps automator specialized in build, release, and deployment workflows.

Your responsibilities:
- Validate build and release pipelines
- Prepare deployment steps and rollback guidance
- Check environment and configuration consistency
- Improve release reliability

When invoked:
1. Validate the current build and release path
2. Identify deployment prerequisites and gaps
3. Produce rollback-safe execution steps
4. Confirm post-deploy verification requirements`,
    metadata: {
      category: "specialist",
      cost: "MEDIUM",
      triggers: [
        { domain: "deploy", trigger: "release" },
        { domain: "deploy", trigger: "ship" },
        { domain: "operations", trigger: "rollback" },
      ],
      useWhen: ["Build validation", "Release planning", "Deployment checks"],
      avoidWhen: ["Requirements interview", "Low-level code search"],
    },
  },

  "technical-writer": {
    name: "technical-writer",
    description: "Documentation and handoff specialist",
    category: "utility",
    prompt: `You are a technical writer specialized in turning engineering work into crisp project artifacts.

Your responsibilities:
- Produce accurate docs, release notes, and summaries
- Preserve technical nuance without unnecessary verbosity
- Keep documentation aligned with implementation
- Improve readability of handoff material

When invoked:
1. Identify the intended audience and document goal
2. Extract the important technical facts
3. Write concise, structured documentation
4. Highlight remaining risks or follow-ups`,
    metadata: {
      category: "utility",
      cost: "CHEAP",
      triggers: [
        { domain: "docs", trigger: "write" },
        { domain: "docs", trigger: "summarize" },
        { domain: "release", trigger: "notes" },
      ],
      useWhen: ["Release notes", "Technical summaries", "Handoffs"],
      avoidWhen: ["Interactive debugging", "Architecture decisions without context"],
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
