/**
 * QA Report - Results Reporting Phase
 *
 * Generates formatted test reports.
 */

import type { TestRunResult } from "./run.js";
import type { QAAnalysisResult, FailureAnalysis } from "./analyze.js";
import type { EvidenceItem } from "./evidence.js";

/**
 * Report format options
 */
export type ReportFormat = "json" | "html" | "markdown" | "console";

/**
 * Report configuration
 */
export interface ReportConfig {
  format?: ReportFormat;
  includeEvidence?: boolean;
  includeScreenshots?: boolean;
  includeTrace?: boolean;
  maxEvidenceItems?: number;
  theme?: "light" | "dark";
}

/**
 * Test result summary for report
 */
export interface ReportSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  duration: number;
  runId: string;
  planId: string;
  executedAt: number;
}

/**
 * Suite summary for report
 */
export interface SuiteSummary {
  name: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
}

/**
 * Case summary for report
 */
export interface CaseSummary {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

/**
 * Generated report data
 */
export interface QAReport {
  summary: ReportSummary;
  suites: SuiteSummary[];
  cases: CaseSummary[];
  failures: FailureReport[];
  metadata: Record<string, unknown>;
}

/**
 * Failure report entry
 */
export interface FailureReport {
  caseId: string;
  caseName: string;
  suiteName: string;
  error: string;
  rootCause: string;
  confidence: number;
  suggestions: string[];
  reproduceSteps: string[];
  evidence: EvidenceSummary[];
}

/**
 * Evidence summary
 */
export interface EvidenceSummary {
  type: string;
  timestamp: number;
  preview?: string;
  count?: number;
}

/**
 * Generate summary from test run result
 */
function generateSummary(runResult: TestRunResult): ReportSummary {
  return {
    total: runResult.totalCases,
    passed: runResult.passed,
    failed: runResult.failed,
    skipped: runResult.skipped,
    passRate: runResult.passRate,
    duration: runResult.duration ?? 0,
    runId: runResult.id,
    planId: runResult.planId,
    executedAt: runResult.startedAt,
  };
}

/**
 * Generate suite summaries
 */
function generateSuiteSummaries(runResult: TestRunResult): SuiteSummary[] {
  return runResult.suites.map((suite) => ({
    name: suite.suiteName,
    total: suite.cases.length,
    passed: suite.passed,
    failed: suite.failed,
    duration: suite.duration,
  }));
}

/**
 * Generate case summaries
 */
function generateCaseSummaries(runResult: TestRunResult): CaseSummary[] {
  const cases: CaseSummary[] = [];

  for (const suite of runResult.suites) {
    for (const caseResult of suite.cases) {
      cases.push({
        id: caseResult.caseId,
        name: caseResult.caseId,
        status: caseResult.status as "passed" | "failed" | "skipped",
        duration: caseResult.duration,
        error: caseResult.error,
      });
    }
  }

  return cases;
}

/**
 * Generate failure reports from analysis
 */
function generateFailureReports(
  analysis: QAAnalysisResult,
  runResult: TestRunResult
): FailureReport[] {
  const suiteMap = new Map<string, string>();

  for (const suite of runResult.suites) {
    suiteMap.set(suite.suiteId, suite.suiteName);
  }

  return analysis.caseAnalyses.map((caseAnalysis) => {
    const evidenceSummary: EvidenceSummary[] = caseAnalysis.evidence.map((e) => ({
      type: e.type,
      timestamp: e.timestamp,
      count: Array.isArray(e.data) ? e.data.length : undefined,
    }));

    return {
      caseId: caseAnalysis.caseId,
      caseName: caseAnalysis.caseName,
      suiteName: suiteMap.get(caseAnalysis.caseId.split("_")[1] ?? "") ?? "Unknown",
      error: caseAnalysis.failedStep?.error ?? "Unknown error",
      rootCause: caseAnalysis.rootCause.category,
      confidence: caseAnalysis.rootCause.confidence,
      suggestions: caseAnalysis.rootCause.suggestions,
      reproduceSteps: caseAnalysis.reproduceSteps,
      evidence: evidenceSummary,
    };
  });
}

/**
 * Generate report data
 */
export function generateReport(
  runResult: TestRunResult,
  analysis: QAAnalysisResult,
  config: ReportConfig = {}
): QAReport {
  return {
    summary: generateSummary(runResult),
    suites: generateSuiteSummaries(runResult),
    cases: generateCaseSummaries(runResult),
    failures: generateFailureReports(analysis, runResult),
    metadata: {
      generatedAt: Date.now(),
      format: config.format ?? "json",
      includesEvidence: config.includeEvidence ?? false,
    },
  };
}

/**
 * Format as JSON
 */
export function formatAsJson(report: QAReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format as Markdown
 */
export function formatAsMarkdown(report: QAReport): string {
  const lines: string[] = [];

  lines.push("# QA Test Report");
  lines.push("");
  lines.push(`**Run ID:** ${report.summary.runId}`);
  lines.push(`**Plan ID:** ${report.summary.planId}`);
  lines.push(`**Executed:** ${new Date(report.summary.executedAt).toISOString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total | ${report.summary.total} |`);
  lines.push(`| Passed | ${report.summary.passed} |`);
  lines.push(`| Failed | ${report.summary.failed} |`);
  lines.push(`| Skipped | ${report.summary.skipped} |`);
  lines.push(`| Pass Rate | ${report.summary.passRate.toFixed(1)}% |`);
  lines.push(`| Duration | ${(report.summary.duration / 1000).toFixed(1)}s |`);
  lines.push("");

  if (report.suites.length > 0) {
    lines.push("## Suites");
    lines.push("");
    lines.push(`| Suite | Total | Passed | Failed | Duration |`);
    lines.push(`|-------|-------|--------|--------|----------|`);

    for (const suite of report.suites) {
      lines.push(
        `| ${suite.name} | ${suite.total} | ${suite.passed} | ${suite.failed} | ${(suite.duration / 1000).toFixed(1)}s |`
      );
    }
    lines.push("");
  }

  if (report.failures.length > 0) {
    lines.push("## Failures");
    lines.push("");

    for (const failure of report.failures) {
      lines.push(`### ${failure.caseName}`);
      lines.push("");
      lines.push(`**Suite:** ${failure.suiteName}`);
      lines.push(`**Error:** ${failure.error}`);
      lines.push(`**Root Cause:** ${failure.rootCause} (${(failure.confidence * 100).toFixed(0)}% confidence)`);
      lines.push("");
      lines.push("**Suggestions:**");

      for (const suggestion of failure.suggestions) {
        lines.push(`- ${suggestion}`);
      }

      lines.push("");
      lines.push("**Reproduce Steps:**");
      lines.push("```");
      for (const step of failure.reproduceSteps) {
        lines.push(step);
      }
      lines.push("```");
      lines.push("");

      if (failure.evidence.length > 0) {
        lines.push("**Evidence:**");

        for (const ev of failure.evidence) {
          lines.push(`- ${ev.type} (${new Date(ev.timestamp).toISOString()})`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

/**
 * Format as HTML
 */
export function formatAsHtml(report: QAReport, config: ReportConfig = {}): string {
  const theme = config.theme ?? "light";
  const isDark = theme === "dark";

  const bgColor = isDark ? "#1a1a1a" : "#ffffff";
  const textColor = isDark ? "#e0e0e0" : "#333333";
  const borderColor = isDark ? "#444444" : "#dddddd";
  const passColor = "#22c55e";
  const failColor = "#ef4444";
  const skipColor = "#f59e0b";

  const lines: string[] = [];

  lines.push(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Test Report - ${report.summary.runId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bgColor};
      color: ${textColor};
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1, h2, h3 { color: ${textColor}; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric {
      background: ${isDark ? "#2a2a2a" : "#f5f5f5"};
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value { font-size: 2em; font-weight: bold; }
    .metric-label { font-size: 0.875em; opacity: 0.7; }
    .pass { color: ${passColor}; }
    .fail { color: ${failColor}; }
    .skip { color: ${skipColor}; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid ${borderColor}; }
    th { font-weight: 600; }
    .failure {
      background: ${isDark ? "#2a2020" : "#fef2f2"};
      border-left: 4px solid ${failColor};
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    .steps { font-family: monospace; background: ${isDark ? "#2a2a2a" : "#f5f5f5"}; padding: 12px; border-radius: 4px; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <h1>QA Test Report</h1>
    <p>Run ID: <code>${report.summary.runId}</code> | Plan ID: <code>${report.summary.planId}</code></p>
    <p>Executed: ${new Date(report.summary.executedAt).toLocaleString()}</p>

    <h2>Summary</h2>
    <div class="summary">
      <div class="metric">
        <div class="metric-value">${report.summary.total}</div>
        <div class="metric-label">Total</div>
      </div>
      <div class="metric">
        <div class="metric-value pass">${report.summary.passed}</div>
        <div class="metric-label">Passed</div>
      </div>
      <div class="metric">
        <div class="metric-value fail">${report.summary.failed}</div>
        <div class="metric-label">Failed</div>
      </div>
      <div class="metric">
        <div class="metric-value skip">${report.summary.skipped}</div>
        <div class="metric-label">Skipped</div>
      </div>
      <div class="metric">
        <div class="metric-value">${report.summary.passRate.toFixed(1)}%</div>
        <div class="metric-label">Pass Rate</div>
      </div>
      <div class="metric">
        <div class="metric-value">${(report.summary.duration / 1000).toFixed(1)}s</div>
        <div class="metric-label">Duration</div>
      </div>
    </div>`);

  if (report.suites.length > 0) {
    lines.push(`
    <h2>Suites</h2>
    <table>
      <thead>
        <tr><th>Suite</th><th>Total</th><th>Passed</th><th>Failed</th><th>Duration</th></tr>
      </thead>
      <tbody>`);

    for (const suite of report.suites) {
      lines.push(`
        <tr>
          <td>${suite.name}</td>
          <td>${suite.total}</td>
          <td class="pass">${suite.passed}</td>
          <td class="fail">${suite.failed}</td>
          <td>${(suite.duration / 1000).toFixed(1)}s</td>
        </tr>`);
    }

    lines.push("      </tbody>\n    </table>");
  }

  if (report.failures.length > 0) {
    lines.push(`
    <h2>Failures (${report.failures.length})</h2>`);

    for (const failure of report.failures) {
      lines.push(`
    <div class="failure">
      <h3>${failure.caseName}</h3>
      <p><strong>Suite:</strong> ${failure.suiteName}</p>
      <p><strong>Error:</strong> <code>${failure.error}</code></p>
      <p><strong>Root Cause:</strong> ${failure.rootCause} (${(failure.confidence * 100).toFixed(0)}% confidence)</p>
      <p><strong>Suggestions:</strong></p>
      <ul>
        ${failure.suggestions.map((s) => `<li>${s}</li>`).join("\n        ")}
      </ul>
      <p><strong>Reproduce Steps:</strong></p>
      <div class="steps">
        <pre>${failure.reproduceSteps.join("\n")}</pre>
      </div>
    </div>`);
    }
  }

  lines.push(`
  </div>
</body>
</html>`);

  return lines.join("\n");
}

/**
 * Format as console output
 */
export function formatAsConsole(report: QAReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("QA TEST REPORT");
  lines.push("=".repeat(60));
  lines.push(`Run ID:   ${report.summary.runId}`);
  lines.push(`Plan ID:  ${report.summary.planId}`);
  lines.push(`Executed: ${new Date(report.summary.executedAt).toLocaleString()}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push("-".repeat(40));
  lines.push(`  Total:     ${report.summary.total}`);
  lines.push(`  Passed:    ${report.summary.passed}`);
  lines.push(`  Failed:    ${report.summary.failed}`);
  lines.push(`  Skipped:   ${report.summary.skipped}`);
  lines.push(`  Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
  lines.push(`  Duration:  ${(report.summary.duration / 1000).toFixed(1)}s`);
  lines.push("");

  if (report.suites.length > 0) {
    lines.push("SUITES");
    lines.push("-".repeat(40));

    for (const suite of report.suites) {
      lines.push(`  ${suite.name}`);
      lines.push(`    Total: ${suite.total} | Passed: ${suite.passed} | Failed: ${suite.failed} | ${(suite.duration / 1000).toFixed(1)}s`);
    }
    lines.push("");
  }

  if (report.failures.length > 0) {
    lines.push(`FAILURES (${report.failures.length})`);
    lines.push("-".repeat(40));

    for (const failure of report.failures) {
      lines.push("");
      lines.push(`  [${failure.suiteName}] ${failure.caseName}`);
      lines.push(`    Error: ${failure.error}`);
      lines.push(`    Root Cause: ${failure.rootCause}`);
      lines.push(`    Suggestions:`);

      for (const suggestion of failure.suggestions) {
        lines.push(`      - ${suggestion}`);
      }

      lines.push(`    Reproduce Steps:`);

      for (const step of failure.reproduceSteps) {
        lines.push(`      ${step}`);
      }
    }
    lines.push("");
  }

  lines.push("=".repeat(60));

  return lines.join("\n");
}

/**
 * Format report based on config
 */
export function formatReport(report: QAReport, config: ReportConfig = {}): string {
  switch (config.format ?? "json") {
    case "json":
      return formatAsJson(report);
    case "html":
      return formatAsHtml(report, config);
    case "markdown":
      return formatAsMarkdown(report);
    case "console":
      return formatAsConsole(report);
    default:
      return formatAsJson(report);
  }
}

/**
 * Save report to file
 */
export async function saveReport(
  report: QAReport,
  filePath: string,
  config: ReportConfig = {}
): Promise<void> {
  const content = formatReport(report, config);

  // Dynamic import for file system operations
  const fs = await import("fs/promises");
  await fs.writeFile(filePath, content, "utf-8");
}
