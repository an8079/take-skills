/**
 * QA Provider Types
 *
 * Abstract interface for QA automation providers.
 * Supports CLI/script-based testing implementations.
 */

/**
 * Supported QA provider types
 */
export type QAProviderType = "cli" | "script" | "builtin";

/**
 * Evidence supporting a bug report
 */
export interface Evidence {
  type: "screenshot" | "console" | "network" | "trace" | "html" | "state" | "log";
  data: string | Record<string, unknown>;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Bug severity level
 */
export type BugSeverity = "critical" | "major" | "minor";

/**
 * Bug report for a failed QA check
 */
export interface BugReport {
  id: string;
  title: string;
  severity: BugSeverity;
  reproduction: string[];
  evidence: Evidence[];
  suggestedFix?: string;
  testCaseId?: string;
  rootCause?: string;
  tags?: string[];
}

/**
 * QA result for a single test or check
 */
export interface QAResult {
  passed: boolean;
  passedItems: string[];
  failedItems: BugReport[];
  summary: string;
  duration?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * QA check configuration
 */
export interface QACheckConfig {
  name: string;
  command?: string;
  script?: string;
  timeout?: number;
  retry?: number;
  severity?: BugSeverity;
  tags?: string[];
}

/**
 * QA provider interface - abstract interface for QA automation
 * Implement this interface to add support for different QA tools/methods
 */
export interface QAProvider {
  /** Provider identifier */
  readonly type: QAProviderType;
  readonly version: string;

  // Lifecycle
  /**
   * Initialize QA provider
   * @param config - Optional provider configuration
   */
  initialize(config?: Record<string, unknown>): Promise<void>;

  /**
   * Cleanup QA provider resources
   */
  cleanup(): Promise<void>;

  // QA Execution
  /**
   * Run a QA check
   * @param check - Check configuration
   * @returns QA result
   */
  runCheck(check: QACheckConfig): Promise<QAResult>;

  /**
   * Run multiple QA checks
   * @param checks - Array of check configurations
   * @returns Combined QA result
   */
  runChecks(checks: QACheckConfig[]): Promise<QAResult>;

  /**
   * Execute a shell command and validate output
   * @param command - Command to execute
   * @param validation - Validation rules for output
   * @returns QA result
   */
  executeCommand(
    command: string,
    validation?: {
      expectExitCode?: number;
      expectOutput?: string | RegExp;
      expectNoOutput?: string | RegExp;
      timeout?: number;
    }
  ): Promise<QAResult>;

  // Bug report generation
  /**
   * Generate bug report from failed QA check
   * @param result - QA result with failures
   * @returns Array of bug reports
   */
  generateBugReports(result: QAResult): BugReport[];

  /**
   * Export bug reports to structured format
   * @param reports - Bug reports to export
   * @param format - Export format
   * @returns Exported data
   */
  exportBugReports(
    reports: BugReport[],
    format: "json" | "markdown" | "junit"
  ): string;

  // Integration
  /**
   * Write bug reports to execution chain feedback file
   * @param reports - Bug reports to write
   * @param filePath - Path to write to
   */
  writeToChain(reports: BugReport[], filePath: string): Promise<void>;

  /**
   * Generate fix tasks from bug reports
   * @param reports - Bug reports to convert
   * @returns Array of fix task objects
   */
  generateFixTasks(reports: BugReport[]): FixTask[];
}

/**
 * Fix task generated from bug report
 */
export interface FixTask {
  id: string;
  bugId: string;
  title: string;
  description: string;
  severity: BugSeverity;
  priority: "P0" | "P1" | "P2" | "P3";
  suggestedFix?: string;
  evidence: Evidence[];
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: number;
  tags?: string[];
}

/**
 * Factory function for creating QA providers
 */
export type QAProviderFactory = (type: QAProviderType) => QAProvider;
