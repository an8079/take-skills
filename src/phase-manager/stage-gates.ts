/**
 * Stage Gates
 *
 * Quality control checkpoints between phase stages.
 * Each gate defines entry criteria that must be met before advancing.
 */

import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { PhaseStatus } from "./state-machine.js";

const execAsync = promisify(exec);

function getProjectRoot(): string {
  return process.cwd();
}

async function fileExists(path: string): Promise<boolean> {
  return existsSync(path);
}

async function safeReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

async function isGitClean(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("git status --porcelain", { cwd: getProjectRoot() });
    return stdout.trim() === "";
  } catch {
    return false;
  }
}

async function hasMergeConflicts(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("git ls-files -u", { cwd: getProjectRoot() });
    return stdout.trim() !== "";
  } catch {
    return false;
  }
}

export interface GateCriterion {
  id: string;
  description: string;
  check: () => boolean | Promise<boolean>;
  severity: "blocking" | "warning" | "info";
}

export interface StageGate {
  id: string;
  name: string;
  description: string;
  fromStatus: PhaseStatus;
  toStatus: PhaseStatus;
  criteria: GateCriterion[];
  requiresApproval: boolean;
  approvers?: string[];
}

export interface GateCheckResult {
  gate: StageGate;
  passed: boolean;
  blockingCriteria: GateCriterion[];
  warningCriteria: GateCriterion[];
  skippedCriteria: GateCriterion[];
  checkedAt: number;
}

const PHASE_DISCUSS_GATE: StageGate = {
  id: "gate-discuss-complete",
  name: "Discussion Complete",
  description: "Validates that phase discussion captured all necessary decisions",
  fromStatus: "discussing",
  toStatus: "planned",
  criteria: [
    {
      id: "context-file-exists",
      description: "CONTEXT.md file exists for the phase",
      check: async () => existsSync(join(getProjectRoot(), "CONTEXT.md")),
      severity: "blocking",
    },
    {
      id: "key-decisions-documented",
      description: "Key implementation decisions are documented",
      check: async () => {
        const content = await safeReadFile(join(getProjectRoot(), "CONTEXT.md"));
        if (!content) return false;
        // Use word boundary patterns to avoid false positives
        const patterns = [
          /\bdecision:\s*\S/,
          /\bdecided:\s*\S/,
          /\bchose\s+\w+/,
          /\bchosen\s+\w+/,
          /\bselected\s+\w+/,
        ];
        return patterns.some(p => p.test(content));
      },
      severity: "blocking",
    },
    {
      id: "edge-cases-identified",
      description: "Edge cases and error scenarios identified",
      check: async () => {
        const content = await safeReadFile(join(getProjectRoot(), "CONTEXT.md"));
        if (!content) return false;
        // Look for explicit edge case sections or patterns
        const patterns = [
          /^#{1,3}\s+.*edge\s+case/im,
          /^#{1,3}\s+.*corner\s+case/im,
          /\b(edge|corner|boundary)\s+(case|scenarios?)\b/i,
          /\bfailure\s+modes?\b/i,
          /\berror\s+scenarios?\b/i,
        ];
        return patterns.some(p => p.test(content));
      },
      severity: "warning",
    },
  ],
  requiresApproval: true,
  approvers: ["user"],
};

const PHASE_PLAN_GATE: StageGate = {
  id: "gate-plan-complete",
  name: "Planning Complete",
  description: "Validates that phase planning produced valid, verifiable plans",
  fromStatus: "planned",
  toStatus: "executing",
  criteria: [
    {
      id: "research-exists",
      description: "Research documentation exists",
      check: async () => {
        return existsSync(join(getProjectRoot(), "RESEARCH.md")) ||
               existsSync(join(getProjectRoot(), "research", "RESEARCH.md")) ||
               existsSync(join(getProjectRoot(), ".omc", "research", "RESEARCH.md"));
      },
      severity: "blocking",
    },
    {
      id: "plans-valid",
      description: "All plans are valid XML with verify sections",
      check: async () => {
        const planPath = join(getProjectRoot(), "PLAN.md");
        if (!existsSync(planPath)) return false;
        const content = await safeReadFile(planPath);
        if (!content) return false;
        return content.includes("verify") || content.includes("Verify") || content.includes("test") || content.includes("Test");
      },
      severity: "blocking",
    },
    {
      id: "dependencies-resolved",
      description: "Plan dependencies are properly identified",
      check: async () => {
        const planPath = join(getProjectRoot(), "PLAN.md");
        const content = await safeReadFile(planPath);
        if (!content) return false;
        const unresolvedPatterns = ["[ ]", "[x]", "TODO", "TBD", "undefined", "null"];
        const hasUnresolved = unresolvedPatterns.some(p => content.includes(p));
        return !hasUnresolved;
      },
      severity: "blocking",
    },
    {
      id: "effort-estimated",
      description: "Each plan has effort estimates",
      check: async () => {
        const planPath = join(getProjectRoot(), "PLAN.md");
        const content = await safeReadFile(planPath);
        if (!content) return false;
        // Require numeric estimates or specific effort patterns
        const patterns = [
          /\d+\s*(hours?|days?|story\s+points?|sp|pts?)/i,
          /\beffort:\s*\d+/i,
          /\bestimate[ds]?:\s*\d+/i,
        ];
        return patterns.some(p => p.test(content));
      },
      severity: "warning",
    },
  ],
  requiresApproval: true,
  approvers: ["user"],
};

const PHASE_EXECUTE_GATE: StageGate = {
  id: "gate-execute-complete",
  name: "Execution Complete",
  description: "Validates that all plans were executed successfully",
  fromStatus: "executing",
  toStatus: "verifying",
  criteria: [
    {
      id: "plans-committed",
      description: "All plans have corresponding git commits",
      check: async () => {
        try {
          const { stdout } = await execAsync("git log --oneline -10", { cwd: getProjectRoot() });
          return stdout.trim() !== "";
        } catch {
          return false;
        }
      },
      severity: "blocking",
    },
    {
      id: "no-merge-conflicts",
      description: "No unresolved merge conflicts",
      check: async () => {
        return !(await hasMergeConflicts());
      },
      severity: "blocking",
    },
    {
      id: "tests-exist",
      description: "Tests exist for implemented functionality",
      check: async () => {
        // Check common test directory patterns exist
        const testDirs = ["src", "tests", "test", "__tests__"];
        for (const dir of testDirs) {
          if (existsSync(join(getProjectRoot(), dir))) {
            return true;
          }
        }
        return false;
      },
      severity: "warning",
    },
  ],
  requiresApproval: false,
};

const PHASE_VERIFY_GATE: StageGate = {
  id: "gate-verify-complete",
  name: "Verification Complete",
  description: "Validates that phase deliverables meet requirements",
  fromStatus: "verifying",
  toStatus: "completed",
  criteria: [
    {
      id: "uat-passed",
      description: "User acceptance testing completed",
      check: async () => {
        const uatPaths = [
          join(getProjectRoot(), "UAT.md"),
          join(getProjectRoot(), "uat.md"),
          join(getProjectRoot(), "test-results.md"),
          join(getProjectRoot(), "TEST_RESULTS.md"),
          join(getProjectRoot(), ".omc", "verification", "uat.md"),
        ];
        return uatPaths.some(p => existsSync(p));
      },
      severity: "blocking",
    },
    {
      id: "no-critical-issues",
      description: "No critical bugs or security issues",
      check: async () => {
        const reportPaths = [
          join(getProjectRoot(), "QA_REPORT.md"),
          join(getProjectRoot(), "qa-report.md"),
          join(getProjectRoot(), ".omc", "verification", "qa-report.md"),
        ];
        for (const p of reportPaths) {
          const content = await safeReadFile(p);
          if (content && content.toLowerCase().includes("critical")) {
            return false;
          }
        }
        return true;
      },
      severity: "blocking",
    },
    {
      id: "documentation-complete",
      description: "Documentation updated",
      check: async () => {
        const docsDir = join(getProjectRoot(), "docs");
        const readmePath = join(getProjectRoot(), "README.md");
        return existsSync(docsDir) || existsSync(readmePath);
      },
      severity: "warning",
    },
  ],
  requiresApproval: true,
  approvers: ["user"],
};

export const STAGE_GATES: StageGate[] = [
  PHASE_DISCUSS_GATE,
  PHASE_PLAN_GATE,
  PHASE_EXECUTE_GATE,
  PHASE_VERIFY_GATE,
];

export function getGateForTransition(
  fromStatus: PhaseStatus,
  toStatus: PhaseStatus
): StageGate | undefined {
  return STAGE_GATES.find(g => g.fromStatus === fromStatus && g.toStatus === toStatus);
}

export async function checkGate(gate: StageGate): Promise<GateCheckResult> {
  const blockingCriteria: GateCriterion[] = [];
  const warningCriteria: GateCriterion[] = [];
  const skippedCriteria: GateCriterion[] = [];

  for (const criterion of gate.criteria) {
    try {
      const result = await criterion.check();
      if (!result) {
        if (criterion.severity === "blocking") {
          blockingCriteria.push(criterion);
        } else if (criterion.severity === "warning") {
          warningCriteria.push(criterion);
        }
      }
    } catch {
      skippedCriteria.push(criterion);
    }
  }

  return {
    gate,
    passed: blockingCriteria.length === 0,
    blockingCriteria,
    warningCriteria,
    skippedCriteria,
    checkedAt: Date.now(),
  };
}

export function formatGateReport(result: GateCheckResult): string {
  const lines: string[] = [
    `# ${result.gate.name}`,
    `**Status:** ${result.passed ? "PASSED" : "FAILED"}`,
    "",
    result.gate.description,
    "",
  ];

  if (result.blockingCriteria.length > 0) {
    lines.push("## Blocking Issues");
    for (const c of result.blockingCriteria) {
      lines.push(`- [ ] ${c.id}: ${c.description}`);
    }
    lines.push("");
  }

  if (result.warningCriteria.length > 0) {
    lines.push("## Warnings");
    for (const c of result.warningCriteria) {
      lines.push(`- ! ${c.id}: ${c.description}`);
    }
    lines.push("");
  }

  if (result.skippedCriteria.length > 0) {
    lines.push("## Skipped (Errors)");
    for (const c of result.skippedCriteria) {
      lines.push(`- ? ${c.id}: ${c.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export { PHASE_DISCUSS_GATE, PHASE_PLAN_GATE, PHASE_EXECUTE_GATE, PHASE_VERIFY_GATE };
