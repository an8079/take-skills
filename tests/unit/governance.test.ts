import { describe, expect, it } from "vitest";
import { AuditLog, ProcessController } from "../../src/governance/index.js";

describe("Governance", () => {
  it("records and filters audit log entries", () => {
    const log = new AuditLog(3);

    log.log("phase", "phase-created", "system", { name: "Phase 1" }, { phaseId: "phase-1" });
    log.log("approval", "phase-approved", "user", { approved: true }, { phaseId: "phase-1" });
    log.log("violation", "gate-blocked", "system", { severity: "error" }, { phaseId: "phase-2" });
    log.log("config", "mode-changed", "user", { mode: "strict" });

    expect(log.size()).toBe(3);
    expect(log.getEntries({ phaseId: "phase-1" })).toHaveLength(1);
    expect(log.getEntries({ category: "config" })).toHaveLength(1);
    expect(log.search("strict")).toHaveLength(1);
  });

  it("flags phase-order violations in strict mode", () => {
    const controller = new ProcessController({ mode: "strict" });
    const tracker = controller.getTracker();

    const phase1 = tracker.addPhase("Discovery", "Clarify requirements");
    const phase2 = tracker.addPhase("Implementation", "Build feature", phase1.id);

    tracker.setCurrentPhase(phase1.id);
    const result = controller.validatePhaseTransition(phase2.id, "START_EXECUTE");

    expect(result.valid).toBe(false);
    expect(result.violations.some((violation) => violation.type === "phase_order")).toBe(true);
    expect(result.violations.some((violation) => violation.type === "dependency_blocked")).toBe(true);
  });

  it("enforces runtime gate failures and pending approvals", () => {
    const controller = new ProcessController({
      mode: "strict",
      enforceStageGates: true,
      requireApproval: true,
    });

    controller.registerRuntimePhase("discuss", { status: "completed" });
    controller.registerRuntimePhase("plan", {
      status: "blocked",
      dependencies: ["discuss"],
    });
    controller.recordGateResult("plan", {
      gate: {
        id: "gate-plan-complete",
        name: "Plan Gate",
        description: "Plan must be approved",
        fromStatus: "discussing",
        toStatus: "planned",
        criteria: [],
        requiresApproval: true,
      },
      passed: false,
      blockingCriteria: [
        {
          id: "missing-plan",
          description: "Plan artifact missing",
          check: async () => false,
          severity: "blocking",
        },
      ],
      warningCriteria: [],
      skippedCriteria: [],
      checkedAt: Date.now(),
    });
    controller.recordApprovalState("plan", {
      required: true,
      status: "pending",
      approver: "reviewer",
      requestId: "approval-1",
    });

    const violations = controller.enforceProcess();

    expect(violations.some((violation) => violation.type === "gate_blocked")).toBe(true);
    expect(violations.some((violation) => violation.type === "approval_missing")).toBe(true);
  });

  it("flags runtime dependency order violations", () => {
    const controller = new ProcessController({
      mode: "strict",
      maxActivePhases: 1,
    });

    controller.registerRuntimePhase("discuss", { status: "running" });
    controller.registerRuntimePhase("plan", {
      status: "running",
      dependencies: ["discuss"],
    });

    const violations = controller.enforceProcess();

    expect(violations.some((violation) => violation.type === "phase_order")).toBe(true);
    expect(violations.some((violation) => violation.type === "dependency_blocked")).toBe(true);
  });
});
