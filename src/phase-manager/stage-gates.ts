/**
 * Stage Gates
 *
 * Quality control checkpoints between phase stages.
 * Each gate defines entry criteria that must be met before advancing.
 */

import type { PhaseStatus } from "./state-machine.js";

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
      check: () => false, // Placeholder - actual implementation checks filesystem
      severity: "blocking",
    },
    {
      id: "key-decisions-documented",
      description: "Key implementation decisions are documented",
      check: () => false,
      severity: "blocking",
    },
    {
      id: "edge-cases-identified",
      description: "Edge cases and error scenarios identified",
      check: () => false,
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
      check: () => false,
      severity: "blocking",
    },
    {
      id: "plans-valid",
      description: "All plans are valid XML with verify sections",
      check: () => false,
      severity: "blocking",
    },
    {
      id: "dependencies-resolved",
      description: "Plan dependencies are properly identified",
      check: () => false,
      severity: "blocking",
    },
    {
      id: "effort-estimated",
      description: "Each plan has effort estimates",
      check: () => false,
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
      check: () => false,
      severity: "blocking",
    },
    {
      id: "no-merge-conflicts",
      description: "No unresolved merge conflicts",
      check: () => false,
      severity: "blocking",
    },
    {
      id: "tests-exist",
      description: "Tests exist for implemented functionality",
      check: () => false,
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
      check: () => false,
      severity: "blocking",
    },
    {
      id: "no-critical-issues",
      description: "No critical bugs or security issues",
      check: () => false,
      severity: "blocking",
    },
    {
      id: "documentation-complete",
      description: "Documentation updated",
      check: () => false,
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
