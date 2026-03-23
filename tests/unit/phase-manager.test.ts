import { describe, expect, it } from "vitest";
import {
  PhaseStateMachine,
  PhaseTracker,
  STAGE_GATES,
  checkGate,
  getGateForTransition,
} from "../../src/phase-manager/index.js";

describe("Phase manager", () => {
  it("runs the canonical happy-path state transitions", async () => {
    const machine = new PhaseStateMachine();

    expect(machine.getStatus()).toBe("draft");
    expect((await machine.transition("START_DISCUSS")).success).toBe(true);
    expect(machine.getStatus()).toBe("discussing");
    expect((await machine.transition("END_DISCUSS")).success).toBe(true);
    expect(machine.getStatus()).toBe("planned");
    expect((await machine.transition("START_EXECUTE")).success).toBe(true);
    expect(machine.getStatus()).toBe("executing");
    expect((await machine.transition("END_EXECUTE")).success).toBe(true);
    expect(machine.getStatus()).toBe("verifying");
    expect((await machine.transition("END_VERIFY")).success).toBe(true);
    expect(machine.getStatus()).toBe("completed");
  });

  it("blocks invalid transitions", async () => {
    const machine = new PhaseStateMachine("draft");
    const result = await machine.transition("END_EXECUTE");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid transition");
  });

  it("tracks dependencies between phases", async () => {
    const tracker = new PhaseTracker();
    const phase1 = tracker.addPhase("Discovery", "Clarify scope");
    const phase2 = tracker.addPhase("Build", "Implement the feature", phase1.id);

    const canStartBefore = tracker.canStartPhase(phase2.id);
    expect(canStartBefore.allowed).toBe(false);
    expect(canStartBefore.reasons[0]).toContain(phase1.name);

    await tracker.transitionPhase(phase1.id, "START_DISCUSS");
    await tracker.transitionPhase(phase1.id, "END_DISCUSS");
    await tracker.transitionPhase(phase1.id, "START_EXECUTE");
    await tracker.transitionPhase(phase1.id, "END_EXECUTE");
    await tracker.transitionPhase(phase1.id, "END_VERIFY");

    const canStartAfter = tracker.canStartPhase(phase2.id);
    expect(canStartAfter.allowed).toBe(true);
    expect(tracker.getBlockingPhases(phase2.id)).toContain(phase1.id);
  });

  it("exposes gates for each major transition", async () => {
    const gate = getGateForTransition("planned", "executing");

    expect(gate).toBeDefined();
    expect(STAGE_GATES.length).toBeGreaterThanOrEqual(4);

    const result = await checkGate(gate!);
    expect(result.gate.id).toBe("gate-plan-complete");
    expect(result.passed).toBe(false);
    expect(result.blockingCriteria.length).toBeGreaterThan(0);
  });
});
