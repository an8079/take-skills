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
});
