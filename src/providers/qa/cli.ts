/**
 * QA CLI Provider
 *
 * Local CLI/script-based QA provider implementation.
 * Executes shell commands and scripts for QA validation.
 */

import { spawn } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import type {
  QAProvider,
  QAProviderType,
  QACheckConfig,
  QAResult,
  BugReport,
  Evidence,
  FixTask,
} from "./types.js";

/**
 * CLI QA provider implementation
 */
export class CLIQAProvider implements QAProvider {
  readonly type: QAProviderType = "cli";
  readonly version = "1.0.0";

  private initialized = false;
  private tempDir: string;

  constructor() {
    // Use process.cwd() as base for temp directory
    this.tempDir = join(process.cwd(), ".qa-temp");
  }

  /**
   * Initialize the CLI provider
   */
  async initialize(config?: Record<string, unknown>): Promise<void> {
    if (config?.tempDir) {
      this.tempDir = config.tempDir as string;
    }

    // Ensure temp directory exists
    if (!existsSync(this.tempDir)) {
      await mkdir(this.tempDir, { recursive: true });
    }

    this.initialized = true;
  }

  /**
   * Cleanup temporary resources
   */
  async cleanup(): Promise<void> {
    this.initialized = false;
  }

  /**
   * Run a single QA check
   */
  async runCheck(check: QACheckConfig): Promise<QAResult> {
    const startTime = Date.now();

    if (check.command) {
      return this.runCommandCheck(check);
    } else if (check.script) {
      return this.runScriptCheck(check);
    } else {
      return this.createFailedResult(
        `Check "${check.name}" has no command or script defined`,
        check
      );
    }
  }

  /**
   * Run a command-based check
   */
  private async runCommandCheck(check: QACheckConfig): Promise<QAResult> {
    const startTime = Date.now();

    try {
      const output = await this.execCommand(check.command!, check.timeout ?? 60000);
      const duration = Date.now() - startTime;

      return {
        passed: true,
        passedItems: [check.name],
        failedItems: [],
        summary: `Check "${check.name}" passed successfully`,
        duration,
        timestamp: Date.now(),
        metadata: { exitCode: output.exitCode, output: output.stdout },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      const bugReport = this.createBugReport({
        id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: `QA Check Failed: ${check.name}`,
        severity: check.severity ?? "major",
        reproduction: [`Command: ${check.command}`, `Error: ${errorMsg}`],
        evidence: [{ type: "log", data: errorMsg, timestamp: Date.now() }],
        suggestedFix: `Review command "${check.command}" for issues`,
        tags: check.tags,
      });

      return {
        passed: false,
        passedItems: [],
        failedItems: [bugReport],
        summary: `Check "${check.name}" failed: ${errorMsg}`,
        duration,
        timestamp: Date.now(),
        metadata: { command: check.command, error: errorMsg },
      };
    }
  }

  /**
   * Run a script-based check
   */
  private async runScriptCheck(check: QACheckConfig): Promise<QAResult> {
    const startTime = Date.now();

    try {
      // Write script to temp file
      const scriptPath = join(this.tempDir, `check_${Date.now()}.js`);
      await writeFile(scriptPath, check.script!, "utf-8");

      // Execute script
      const output = await this.execCommand(`node "${scriptPath}"`, check.timeout ?? 60000);
      const duration = Date.now() - startTime;

      // Try to parse JSON output if available
      let parsedResult: QAResult | null = null;
      if (output.stdout) {
        try {
          parsedResult = JSON.parse(output.stdout);
        } catch {
          // Not JSON, treat as success if exit code is 0
        }
      }

      if (parsedResult) {
        return {
          ...parsedResult,
          duration: duration,
          timestamp: Date.now(),
        };
      }

      if (output.exitCode === 0) {
        return {
          passed: true,
          passedItems: [check.name],
          failedItems: [],
          summary: `Script "${check.name}" executed successfully`,
          duration,
          timestamp: Date.now(),
        };
      } else {
        const bugReport = this.createBugReport({
          id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: `Script Failed: ${check.name}`,
          severity: check.severity ?? "major",
          reproduction: [`Script: ${check.script?.slice(0, 100)}...`, `Exit code: ${output.exitCode}`],
          evidence: [
            { type: "log", data: output.stdout, timestamp: Date.now() },
            { type: "log", data: output.stderr, timestamp: Date.now(), metadata: { stream: "stderr" } },
          ],
          suggestedFix: "Review script logic for potential issues",
          tags: check.tags,
        });

        return {
          passed: false,
          passedItems: [],
          failedItems: [bugReport],
          summary: `Script "${check.name}" failed with exit code ${output.exitCode}`,
          duration,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      const bugReport = this.createBugReport({
        id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: `Script Error: ${check.name}`,
        severity: check.severity ?? "major",
        reproduction: [`Script: ${check.script?.slice(0, 100)}...`, `Error: ${errorMsg}`],
        evidence: [{ type: "log", data: errorMsg, timestamp: Date.now() }],
        suggestedFix: "Check script syntax and dependencies",
        tags: check.tags,
      });

      return {
        passed: false,
        passedItems: [],
        failedItems: [bugReport],
        summary: `Script "${check.name}" error: ${errorMsg}`,
        duration,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Run multiple QA checks
   */
  async runChecks(checks: QACheckConfig[]): Promise<QAResult> {
    const startTime = Date.now();
    const allPassedItems: string[] = [];
    const allFailedItems: BugReport[] = [];

    for (const check of checks) {
      const result = await this.runCheck(check);
      allPassedItems.push(...result.passedItems);
      allFailedItems.push(...result.failedItems);
    }

    const duration = Date.now() - startTime;
    const passed = allFailedItems.length === 0;

    return {
      passed,
      passedItems: allPassedItems,
      failedItems: allFailedItems,
      summary: passed
        ? `All ${checks.length} checks passed`
        : `${allFailedItems.length} of ${checks.length} checks failed`,
      duration,
      timestamp: Date.now(),
    };
  }

  /**
   * Execute a shell command
   */
  async executeCommand(
    command: string,
    validation?: {
      expectExitCode?: number;
      expectOutput?: string | RegExp;
      expectNoOutput?: string | RegExp;
      timeout?: number;
    }
  ): Promise<QAResult> {
    const startTime = Date.now();

    try {
      const output = await this.execCommand(command, validation?.timeout ?? 60000);
      const duration = Date.now() - startTime;
      const errors: string[] = [];

      // Validate exit code
      if (validation?.expectExitCode !== undefined && output.exitCode !== validation.expectExitCode) {
        errors.push(`Exit code ${output.exitCode} does not match expected ${validation.expectExitCode}`);
      }

      // Validate output presence
      if (validation?.expectOutput) {
        const regex = validation.expectOutput instanceof RegExp
          ? validation.expectOutput
          : new RegExp(validation.expectOutput, "i");
        if (!regex.test(output.stdout) && !regex.test(output.stderr)) {
          errors.push(`Output does not match expected pattern: ${validation.expectOutput}`);
        }
      }

      // Validate output absence
      if (validation?.expectNoOutput) {
        const regex = validation.expectNoOutput instanceof RegExp
          ? validation.expectNoOutput
          : new RegExp(validation.expectNoOutput, "i");
        if (regex.test(output.stdout) || regex.test(output.stderr)) {
          errors.push(`Output contains unexpected pattern: ${validation.expectNoOutput}`);
        }
      }

      if (errors.length > 0) {
        const bugReport = this.createBugReport({
          id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: `Command Validation Failed`,
          severity: "major",
          reproduction: [`Command: ${command}`, ...errors],
          evidence: [
            { type: "log", data: output.stdout, timestamp: Date.now(), metadata: { stream: "stdout" } },
            { type: "log", data: output.stderr, timestamp: Date.now(), metadata: { stream: "stderr" } },
          ],
          suggestedFix: "Review command output and validation criteria",
        });

        return {
          passed: false,
          passedItems: [],
          failedItems: [bugReport],
          summary: errors.join("; "),
          duration,
          timestamp: Date.now(),
        };
      }

      return {
        passed: true,
        passedItems: [command],
        failedItems: [],
        summary: `Command executed successfully (exit code: ${output.exitCode})`,
        duration,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      const bugReport = this.createBugReport({
        id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: `Command Execution Failed`,
        severity: "major",
        reproduction: [`Command: ${command}`, `Error: ${errorMsg}`],
        evidence: [{ type: "log", data: errorMsg, timestamp: Date.now() }],
        suggestedFix: "Verify command syntax and dependencies",
      });

      return {
        passed: false,
        passedItems: [],
        failedItems: [bugReport],
        summary: `Command failed: ${errorMsg}`,
        duration,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Generate bug reports from QA result
   */
  generateBugReports(result: QAResult): BugReport[] {
    return result.failedItems;
  }

  /**
   * Export bug reports to specified format
   */
  exportBugReports(
    reports: BugReport[],
    format: "json" | "markdown" | "junit"
  ): string {
    switch (format) {
      case "json":
        return this.exportToJSON(reports);
      case "markdown":
        return this.exportToMarkdown(reports);
      case "junit":
        return this.exportToJUnit(reports);
      default:
        return this.exportToJSON(reports);
    }
  }

  /**
   * Export bug reports as JSON
   */
  private exportToJSON(reports: BugReport[]): string {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalBugs: reports.length,
        bugs: reports,
      },
      null,
      2
    );
  }

  /**
   * Export bug reports as Markdown
   */
  private exportToMarkdown(reports: BugReport[]): string {
    const lines: string[] = [
      "# Bug Report",
      "",
      `**Generated:** ${new Date().toISOString()}`,
      `**Total Bugs:** ${reports.length}`,
      "",
    ];

    for (const bug of reports) {
      lines.push(`## ${bug.id}: ${bug.title}`);
      lines.push("");
      lines.push(`- **Severity:** ${bug.severity}`);
      if (bug.rootCause) {
        lines.push(`- **Root Cause:** ${bug.rootCause}`);
      }
      lines.push("");
      lines.push("### Reproduction Steps");
      lines.push("");
      for (const step of bug.reproduction) {
        lines.push(`1. ${step}`);
      }
      lines.push("");
      lines.push("### Evidence");
      lines.push("");
      for (const ev of bug.evidence) {
        lines.push(`- **${ev.type}:** ${typeof ev.data === "string" ? ev.data.slice(0, 200) : JSON.stringify(ev.data)}`);
      }
      if (bug.suggestedFix) {
        lines.push("");
        lines.push("### Suggested Fix");
        lines.push("");
        lines.push(bug.suggestedFix);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Export bug reports as JUnit XML
   */
  private exportToJUnit(reports: BugReport[]): string {
    const testCases = reports
      .map((bug) => {
        const severity = bug.severity === "critical" ? "error" : "failure";
        const evidence = bug.evidence
          .map((e) => `${e.type}: ${typeof e.data === "string" ? e.data : JSON.stringify(e.data)}`)
          .join("; ");

        return `    <testcase name="${this.escapeXml(bug.title)}" classname="qa.${bug.id}" time="0">
      <${severity} message="${this.escapeXml(bug.reproduction[0] || bug.title)}">
        <![CDATA[
${bug.reproduction.map((s) => `  ${s}`).join("\n")}
---
Evidence: ${evidence}
${bug.suggestedFix ? `Suggested Fix: ${bug.suggestedFix}` : ""}
        ]]>
      </${severity}>
    </testcase>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="QA Bug Reports" tests="${reports.length}" failures="${reports.filter((b) => b.severity !== "critical").length}" errors="${reports.filter((b) => b.severity === "critical").length}" time="0" timestamp="${new Date().toISOString()}">
${testCases}
</testsuite>`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Write bug reports to execution chain feedback file
   */
  async writeToChain(reports: BugReport[], filePath: string): Promise<void> {
    const chainData = {
      timestamp: Date.now(),
      type: "qa-feedback",
      reports: reports.map((r) => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        summary: r.reproduction.join(" | "),
        evidence: r.evidence.map((e) => ({
          type: e.type,
          data: typeof e.data === "string" ? e.data.slice(0, 500) : e.data,
        })),
        suggestedFix: r.suggestedFix,
      })),
    };

    // Ensure directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(filePath, JSON.stringify(chainData, null, 2), "utf-8");
  }

  /**
   * Generate fix tasks from bug reports
   */
  generateFixTasks(reports: BugReport[]): FixTask[] {
    return reports.map((report) => ({
      id: `fix_${report.id}`,
      bugId: report.id,
      title: `Fix: ${report.title}`,
      description: [
        `Bug ID: ${report.id}`,
        `Severity: ${report.severity}`,
        "",
        "Reproduction:",
        ...report.reproduction.map((s) => `  ${s}`),
        "",
        report.suggestedFix ? `Suggested Fix: ${report.suggestedFix}` : "",
      ].join("\n"),
      severity: report.severity,
      priority: this.severityToPriority(report.severity),
      suggestedFix: report.suggestedFix,
      evidence: report.evidence,
      status: "pending",
      createdAt: Date.now(),
      tags: report.tags,
    }));
  }

  /**
   * Convert severity to priority
   */
  private severityToPriority(severity: string): "P0" | "P1" | "P2" | "P3" {
    switch (severity) {
      case "critical":
        return "P0";
      case "major":
        return "P1";
      case "minor":
        return "P2";
      default:
        return "P3";
    }
  }

  /**
   * Create a bug report
   */
  private createBugReport(data: BugReport): BugReport {
    return {
      ...data,
      severity: data.severity || "major",
      reproduction: data.reproduction || [],
      evidence: data.evidence || [],
    };
  }

  /**
   * Create a failed result
   */
  private createFailedResult(errorMessage: string, check: QACheckConfig): QAResult {
    const bugReport = this.createBugReport({
      id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: `QA Check Error: ${check.name}`,
      severity: check.severity ?? "major",
      reproduction: [`Check: ${check.name}`, `Error: ${errorMessage}`],
      evidence: [],
      suggestedFix: "Review check configuration",
      tags: check.tags,
    });

    return {
      passed: false,
      passedItems: [],
      failedItems: [bugReport],
      summary: errorMessage,
      timestamp: Date.now(),
    };
  }

  /**
   * Execute a shell command and return output
   */
  private execCommand(
    command: string,
    timeout: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === "win32";
      const shell = isWindows ? "cmd.exe" : "/bin/sh";
      const shellArgs = isWindows ? ["/c", command] : ["-c", command];

      const child = spawn(shell, shellArgs, {
        timeout,
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? 0,
        });
      });

      child.on("error", (err) => {
        reject(new Error(`Command failed to start: ${err.message}`));
      });

      // Handle timeout
      child.on("timeout", () => {
        child.kill("SIGTERM");
        reject(new Error(`Command timed out after ${timeout}ms`));
      });
    });
  }
}

/**
 * Create CLI QA provider instance
 */
export function createCLIIProvider(): QAProvider {
  return new CLIQAProvider();
}
