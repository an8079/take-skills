/**
 * QA Types
 *
 * Shared type definitions for the QA workflow.
 */

// Re-export from submodules for convenience
export type {
  TestPriority,
  TestCaseStatus,
  TestAssertion,
  TestStep,
  TestCase,
  TestSuite,
  QAPlanConfig,
  TestPlan,
  PageAnalyzer,
  PageAnalysisResult,
  FormInfo,
  LinkInfo,
  ElementInfo,
  InputInfo,
  RecommendedTestCase,
} from "./plan.js";

export type {
  TestRunStatus,
  StepResult,
  TestCaseResult,
  TestSuiteResult,
  TestRunResult,
  QARunConfig,
} from "./run.js";

export type {
  RootCauseCategory,
  RootCause,
  FailureAnalysis,
  AggregateAnalysis,
  QAAnalysisResult,
} from "./analyze.js";

export type {
  ReportFormat,
  ReportConfig,
  ReportSummary,
  SuiteSummary,
  CaseSummary,
  QAReport,
  FailureReport,
  EvidenceSummary,
} from "./report.js";

export type {
  FixLoopStatus,
  FixAction,
  FixLoopIteration,
  FixLoopResult,
  FixLoopConfig,
} from "./fix-loop.js";

export type { EvidenceType, EvidenceItem, EvidenceCollectorConfig } from "./evidence.js";
