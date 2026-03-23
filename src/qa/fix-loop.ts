/**
 * QA Fix Loop - Fix Iteration Phase
 *
 * Implements the feedback loop from QA failures back to execution.
 */

import type { BrowserProvider } from "../providers/browser/types.js";
import type { TestCase, TestPlan } from "./plan.js";
import type { TestRunResult } from "./run.js";
import type { QAAnalysisResult, FailureAnalysis } from "./analyze.js";
import { executeTestPlan } from "./run.js";
import { analyzeTestRun, generateFixSuggestion } from "./analyze.js";
import { generateReport, formatReport, ReportConfig } from "./report.js";

/**
 * Fix loop status
 */
export type FixLoopStatus = "pending" | "running" | "waiting" | "completed" | "max_attempts";

/**
 * Fix action taken
 */
export interface FixAction {
  caseId: string;
  action: "modified" | "retried" | "skipped" | "ignored";
  before?: Partial<TestCase>;
  after?: Partial<TestCase>;
  result?: "passed" | "failed";
  attempts: number;
  timestamp: number;
}

/**
 * Fix loop iteration result
 */
export interface FixLoopIteration {
  iteration: number;
  status: FixLoopStatus;
  actions: FixAction[];
  remainingCases: string[];
  passedInIteration: number;
  failedInIteration: number;
}

/**
 * Fix loop result
 */
export interface FixLoopResult {
  id: string;
  originalRunId: string;
  startedAt: number;
  completedAt?: number;
  status: FixLoopStatus;
  iterations: FixLoopIteration[];
  totalAttempts: number;
  finalPassed: number;
  finalFailed: number;
  maxAttempts: number;
  success: boolean;
}

/**
 * Fix loop configuration
 */
export interface FixLoopConfig {
  maxAttempts?: number;
  autoRetry?: boolean;
  modifySelectors?: boolean;
  increaseTimeouts?: boolean;
  headless?: boolean;
  onIterationStart?: (iteration: number, remainingCases: string[]) => void;
  onIterationComplete?: (result: FixLoopIteration) => void;
  onCaseFixed?: (caseId: string, result: FixAction) => void;
}

/**
 * Default fix loop configuration
 */
export const DEFAULT_FIX_LOOP_CONFIG: FixLoopConfig = {
  maxAttempts: 3,
  autoRetry: true,
  modifySelectors: true,
  increaseTimeouts: true,
  headless: true,
};

/**
 * Generate modified test case based on failure analysis
 */
function generateModifiedCase(
  originalCase: TestCase,
  analysis: FailureAnalysis
): TestCase {
  const modified = { ...originalCase };

  // Increase timeout if it was a timeout error
  if (analysis.rootCause.category === "timeout") {
    modified.timeout = Math.min(modified.timeout * 2, 120000);
    modified.steps = modified.steps.map((step) => ({
      ...step,
      options: { ...step.options, timeout: modified.timeout },
    }));
  }

  // Add wait before failed action if element not found
  if (analysis.rootCause.category === "element_not_found" && analysis.failedStep) {
    const failedIndex = modified.steps.findIndex((s) => s.id === analysis.failedStep?.stepId);

    if (failedIndex >= 0) {
      const waitStep: TestCase["steps"][0] = {
        id: `wait_${Date.now()}`,
        action: "waitForSelector",
        target: analysis.failedStep.target,
        options: { timeout: 10000 },
      };

      modified.steps = [
        ...modified.steps.slice(0, failedIndex),
        waitStep,
        ...modified.steps.slice(failedIndex),
      ];
    }
  }

  // Add retry logic for flaky tests
  if (analysis.rootCause.category === "unknown") {
    modified.retries = Math.min(modified.retries + 1, 3);
  }

  return modified;
}

/**
 * Execute one iteration of the fix loop
 */
async function executeIteration(
  browser: BrowserProvider,
  cases: TestCase[],
  analysis: QAAnalysisResult,
  config: FixLoopConfig,
  iterationNumber: number
): Promise<FixLoopIteration> {
  const actions: FixAction[] = [];
  const remainingCases: string[] = [];

  config.onIterationStart?.(iterationNumber, cases.map((c) => c.id));

  // Create modified plan
  const modifiedCases = cases.map((testCase) => {
    const caseAnalysis = analysis.caseAnalyses.find((a) => a.caseId === testCase.id);

    if (!caseAnalysis) {
      remainingCases.push(testCase.id);
      return testCase;
    }

    // Modify test case based on analysis
    const modifiedCase = config.modifySelectors
      ? generateModifiedCase(testCase, caseAnalysis)
      : testCase;

    actions.push({
      caseId: testCase.id,
      action: "modified",
      before: { steps: testCase.steps, timeout: testCase.timeout },
      after: { steps: modifiedCase.steps, timeout: modifiedCase.timeout },
      attempts: 1,
      timestamp: Date.now(),
    });

    return modifiedCase;
  });

  // Execute modified tests
  const runResult = await executeTestPlan({
    browser,
    plan: {
      id: `fix_plan_${iterationNumber}`,
      url: "",
      createdAt: Date.now(),
      suites: [{ id: "fix", name: "Fix Suite", cases: modifiedCases }],
      config: { url: "" },
      estimatedDuration: 0,
      totalCases: modifiedCases.length,
    },
    headless: config.headless,
    continueOnFailure: true,
  });

  // Analyze results
  const iterationAnalysis = analyzeTestRun(runResult);

  let passedInIteration = 0;
  let failedInIteration = 0;

  for (const caseResult of runResult.suites.flatMap((s) => s.cases)) {
    const action = actions.find((a) => a.caseId === caseResult.caseId);

    if (caseResult.status === "passed") {
      passedInIteration++;
      if (action) {
        action.result = "passed";
      }
      config.onCaseFixed?.(caseResult.caseId, action!);
    } else {
      failedInIteration++;
      if (action) {
        action.result = "failed";
        action.attempts++;
      }
      remainingCases.push(caseResult.caseId);
    }
  }

  const iteration: FixLoopIteration = {
    iteration: iterationNumber,
    status: "completed",
    actions,
    remainingCases,
    passedInIteration,
    failedInIteration,
  };

  config.onIterationComplete?.(iteration);

  return iteration;
}

/**
 * Run the fix loop
 *
 * @param browser - Browser provider instance
 * @param originalRunResult - Original test run result
 * @param originalAnalysis - Analysis of original failures
 * @param config - Fix loop configuration
 * @returns Fix loop result
 */
export async function runFixLoop(
  browser: BrowserProvider,
  originalRunResult: TestRunResult,
  originalAnalysis: QAAnalysisResult,
  config: FixLoopConfig = {}
): Promise<FixLoopResult> {
  const mergedConfig = { ...DEFAULT_FIX_LOOP_CONFIG, ...config };

  const result: FixLoopResult = {
    id: `fixloop_${Date.now()}`,
    originalRunId: originalRunResult.id,
    startedAt: Date.now(),
    status: "running",
    iterations: [],
    totalAttempts: 0,
    finalPassed: 0,
    finalFailed: 0,
    maxAttempts: mergedConfig.maxAttempts ?? 3,
    success: false,
  };

  // Get failed test cases from original run
  const failedCases: TestCase[] = [];

  for (const suite of originalRunResult.suites) {
    for (const caseResult of suite.cases) {
      if (caseResult.status === "failed") {
        const caseAnalysis = originalAnalysis.caseAnalyses.find(
          (a) => a.caseId === caseResult.caseId
        );

        failedCases.push({
          id: caseResult.caseId,
          name: caseResult.caseId,
          priority: "P0",
          tags: [],
          steps: caseResult.steps.map((s) => ({
            id: s.stepId,
            action: s.action,
            target: s.target,
            value: s.value,
          })),
          assertions: [],
          timeout: 30000,
          retries: mergedConfig.autoRetry ? 1 : 0,
          status: "pending",
        });
      }
    }
  }

  if (failedCases.length === 0) {
    result.status = "completed";
    result.success = true;
    result.completedAt = Date.now();
    return result;
  }

  let currentAnalysis = originalAnalysis;
  let currentCases = failedCases;

  // Run iterations
  for (let i = 1; i <= result.maxAttempts; i++) {
    const iterationResult = await executeIteration(
      browser,
      currentCases,
      currentAnalysis,
      mergedConfig,
      i
    );

    result.iterations.push(iterationResult);
    result.totalAttempts += iterationResult.actions.length;

    // Check if all passed
    if (iterationResult.remainingCases.length === 0) {
      result.status = "completed";
      result.success = true;
      result.finalPassed = iterationResult.passedInIteration;
      result.completedAt = Date.now();
      break;
    }

    // Update for next iteration
    currentCases = currentCases.filter((c) =>
      iterationResult.remainingCases.includes(c.id)
    );

    // Update analysis with latest results
    const latestRun = iterationResult.actions
      .filter((a) => a.after)
      .map((a) => ({
        caseId: a.caseId,
        status: a.result === "passed" ? "passed" : "failed",
        startTime: a.timestamp,
        endTime: a.timestamp,
        duration: 0,
        steps: [],
        assertions: [],
        evidence: [],
        error: a.after ? undefined : "Unknown error",
      }));

    currentAnalysis = {
      ...currentAnalysis,
      caseAnalyses: currentAnalysis.caseAnalyses.filter((a) =>
        iterationResult.remainingCases.includes(a.caseId)
      ),
    };

    result.status = "waiting";
    result.finalFailed = iterationResult.remainingCases.length;

    // Auto-continue if enabled
    if (!mergedConfig.autoRetry) {
      result.status = "max_attempts";
      break;
    }
  }

  if (result.status === "running" && result.iterations.length >= result.maxAttempts) {
    result.status = "max_attempts";
  }

  return result;
}

/**
 * Get fix suggestions for all failed cases
 */
export function getFixSuggestions(analysis: QAAnalysisResult): Map<string, string> {
  const suggestions = new Map<string, string>();

  for (const caseAnalysis of analysis.caseAnalyses) {
    suggestions.set(caseAnalysis.caseId, generateFixSuggestion(caseAnalysis));
  }

  return suggestions;
}

/**
 * Export fix loop result as report
 */
export function exportFixLoopReport(
  result: FixLoopResult,
  analysis: QAAnalysisResult,
  config: ReportConfig = {}
): string {
  const report = {
    summary: {
      total: result.totalAttempts,
      passed: result.finalPassed,
      failed: result.finalFailed,
      iterations: result.iterations.length,
      status: result.status,
      success: result.success,
    },
    iterations: result.iterations.map((iter, i) => ({
      iteration: i + 1,
      status: iter.status,
      passed: iter.passedInIteration,
      failed: iter.failedInIteration,
      actions: iter.actions.map((a) => ({
        caseId: a.caseId,
        action: a.action,
        result: a.result,
        attempts: a.attempts,
      })),
    })),
    suggestions: getFixSuggestions(analysis),
  };

  return formatReport(report as any, config);
}
