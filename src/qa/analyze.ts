/**
 * QA Analyze - Failure Analysis Phase
 *
 * Analyzes test failures to determine root causes and generates fix suggestions.
 */

import type { TestRunResult, TestSuiteResult, TestCaseResult, StepResult } from "./run.js";
import type { EvidenceItem } from "./evidence.js";

/**
 * Root cause category
 */
export type RootCauseCategory =
  | "navigation"
  | "element_not_found"
  | "element_disabled"
  | "timeout"
  | "assertion"
  | "network"
  | "script_error"
  | "unknown";

/**
 * Root cause analysis result
 */
export interface RootCause {
  category: RootCauseCategory;
  description: string;
  confidence: number; // 0-1
  evidence: string[];
  suggestions: string[];
}

/**
 * Failure analysis result for a single test case
 */
export interface FailureAnalysis {
  caseId: string;
  caseName: string;
  rootCause: RootCause;
  stepsBeforeFailure: StepResult[];
  failedStep?: StepResult;
  evidence: EvidenceItem[];
  reproduced: boolean;
  reproduceSteps: string[];
}

/**
 * Aggregate failure analysis
 */
export interface AggregateAnalysis {
  totalFailures: number;
  failuresByCategory: Record<RootCauseCategory, number>;
  commonPatterns: string[];
  flakyTests: string[];
  recommendations: string[];
}

/**
 * Full analysis result
 */
export interface QAAnalysisResult {
  runId: string;
  analyzedAt: number;
  caseAnalyses: FailureAnalysis[];
  aggregate: AggregateAnalysis;
  overallHealth: number; // 0-100
}

/**
 * Analyze a single test case failure
 */
export function analyzeFailure(
  caseResult: TestCaseResult,
  evidence: EvidenceItem[]
): FailureAnalysis {
  const caseId = caseResult.caseId;
  const caseName = caseResult.steps[0]?.value ?? caseId;

  // Find failed step
  const failedStep = caseResult.steps.find((s) => !s.success);
  const stepsBeforeFailure = caseResult.steps.slice(
    0,
    caseResult.steps.findIndex((s) => !s.success)
  );

  // Determine root cause
  const rootCause = determineRootCause(failedStep, caseResult);

  // Generate reproduce steps
  const reproduceSteps = generateReproduceSteps(caseResult);

  return {
    caseId,
    caseName,
    rootCause,
    stepsBeforeFailure,
    failedStep,
    evidence,
    reproduced: false,
    reproduceSteps,
  };
}

/**
 * Determine root cause from failed step
 */
function determineRootCause(
  failedStep: StepResult | undefined,
  caseResult: TestCaseResult
): RootCause {
  if (!failedStep) {
    return {
      category: "assertion",
      description: "Test assertions failed",
      confidence: 0.9,
      evidence: caseResult.assertions.filter((a) => !a.passed).map((a) => a.message ?? ""),
      suggestions: caseResult.assertions
        .filter((a) => !a.passed)
        .map((a) => `Check assertion: expected ${a.expected}, got ${a.actual}`),
    };
  }

  const errorMsg = failedStep.error?.toLowerCase() ?? "";
  const evidence = [failedStep.error ?? ""];

  // Element not found
  if (
    errorMsg.includes("element not found") ||
    errorMsg.includes("selector") ||
    errorMsg.includes("no node")
  ) {
    return {
      category: "element_not_found",
      description: `Element '${failedStep.target}' was not found on the page`,
      confidence: 0.85,
      evidence,
      suggestions: [
        `Verify selector '${failedStep.target}' is correct`,
        "Check if the element is rendered dynamically",
        "Ensure proper wait conditions are in place",
        "Consider using a more reliable selector strategy",
      ],
    };
  }

  // Element disabled
  if (
    errorMsg.includes("disabled") ||
    errorMsg.includes("not clickable") ||
    errorMsg.includes("not visible")
  ) {
    return {
      category: "element_disabled",
      description: `Element '${failedStep.target}' is not interactable`,
      confidence: 0.8,
      evidence,
      suggestions: [
        "Wait for element to become enabled",
        "Check if element is covered by another element",
        "Verify element is in viewport",
        "Consider using force click as last resort",
      ],
    };
  }

  // Timeout
  if (
    errorMsg.includes("timeout") ||
    errorMsg.includes("timed out") ||
    errorMsg.includes("exceeded")
  ) {
    return {
      category: "timeout",
      description: `Action '${failedStep.action}' timed out on '${failedStep.target}'`,
      confidence: 0.9,
      evidence,
      suggestions: [
        "Increase timeout for this action",
        "Check network conditions",
        "Verify server is responding",
        "Consider if element needs more time to load",
      ],
    };
  }

  // Navigation
  if (
    failedStep.action === "navigate" ||
    errorMsg.includes("navigation") ||
    errorMsg.includes("net::err")
  ) {
    return {
      category: "navigation",
      description: `Navigation to '${failedStep.value}' failed`,
      confidence: 0.9,
      evidence,
      suggestions: [
        "Verify URL is correct and accessible",
        "Check network connectivity",
        "Verify SSL certificates if using HTTPS",
        "Check if URL requires authentication",
      ],
    };
  }

  // Network
  if (
    errorMsg.includes("network") ||
    errorMsg.includes("fetch") ||
    errorMsg.includes("xhr") ||
    errorMsg.includes("http")
  ) {
    return {
      category: "network",
      description: "Network request failed",
      confidence: 0.8,
      evidence,
      suggestions: [
        "Check network request configuration",
        "Verify API endpoint is accessible",
        "Check request headers and body",
        "Review server logs for errors",
      ],
    };
  }

  // Script error
  if (
    errorMsg.includes("script") ||
    errorMsg.includes("javascript") ||
    errorMsg.includes("evaluate")
  ) {
    return {
      category: "script_error",
      description: "Page JavaScript error occurred",
      confidence: 0.75,
      evidence,
      suggestions: [
        "Check browser console for errors",
        "Review page JavaScript code",
        "Verify all required scripts are loaded",
        "Check for syntax errors in evaluated code",
      ],
    };
  }

  // Unknown
  return {
    category: "unknown",
    description: `Unexpected error: ${failedStep.error}`,
    confidence: 0.5,
    evidence,
    suggestions: [
      "Review test logs for details",
      "Capture additional evidence",
      "Try to reproduce manually",
      "Consider if page changed since last run",
    ],
  };
}

/**
 * Generate reproducible steps for a failed test case
 */
function generateReproduceSteps(caseResult: TestCaseResult): string[] {
  const steps: string[] = [];

  for (const step of caseResult.steps) {
    switch (step.action) {
      case "navigate":
        steps.push(`1. Navigate to URL: ${step.value}`);
        break;
      case "click":
        steps.push(`2. Click element: ${step.target}`);
        break;
      case "fill":
        steps.push(`3. Fill '${step.target}' with: ${step.value}`);
        break;
      case "type":
        steps.push(`4. Type into '${step.target}': ${step.value}`);
        break;
      case "hover":
        steps.push(`5. Hover over: ${step.target}`);
        break;
      case "waitForSelector":
        steps.push(`6. Wait for selector: ${step.target}`);
        break;
      case "waitForNavigation":
        steps.push(`7. Wait for navigation`);
        break;
      case "select":
        steps.push(`8. Select '${step.value}' in: ${step.target}`);
        break;
      case "setChecked":
        steps.push(`9. Set '${step.target}' to: ${step.value}`);
        break;
      case "goBack":
        steps.push(`10. Navigate back`);
        break;
      case "goForward":
        steps.push(`11. Navigate forward`);
        break;
      case "reload":
        steps.push(`12. Reload page`);
        break;
      case "evaluate":
        steps.push(`13. Execute: ${step.value}`);
        break;
      default:
        if (step.target) {
          steps.push(`N. Perform ${step.action} on: ${step.target}`);
        }
    }

    if (!step.success) {
      steps.push(`   ERROR: ${step.error}`);
      break;
    }
  }

  return steps;
}

/**
 * Perform aggregate analysis across all failures
 */
export function aggregateAnalysis(
  caseAnalyses: FailureAnalysis[]
): AggregateAnalysis {
  const failuresByCategory: Record<RootCauseCategory, number> = {
    navigation: 0,
    element_not_found: 0,
    element_disabled: 0,
    timeout: 0,
    assertion: 0,
    network: 0,
    script_error: 0,
    unknown: 0,
  };

  const commonPatterns: string[] = [];
  const flakyTests: string[] = [];
  const recommendations: string[] = [];

  // Count failures by category
  for (const analysis of caseAnalyses) {
    failuresByCategory[analysis.rootCause.category]++;
  }

  // Identify common patterns
  const categoryCounts = Object.entries(failuresByCategory)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  for (const [category, count] of categoryCounts) {
    if (count >= 2) {
      commonPatterns.push(`${category}: ${count} failures`);
    }
  }

  // Generate recommendations based on patterns
  const topCategory = categoryCounts[0]?.[0];
  if (topCategory) {
    switch (topCategory) {
      case "element_not_found":
        recommendations.push(
          "Consider implementing a more robust element selection strategy",
          "Add explicit waits for dynamic content",
          "Review page structure for elements that may be loading asynchronously"
        );
        break;
      case "timeout":
        recommendations.push(
          "Review network performance",
          "Consider increasing default timeout values",
          "Check for resource-heavy operations blocking page load"
        );
        break;
      case "navigation":
        recommendations.push(
          "Implement retry logic for navigation failures",
          "Add URL validation before navigation",
          "Check for redirect chains that may cause issues"
        );
        break;
    }
  }

  // Identify potentially flaky tests (failed after passing in same suite)
  // (simplified - in production would track history)

  return {
    totalFailures: caseAnalyses.length,
    failuresByCategory,
    commonPatterns,
    flakyTests,
    recommendations,
  };
}

/**
 * Analyze test run results
 *
 * @param runResult - Results from test run
 * @returns Analysis result with root causes and recommendations
 */
export function analyzeTestRun(runResult: TestRunResult): QAAnalysisResult {
  const caseAnalyses: FailureAnalysis[] = [];

  // Analyze each failed test case
  for (const suiteResult of runResult.suites) {
    for (const caseResult of suiteResult.cases) {
      if (caseResult.status === "failed") {
        const analysis = analyzeFailure(caseResult, caseResult.evidence);
        caseAnalyses.push(analysis);
      }
    }
  }

  // Perform aggregate analysis
  const aggregate = aggregateAnalysis(caseAnalyses);

  // Calculate overall health score
  const overallHealth =
    runResult.totalCases > 0
      ? Math.round((runResult.passed / runResult.totalCases) * 100)
      : 100;

  return {
    runId: runResult.id,
    analyzedAt: Date.now(),
    caseAnalyses,
    aggregate,
    overallHealth,
  };
}

/**
 * Generate fix suggestion for a failed test case
 */
export function generateFixSuggestion(analysis: FailureAnalysis): string {
  const lines: string[] = [];

  lines.push(`## Fix Suggestion for ${analysis.caseName}`);
  lines.push("");
  lines.push(`**Root Cause:** ${analysis.rootCause.category}`);
  lines.push(`**Confidence:** ${Math.round(analysis.rootCause.confidence * 100)}%`);
  lines.push("");
  lines.push("### Suggested Fixes:");
  lines.push("");

  for (const suggestion of analysis.rootCause.suggestions) {
    lines.push(`- ${suggestion}`);
  }

  lines.push("");
  lines.push("### Reproducible Steps:");
  lines.push("");

  for (const step of analysis.reproduceSteps) {
    lines.push(step);
  }

  return lines.join("\n");
}
