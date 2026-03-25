/**
 * QA Workflow - Entry Point
 *
 * Complete QA workflow: plan -> run -> analyze -> report -> fix-loop
 *
 * @example
 * ```typescript
 * import { createBrowserProvider } from './providers/browser';
 * import { generateTestPlan } from './qa/plan';
 * import { executeTestPlan } from './qa/run';
 * import { analyzeTestRun } from './qa/analyze';
 * import { generateReport, formatReport } from './qa/report';
 * import { runFixLoop, getFixSuggestions } from './qa/fix-loop';
 *
 * // Create browser provider
 * const browser = createBrowserProvider('playwright');
 *
 * // Generate test plan
 * const plan = await generateTestPlan(browser, { url: 'https://example.com' });
 *
 * // Execute tests
 * const runResult = await executeTestPlan({ browser, plan });
 *
 * // Analyze failures
 * const analysis = analyzeTestRun(runResult);
 *
 * // Generate report
 * const report = generateReport(runResult, analysis);
 * console.log(formatReport(report, { format: 'console' }));
 *
 * // If failures exist, run fix loop
 * if (runResult.failed > 0) {
 *   const fixResult = await runFixLoop(browser, runResult, analysis);
 * }
 * ```
 */

export * from "./types.js";
export * from "./evidence.js";
export * from "./plan.js";
export * from "./run.js";
export * from "./analyze.js";
export * from "./report.js";
export * from "./fix-loop.js";

import { createBrowserProvider } from "../providers/browser/index.js";
import { generateTestPlan } from "./plan.js";
import type { QAPlanConfig, TestPlan } from "./plan.js";
import { executeTestPlan } from "./run.js";
import type { QARunConfig, TestRunResult } from "./run.js";
import { analyzeTestRun } from "./analyze.js";
import type { QAAnalysisResult } from "./analyze.js";
import { generateReport, formatReport } from "./report.js";
import type { ReportConfig, QAReport } from "./report.js";
import { runFixLoop, getFixSuggestions } from "./fix-loop.js";
import type { FixLoopConfig, FixLoopResult } from "./fix-loop.js";

/**
 * QA Workflow result
 */
export interface QAWorkflowResult {
  plan: TestPlan;
  runResult: TestRunResult;
  analysis: QAAnalysisResult;
  report: QAReport;
  fixLoopResult?: FixLoopResult;
}

/**
 * QA Workflow configuration
 */
export interface QAWorkflowConfig {
  /** Target URL to test */
  url: string;
  /** Browser provider type */
  browserType?: "playwright" | "puppeteer";
  /** Test plan configuration */
  planConfig?: Partial<QAPlanConfig>;
  /** Run configuration */
  runConfig?: Partial<QARunConfig>;
  /** Fix loop configuration */
  fixLoopConfig?: FixLoopConfig;
  /** Report configuration */
  reportConfig?: ReportConfig;
  /** Whether to run fix loop on failures */
  autoFix?: boolean;
}

/**
 * Run complete QA workflow
 *
 * @param config - Workflow configuration
 * @returns Complete workflow result including plan, run, analysis, report, and optionally fix loop
 */
export async function runQAWorkflow(config: QAWorkflowConfig): Promise<QAWorkflowResult> {
  const browser = createBrowserProvider(config.browserType ?? "playwright");

  // Step 1: Generate test plan
  const planConfig: QAPlanConfig = {
    url: config.url,
    timeout: 30000,
    retries: 1,
    priorities: ["P0", "P1", "P2"],
    ...config.planConfig,
  };

  await browser.launch({
    headless: true,
    viewport: planConfig.viewport,
    timeout: planConfig.timeout,
  });

  const plan = await generateTestPlan(browser, planConfig);
  await browser.close();

  // Step 2: Execute tests
  const runConfig: QARunConfig = {
    browser,
    plan,
    headless: true,
    continueOnFailure: true,
    captureEvidence: true,
    ...config.runConfig,
  };

  const runResult = await executeTestPlan(runConfig);

  // Step 3: Analyze results
  const analysis = analyzeTestRun(runResult);

  // Step 4: Generate report
  const reportConfig: ReportConfig = {
    format: "console",
    includeEvidence: false,
    ...config.reportConfig,
  };

  const report = generateReport(runResult, analysis, reportConfig);

  const result: QAWorkflowResult = {
    plan,
    runResult,
    analysis,
    report,
  };

  // Step 5: Run fix loop if failures exist and autoFix is enabled
  if (runResult.failed > 0 && config.autoFix) {
    const fixConfig: FixLoopConfig = {
      maxAttempts: 3,
      autoRetry: true,
      modifySelectors: true,
      increaseTimeouts: true,
      ...config.fixLoopConfig,
    };

    const fixLoopResult = await runFixLoop(browser, runResult, analysis, fixConfig);
    result.fixLoopResult = fixLoopResult;
  }

  // Cleanup
  await browser.close();

  return result;
}

/**
 * Print QA report to console
 */
export function printQAReport(result: QAWorkflowResult): void {
  console.log("\n" + formatReport(result.report, { format: "console" }));

  if (result.fixLoopResult) {
    console.log("\n=== FIX LOOP RESULTS ===");
    console.log(`Status: ${result.fixLoopResult.status}`);
    console.log(`Iterations: ${result.fixLoopResult.iterations.length}`);
    console.log(`Total Attempts: ${result.fixLoopResult.totalAttempts}`);
    console.log(`Final Passed: ${result.fixLoopResult.finalPassed}`);
    console.log(`Final Failed: ${result.fixLoopResult.finalFailed}`);
  }
}

/**
 * Get summary of QA results
 */
export function getQASummary(result: QAWorkflowResult): string {
  const lines: string[] = [];

  lines.push("QA Workflow Summary");
  lines.push("====================");
  lines.push(`URL: ${result.plan.url}`);
  lines.push(`Total Cases: ${result.runResult.totalCases}`);
  lines.push(`Passed: ${result.runResult.passed}`);
  lines.push(`Failed: ${result.runResult.failed}`);
  lines.push(`Pass Rate: ${result.runResult.passRate.toFixed(1)}%`);
  lines.push(`Duration: ${((result.runResult.duration ?? 0) / 1000).toFixed(1)}s`);

  if (result.analysis.aggregate.commonPatterns.length > 0) {
    lines.push("\nCommon Failure Patterns:");
    for (const pattern of result.analysis.aggregate.commonPatterns) {
      lines.push(`  - ${pattern}`);
    }
  }

  if (result.analysis.aggregate.recommendations.length > 0) {
    lines.push("\nRecommendations:");
    for (const rec of result.analysis.aggregate.recommendations) {
      lines.push(`  - ${rec}`);
    }
  }

  return lines.join("\n");
}

// Re-export everything for convenience
export {
  createBrowserProvider,
  generateTestPlan,
  executeTestPlan,
  analyzeTestRun,
  generateReport,
  formatReport,
  runFixLoop,
  getFixSuggestions,
};

export type { BrowserProvider } from "../providers/browser/types.js";
export type { TestPlan, TestCase, TestSuite, QAPlanConfig } from "./plan.js";
export type { TestRunResult, QARunConfig } from "./run.js";
export type { QAAnalysisResult, FailureAnalysis, RootCause } from "./analyze.js";
export type { QAReport, ReportConfig } from "./report.js";
export type { FixLoopResult, FixLoopConfig, FixAction } from "./fix-loop.js";
