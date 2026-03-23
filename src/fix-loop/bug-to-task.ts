/**
 * Bug to Task Conversion Rules
 *
 * Transforms bug reports into actionable tasks with proper priority,
 * categorization, and ownership assignment.
 */

/**
 * Task priority levels
 */
export type TaskPriority = "P0" | "P1" | "P2" | "P3";

/**
 * Task category based on bug type
 */
export type TaskCategory =
  | "crash_fix"
  | "logic_fix"
  | "ui_fix"
  | "perf_fix"
  | "security_fix"
  | "data_fix"
  | "config_fix";

/**
 * Task status
 */
export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";

/**
 * Task record created from bug report
 */
export interface TaskRecord {
  id: string;
  bugId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  assignee?: string;
  labels: string[];
  acceptanceCriteria: string[];
}

/**
 * Bug severity levels
 */
export type BugSeverity = "critical" | "high" | "medium" | "low";

/**
 * Bug report interface
 */
export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  component?: string;
  stackTrace?: string;
  stepsToReproduce?: string[];
  expectedBehavior: string;
  actualBehavior: string;
  timestamp: number;
  reporter?: string;
  tags?: string[];
}

/**
 * Mapping from severity to task priority
 */
const SEVERITY_TO_PRIORITY: Record<BugSeverity, TaskPriority> = {
  critical: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
};

/**
 * Keywords that indicate bug category
 */
const CATEGORY_KEYWORDS: Record<TaskCategory, string[]> = {
  crash_fix: ["crash", "panic", "fatal", "abort", "segfault", "out of memory"],
  logic_fix: ["logic", "incorrect", "wrong", "bug", "error in calculation"],
  ui_fix: ["ui", "visual", "display", "render", "layout", "style", "css"],
  perf_fix: ["slow", "performance", "latency", "timeout", "bottleneck"],
  security_fix: ["security", "xss", "injection", "auth", "permission", "exploit"],
  data_fix: ["data", "database", "corruption", "loss", "sync", "consistency"],
  config_fix: ["config", "configuration", "setting", "environment", "flag"],
};

/**
 * Detect task category from bug report
 */
function detectCategory(bug: BugReport): TaskCategory {
  const searchText = [
    bug.title,
    bug.description,
    bug.actualBehavior,
    ...(bug.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  let bestMatch: TaskCategory = "logic_fix";
  let highestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        score++;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = category as TaskCategory;
    }
  }

  return bestMatch;
}

/**
 * Generate acceptance criteria from bug report
 */
function generateAcceptanceCriteria(bug: BugReport): string[] {
  const criteria: string[] = [];

  // Must fix the actual behavior
  criteria.push(`Fix: ${bug.actualBehavior}`);

  // Should match expected behavior
  criteria.push(`Verify: ${bug.expectedBehavior}`);

  // Add steps to reproduce as test criteria
  if (bug.stepsToReproduce && bug.stepsToReproduce.length > 0) {
    criteria.push(
      `Test: Reproduce using steps from bug report (${bug.stepsToReproduce.length} steps)`
    );
  }

  // Component-specific validation
  if (bug.component) {
    criteria.push(`Verify: Component '${bug.component}' functions correctly`);
  }

  return criteria;
}

/**
 * Generate task title from bug report
 */
function generateTaskTitle(bug: BugReport): string {
  const component = bug.component ? `[${bug.component}] ` : "";
  const truncatedDesc = bug.title.length > 80 ? bug.title.slice(0, 77) + "..." : bug.title;
  return `${component}Fix: ${truncatedDesc}`;
}

/**
 * Convert a bug report to a task record
 */
export function bugToTask(bug: BugReport): TaskRecord {
  const now = Date.now();

  return {
    id: `task_${bug.id}`,
    bugId: bug.id,
    title: generateTaskTitle(bug),
    description: buildTaskDescription(bug),
    priority: SEVERITY_TO_PRIORITY[bug.severity],
    category: detectCategory(bug),
    status: "pending",
    createdAt: now,
    updatedAt: now,
    labels: buildLabels(bug),
    acceptanceCriteria: generateAcceptanceCriteria(bug),
  };
}

/**
 * Build detailed task description
 */
function buildTaskDescription(bug: BugReport): string {
  const parts: string[] = [];

  parts.push(`## Bug Summary\n${bug.description}`);
  parts.push(`\n### Expected Behavior\n${bug.expectedBehavior}`);
  parts.push(`\n### Actual Behavior\n${bug.actualBehavior}`);

  if (bug.stepsToReproduce && bug.stepsToReproduce.length > 0) {
    parts.push(`\n### Steps to Reproduce`);
    bug.stepsToReproduce.forEach((step, i) => {
      parts.push(`${i + 1}. ${step}`);
    });
  }

  if (bug.stackTrace) {
    parts.push(`\n### Stack Trace\n\`\`\`\n${bug.stackTrace}\n\`\`\``);
  }

  parts.push(`\n### Severity: ${bug.severity.toUpperCase()}`);

  return parts.join("\n");
}

/**
 * Build labels for the task
 */
function buildLabels(bug: BugReport): string[] {
  const labels: string[] = ["bug", bug.severity];

  if (bug.component) {
    labels.push(bug.component);
  }

  if (bug.tags) {
    labels.push(...bug.tags);
  }

  labels.push(detectCategory(bug));

  return labels;
}

/**
 * Batch convert multiple bug reports to tasks
 */
export function bugsToTasks(bugs: BugReport[]): TaskRecord[] {
  return bugs.map(bugToTask);
}
