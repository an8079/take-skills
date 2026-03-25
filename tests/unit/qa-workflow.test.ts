import { beforeEach, describe, expect, it, vi } from "vitest";

const events: string[] = [];
const fakeBrowser = {
  type: "playwright" as const,
  version: "test",
  launch: vi.fn(async () => {
    events.push("launch");
  }),
  close: vi.fn(async () => {
    events.push("close");
  }),
};

vi.mock("../../src/providers/browser/index.js", () => ({
  createBrowserProvider: () => fakeBrowser,
}));

vi.mock("../../src/qa/plan.js", () => ({
  generateTestPlan: async () => {
    events.push("plan");
    return {
      id: "plan-1",
      url: "https://example.com",
      createdAt: Date.now(),
      suites: [],
      config: {},
      estimatedDuration: 0,
      totalCases: 0,
    };
  },
}));

vi.mock("../../src/qa/run.js", () => ({
  executeTestPlan: async () => {
    events.push("run");
    return {
      id: "run-1",
      planId: "plan-1",
      status: "completed",
      startedAt: Date.now(),
      completedAt: Date.now(),
      duration: 0,
      suites: [],
      totalCases: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 100,
      evidence: [],
      errors: [],
    };
  },
}));

vi.mock("../../src/qa/analyze.js", () => ({
  analyzeTestRun: () => ({
    aggregate: {
      commonPatterns: [],
      recommendations: [],
    },
  }),
}));

vi.mock("../../src/qa/report.js", () => ({
  generateReport: () => ({ summary: "ok" }),
  formatReport: () => "ok",
}));

vi.mock("../../src/qa/fix-loop.js", () => ({
  runFixLoop: async () => undefined,
  getFixSuggestions: () => [],
}));

describe("runQAWorkflow", () => {
  beforeEach(() => {
    events.length = 0;
    fakeBrowser.launch.mockClear();
    fakeBrowser.close.mockClear();
  });

  it("launches the browser before planning and closes before execution reruns", async () => {
    const { runQAWorkflow } = await import("../../src/qa/index.js");

    await runQAWorkflow({
      url: "https://example.com",
    });

    expect(events).toEqual(["launch", "plan", "close", "run", "close"]);
  });
});
