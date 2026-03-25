/**
 * QA Run - Test Execution Phase
 *
 * Executes test plans and collects results.
 */

import type { BrowserProvider } from "../providers/browser/types.js";
import type { EvidenceCollector, EvidenceItem } from "./evidence.js";
import type { TestCase, TestSuite, TestPlan, TestCaseStatus, TestAssertion } from "./plan.js";
import { EvidenceCollector as EvidenceCollectorClass } from "./evidence.js";

/**
 * Test run status
 */
export type TestRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

/**
 * Single test step result
 */
export interface StepResult {
  stepId: string;
  action: string;
  target?: string;
  value?: string;
  duration?: number;
  success: boolean;
  error?: string;
  screenshot?: string;
}

/**
 * Single test case result
 */
export interface TestCaseResult {
  caseId: string;
  status: TestCaseStatus;
  startTime: number;
  endTime: number;
  duration: number;
  steps: StepResult[];
  assertions: TestAssertion[];
  evidence: EvidenceItem[];
  error?: string;
}

/**
 * Test suite result
 */
export interface TestSuiteResult {
  suiteId: string;
  suiteName: string;
  status: TestRunStatus;
  cases: TestCaseResult[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

/**
 * Test run result
 */
export interface TestRunResult {
  id: string;
  planId: string;
  status: TestRunStatus;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  suites: TestSuiteResult[];
  totalCases: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  evidence: EvidenceItem[];
  errors: string[];
}

/**
 * QA Run configuration
 */
export interface QARunConfig {
  browser: BrowserProvider;
  plan: TestPlan;
  headless?: boolean;
  continueOnFailure?: boolean;
  captureEvidence?: boolean;
  screenshotOnFailure?: boolean;
  parallel?: boolean;
  onCaseStart?: (testCase: TestCase) => void;
  onCaseComplete?: (result: TestCaseResult) => void;
  onSuiteStart?: (suite: TestSuite) => void;
  onSuiteComplete?: (result: TestSuiteResult) => void;
}

/**
 * Execute a single test step
 */
async function executeStep(
  browser: BrowserProvider,
  step: TestCase["steps"][0],
  collector: EvidenceCollector
): Promise<StepResult> {
  const startTime = Date.now();
  const result: StepResult = {
    stepId: step.id,
    action: step.action,
    target: step.target,
    value: step.value,
    success: true,
  };

  try {
    await browser.recordAction(step.action, step.target);

    switch (step.action) {
      case "navigate":
        await browser.navigate({
          url: step.value!,
          timeout: 30000,
          waitUntil: "networkidle",
        });
        break;

      case "click":
        await browser.click(step.target!, { delay: 100 });
        break;

      case "dblClick":
        await browser.dblClick(step.target!);
        break;

      case "rightClick":
        await browser.rightClick(step.target!);
        break;

      case "hover":
        await browser.hover(step.target!);
        break;

      case "fill":
        await browser.fill(step.target!, step.value!);
        break;

      case "type":
        await browser.typeText(step.target!, step.value!);
        break;

      case "press":
        await browser.press(step.value!);
        break;

      case "select":
        await browser.select(step.target!, step.value!);
        break;

      case "setChecked":
        await browser.setChecked(step.target!, step.value === "true");
        break;

      case "waitForSelector":
        await browser.waitForSelector(step.target!, 30000);
        break;

      case "waitForNavigation":
        await browser.waitForNavigation();
        break;

      case "waitForFunction":
        await browser.waitForFunction(step.value!);
        break;

      case "waitForUrl":
        await browser.waitForUrl(step.value!);
        break;

      case "goBack":
        await browser.goBack();
        break;

      case "goForward":
        await browser.goForward();
        break;

      case "reload":
        await browser.reload();
        break;

      case "evaluate":
        await browser.evaluate(step.value!);
        break;

      case "screenshot":
        await collector.captureScreenshot(step.target);
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    if (step.screenshot) {
      result.screenshot = await collector.captureScreenshot(`${step.action}_${step.target}`);
    }

    result.success = true;
    result.duration = Date.now() - startTime;
  } catch (err) {
    result.success = false;
    result.error = String(err);
    result.duration = Date.now() - startTime;
  }

  return result;
}

/**
 * Execute assertions for a test case
 */
async function executeAssertions(
  browser: BrowserProvider,
  assertions: TestAssertion[]
): Promise<TestAssertion[]> {
  const results: TestAssertion[] = [];

  for (const assertion of assertions) {
    const result = { ...assertion };

    try {
      switch (assertion.type) {
        case "equals": {
          let actual: unknown;
          if (assertion.target === "title") {
            actual = await browser.getTitle();
          } else if (assertion.target === "url") {
            actual = await browser.getUrl();
          } else {
            const evalResult = await browser.evaluate(
              `document.querySelector('${assertion.target}')?.textContent`
            );
            actual = evalResult.success ? evalResult.value : undefined;
          }
          result.actual = actual;
          result.passed = actual === assertion.expected;
          break;
        }

        case "contains": {
          let actual: string;
          if (assertion.target === "title") {
            actual = await browser.getTitle();
          } else if (assertion.target === "url") {
            actual = await browser.getUrl();
          } else {
            const evalResult = await browser.evaluate(
              `document.querySelector('${assertion.target}')?.textContent ?? ''`
            );
            actual = String(evalResult.success ? evalResult.value : "");
          }
          result.actual = actual;
          result.passed = actual.includes(String(assertion.expected ?? ""));
          break;
        }

        case "matches": {
          const evalResult = await browser.evaluate(
            `document.querySelector('${assertion.target}')?.textContent ?? ''`
          );
          const actual = String(evalResult.success ? evalResult.value : "");
          result.actual = actual;
          result.passed = new RegExp(String(assertion.expected)).test(actual);
          break;
        }

        case "exists": {
          const evalResult = await browser.evaluate(
            `!!document.querySelector('${assertion.target}')`
          );
          result.actual = evalResult.success ? evalResult.value : false;
          result.passed = Boolean(result.actual);
          break;
        }

        case "notExists": {
          const evalResult = await browser.evaluate(
            `!!document.querySelector('${assertion.target}')`
          );
          result.actual = evalResult.success ? evalResult.value : false;
          result.passed = !Boolean(result.actual);
          break;
        }

        case "custom":
          result.passed = assertion.expected === true;
          break;
      }

      if (!result.message) {
        result.message = result.passed
          ? `Assertion passed: ${assertion.type}`
          : `Assertion failed: ${assertion.type} - expected ${assertion.expected}, got ${result.actual}`;
      }
    } catch (err) {
      result.passed = false;
      result.error = String(err);
      result.message = `Assertion error: ${err}`;
    }

    results.push(result);
  }

  return results;
}

/**
 * Execute a single test case
 */
async function executeTestCase(
  browser: BrowserProvider,
  testCase: TestCase,
  collector: EvidenceCollector,
  config: Pick<QARunConfig, "continueOnFailure" | "captureEvidence">
): Promise<TestCaseResult> {
  const startTime = Date.now();
  const result: TestCaseResult = {
    caseId: testCase.id,
    status: "running",
    startTime,
    endTime: 0,
    duration: 0,
    steps: [],
    assertions: [],
    evidence: [],
  };

  // Start trace session for this test case
  await collector.startTrace(`trace_${testCase.id}`);

  try {
    for (const step of testCase.steps) {
      const stepResult = await executeStep(browser, step, collector);
      result.steps.push(stepResult);

      if (!stepResult.success && !step.continueOnError) {
        // Capture evidence on failure
        if (config.captureEvidence) {
          await collector.captureScreenshot("failure");
          result.evidence = await collector.collectAll();
        }

        result.status = "failed";
        result.error = `Step ${step.id} failed: ${stepResult.error}`;
        break;
      }
    }

    // Execute assertions if all steps passed
    if (result.status === "running") {
      result.assertions = await executeAssertions(browser, testCase.assertions);

      const allPassed = result.assertions.every((a) => a.passed);
      result.status = allPassed ? "passed" : "failed";

      if (!allPassed) {
        const failed = result.assertions.filter((a) => !a.passed);
        result.error = `Assertions failed: ${failed.map((f) => f.message).join("; ")}`;
      }
    }

    // Capture evidence if requested and test failed
    if (config.captureEvidence && result.status === "failed") {
      result.evidence = await collector.collectAll();
    }
  } catch (err) {
    result.status = "failed";
    result.error = String(err);
    if (config.captureEvidence) {
      result.evidence = await collector.collectAll();
    }
  } finally {
    result.endTime = Date.now();
    result.duration = result.endTime - startTime;
    await collector.stopTrace();
  }

  return result;
}

/**
 * Execute a test suite
 */
async function executeTestSuite(
  browser: BrowserProvider,
  suite: TestSuite,
  collector: EvidenceCollector,
  config: QARunConfig
): Promise<TestSuiteResult> {
  const startTime = Date.now();
  const result: TestSuiteResult = {
    suiteId: suite.id,
    suiteName: suite.name,
    status: "running",
    cases: [],
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  };

  config.onSuiteStart?.(suite);

  for (const testCase of suite.cases) {
    const caseResult = await executeTestCase(browser, testCase, collector, {
      continueOnFailure: config.continueOnFailure ?? true,
      captureEvidence: config.captureEvidence ?? true,
    });

    result.cases.push(caseResult);

    switch (caseResult.status) {
      case "passed":
        result.passed++;
        break;
      case "failed":
        result.failed++;
        break;
      case "skipped":
        result.skipped++;
        break;
    }

    config.onCaseComplete?.(caseResult);

    // Stop on first failure if not continuing
    if (caseResult.status === "failed" && !config.continueOnFailure) {
      break;
    }
  }

  result.status = result.failed === 0 ? "completed" : "failed";
  result.duration = Date.now() - startTime;

  config.onSuiteComplete?.(result);

  return result;
}

/**
 * Execute a test plan
 *
 * @param config - Run configuration
 * @returns Test run result
 */
export async function executeTestPlan(config: QARunConfig): Promise<TestRunResult> {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Launch browser
  await config.browser.launch({
    headless: config.headless ?? true,
    viewport: config.plan.config.viewport,
  });

  // Create evidence collector
  const collector = new EvidenceCollectorClass(config.browser, {
    collectScreenshots: config.captureEvidence ?? true,
    collectConsole: true,
    collectNetwork: true,
    collectTrace: true,
    collectHtml: true,
  });

  const result: TestRunResult = {
    id: runId,
    planId: config.plan.id,
    status: "running",
    startedAt: Date.now(),
    suites: [],
    totalCases: config.plan.totalCases,
    passed: 0,
    failed: 0,
    skipped: 0,
    passRate: 0,
    evidence: [],
    errors: [],
  };

  try {
    // Execute each suite
    for (const suite of config.plan.suites) {
      const suiteResult = await executeTestSuite(config.browser, suite, collector, config);
      result.suites.push(suiteResult);

      result.passed += suiteResult.passed;
      result.failed += suiteResult.failed;
      result.skipped += suiteResult.skipped;

      // Stop on first suite failure if not continuing
      if (suiteResult.failed > 0 && !config.continueOnFailure) {
        break;
      }
    }

    result.status = result.failed === 0 ? "completed" : "failed";
    result.passRate = result.totalCases > 0 ? (result.passed / result.totalCases) * 100 : 0;
  } catch (err) {
    result.status = "failed";
    result.errors.push(String(err));
  } finally {
    result.completedAt = Date.now();
    result.duration = result.completedAt - result.startedAt;
    result.evidence = collector.getEvidence();
  }

  return result;
}

/**
 * Run a single test case (for debugging)
 */
export async function runSingleTest(
  browser: BrowserProvider,
  testCase: TestCase,
  options: { headless?: boolean; captureEvidence?: boolean } = {}
): Promise<TestCaseResult> {
  await browser.launch({ headless: options.headless ?? true });

  const collector = new EvidenceCollectorClass(browser, {
    collectScreenshots: options.captureEvidence ?? true,
  });

  const result = await executeTestCase(browser, testCase, collector, {
    continueOnFailure: false,
    captureEvidence: options.captureEvidence ?? true,
  });

  await browser.close();
  return result;
}
