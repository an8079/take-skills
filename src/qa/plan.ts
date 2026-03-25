/**
 * QA Plan - Test Planning Phase
 *
 * Analyzes test requirements and generates test plans.
 */

import type { BrowserProvider } from "../providers/browser/types.js";

/**
 * Test case priority levels
 */
export type TestPriority = "P0" | "P1" | "P2" | "P3";

/**
 * Test case status
 */
export type TestCaseStatus = "pending" | "ready" | "running" | "passed" | "failed" | "skipped";

/**
 * Test assertion definition
 */
export interface TestAssertion {
  id: string;
  type: "equals" | "contains" | "matches" | "exists" | "notExists" | "custom";
  target: string;
  expected?: unknown;
  actual?: unknown;
  message?: string;
  passed?: boolean;
  error?: string;
}

/**
 * Test step definition
 */
export interface TestStep {
  id: string;
  action: string;
  target?: string;
  value?: string;
  options?: Record<string, unknown>;
  screenshot?: boolean;
  continueOnError?: boolean;
}

/**
 * Test case definition
 */
export interface TestCase {
  id: string;
  name: string;
  description?: string;
  priority: TestPriority;
  tags: string[];
  steps: TestStep[];
  assertions: TestAssertion[];
  timeout: number;
  retries: number;
  status: TestCaseStatus;
  startTime?: number;
  endTime?: number;
  error?: string;
}

/**
 * Test suite definition
 */
export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  cases: TestCase[];
  setup?: TestStep[];
  teardown?: TestStep[];
  tags: string[];
}

/**
 * QA Plan configuration
 */
export interface QAPlanConfig {
  url: string;
  viewport?: { width: number; height: number };
  timeout?: number;
  retries?: number;
  priorities?: TestPriority[];
  tags?: string[];
}

/**
 * Generated test plan
 */
export interface TestPlan {
  id: string;
  url: string;
  createdAt: number;
  suites: TestSuite[];
  config: QAPlanConfig;
  estimatedDuration: number;
  totalCases: number;
}

/**
 * Analyze page and generate test cases
 *
 * Scans a page for interactive elements and generates
 * test cases based on the page structure.
 */
export interface PageAnalyzer {
  /**
   * Analyze page for interactive elements
   */
  analyze(): Promise<PageAnalysisResult>;
}

/**
 * Page analysis result
 */
export interface PageAnalysisResult {
  title: string;
  url: string;
  forms: FormInfo[];
  links: LinkInfo[];
  buttons: ElementInfo[];
  inputs: InputInfo[];
  recommendedCases: RecommendedTestCase[];
}

/**
 * Form information
 */
export interface FormInfo {
  selector: string;
  action?: string;
  method?: string;
  fields: string[];
}

/**
 * Link information
 */
export interface LinkInfo {
  selector: string;
  href: string;
  text: string;
  external: boolean;
}

/**
 * Element information
 */
export interface ElementInfo {
  selector: string;
  tagName: string;
  text?: string;
  attributes: Record<string, string>;
}

/**
 * Input information
 */
export interface InputInfo {
  selector: string;
  type: string;
  name?: string;
  id?: string;
  label?: string;
  required: boolean;
}

/**
 * Recommended test case from analysis
 */
export interface RecommendedTestCase {
  name: string;
  description: string;
  priority: TestPriority;
  tags: string[];
  steps: Omit<TestStep, "id">[];
}

/**
 * Generate test plan from URL analysis
 *
 * @param browser - Browser provider instance
 * @param config - Plan configuration
 * @returns Generated test plan
 */
export async function generateTestPlan(
  browser: BrowserProvider,
  config: QAPlanConfig
): Promise<TestPlan> {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Navigate to URL
  await browser.navigate({
    url: config.url,
    timeout: config.timeout ?? 30000,
    waitUntil: "networkidle",
  });

  // Analyze page
  const analysisResult = await analyzePage(browser);

  // Generate test cases from analysis
  const testCases = generateTestCases(analysisResult, config);

  // Group into suites
  const suites = groupIntoSuites(testCases);

  const plan: TestPlan = {
    id: planId,
    url: config.url,
    createdAt: Date.now(),
    suites,
    config,
    estimatedDuration: calculateDuration(suites),
    totalCases: testCases.length,
  };

  return plan;
}

/**
 * Analyze current page for testable elements
 */
export async function analyzePage(browser: BrowserProvider): Promise<PageAnalysisResult> {
  const [title, url] = await Promise.all([browser.getTitle(), browser.getUrl()]);

  // Extract forms
  const formsResult = await browser.evaluate<FormInfo[]>(`
    Array.from(document.querySelectorAll('form')).map(form => ({
      selector: getSelector(form),
      action: form.action,
      method: form.method,
      fields: Array.from(form.querySelectorAll('input, select, textarea')).map(el => getSelector(el))
    }))
  `);

  // Extract links
  const linksResult = await browser.evaluate<LinkInfo[]>(`
    Array.from(document.querySelectorAll('a[href]')).map(a => ({
      selector: getSelector(a),
      href: a.href,
      text: a.textContent?.trim() ?? '',
      external: a.host !== window.location.host
    })).slice(0, 50)
  `);

  // Extract buttons
  const buttonsResult = await browser.evaluate<ElementInfo[]>(`
    Array.from(document.querySelectorAll('button, [role="button"]')).map(btn => ({
      selector: getSelector(btn),
      tagName: btn.tagName.toLowerCase(),
      text: btn.textContent?.trim(),
      attributes: Object.fromEntries(
        Array.from(btn.attributes).map(attr => [attr.name, attr.value])
      )
    }))
  `);

  // Extract inputs
  const inputsResult = await browser.evaluate<InputInfo[]>(`
    Array.from(document.querySelectorAll('input, select, textarea')).map(input => ({
      selector: getSelector(input),
      type: input.type ?? input.tagName.toLowerCase(),
      name: input.name,
      id: input.id,
      label: input.labels?.[0]?.textContent?.trim(),
      required: input.required
    }))
  `);

  const forms = formsResult.success ? (formsResult.value ?? []) : [];
  const links = linksResult.success ? (linksResult.value ?? []) : [];
  const buttons = buttonsResult.success ? (buttonsResult.value ?? []) : [];
  const inputs = inputsResult.success ? (inputsResult.value ?? []) : [];

  // Generate recommended test cases
  const recommendedCases: RecommendedTestCase[] = [];

  // Add form test cases
  for (const form of forms) {
    if (form.fields.length > 0) {
      recommendedCases.push({
        name: `Test form submission: ${form.selector}`,
        description: `Submit form at ${form.selector}`,
        priority: "P1",
        tags: ["form", "submission"],
        steps: [
          { action: "click", target: form.fields[0], screenshot: true },
          { action: "fill", target: form.fields[0], value: "test value" },
        ],
      });
    }
  }

  // Add link test cases for external links
  for (const link of links.filter((l) => l.external).slice(0, 5)) {
    recommendedCases.push({
      name: `Test external link: ${link.text || link.href}`,
      description: `Navigate to external URL: ${link.href}`,
      priority: "P2",
      tags: ["navigation", "external"],
      steps: [
        { action: "click", target: link.selector, screenshot: true },
        { action: "waitForNavigation", screenshot: true },
      ],
    });
  }

  return {
    title,
    url,
    forms,
    links,
    buttons,
    inputs,
    recommendedCases,
  };
}

/**
 * Generate test cases from page analysis
 */
function generateTestCases(
  analysis: PageAnalysisResult,
  config: QAPlanConfig
): TestCase[] {
  const cases: TestCase[] = [];
  const caseIdPrefix = `case_${Date.now()}`;

  // Page load test
  cases.push({
    id: `${caseIdPrefix}_load`,
    name: "Page loads successfully",
    description: `Verify page at ${analysis.url} loads without errors`,
    priority: "P0",
    tags: ["smoke", "load"],
    steps: [
      {
        id: "step_1",
        action: "navigate",
        value: config.url,
        screenshot: true,
      },
    ],
    assertions: [
      {
        id: "assert_1",
        type: "contains",
        target: "title",
        expected: "",
        message: "Page should load",
      },
    ],
    timeout: config.timeout ?? 30000,
    retries: config.retries ?? 1,
    status: "pending",
  });

  // Element existence tests
  for (let i = 0; i < analysis.buttons.slice(0, 5).length; i++) {
    const btn = analysis.buttons[i];
    cases.push({
      id: `${caseIdPrefix}_button_${i}`,
      name: `Button exists: ${btn.selector}`,
      description: `Verify button ${btn.selector} exists`,
      priority: "P1",
      tags: ["element", "button"],
      steps: [
        {
          id: "step_1",
          action: "navigate",
          value: config.url,
        },
        {
          id: "step_2",
          action: "waitForSelector",
          target: btn.selector,
          screenshot: true,
        },
      ],
      assertions: [
        {
          id: "assert_1",
          type: "exists",
          target: btn.selector,
          message: `Button ${btn.selector} should exist`,
        },
      ],
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 1,
      status: "pending",
    });
  }

  // Form tests
  for (let i = 0; i < analysis.forms.slice(0, 3).length; i++) {
    const form = analysis.forms[i];
    const input = analysis.inputs.find((inp) => form.fields.includes(inp.selector));

    if (input) {
      cases.push({
        id: `${caseIdPrefix}_form_${i}`,
        name: `Form interaction: ${form.selector}`,
        description: `Test form at ${form.selector}`,
        priority: "P1",
        tags: ["form", "interaction"],
        steps: [
          {
            id: "step_1",
            action: "navigate",
            value: config.url,
          },
          {
            id: "step_2",
            action: "fill",
            target: input.selector,
            value: "Test value",
            screenshot: true,
          },
        ],
        assertions: [
          {
            id: "assert_1",
            type: "exists",
            target: form.selector,
            message: `Form ${form.selector} should be interactable`,
          },
        ],
        timeout: config.timeout ?? 30000,
        retries: config.retries ?? 1,
        status: "pending",
      });
    }
  }

  // Filter by priority
  const priorityFilter = config.priorities ?? ["P0", "P1", "P2"];
  return cases.filter((c) => priorityFilter.includes(c.priority));
}

/**
 * Group test cases into suites
 */
function groupIntoSuites(cases: TestCase[]): TestSuite[] {
  const suiteMap = new Map<string, TestCase[]>();
  const tagSuiteMap: Record<string, string> = {
    smoke: "Smoke Tests",
    load: "Load Tests",
    form: "Form Tests",
    navigation: "Navigation Tests",
    element: "Element Tests",
  };

  for (const testCase of cases) {
    const suiteName = testCase.tags
      .map((tag) => tagSuiteMap[tag] ?? "General")
      .find((name) => name !== "General") ?? "General";

    if (!suiteMap.has(suiteName)) {
      suiteMap.set(suiteName, []);
    }
    suiteMap.get(suiteName)!.push(testCase);
  }

  return Array.from(suiteMap.entries()).map(([name, testCases], index) => ({
    id: `suite_${index}`,
    name,
    description: `Test suite for ${name.toLowerCase()}`,
    cases: testCases,
    tags: testCases.flatMap((c) => c.tags),
  }));
}

/**
 * Calculate estimated duration for all test cases
 */
function calculateDuration(suites: TestSuite[]): number {
  const avgCaseDuration = 5000; // 5 seconds average per test case
  const totalCases = suites.reduce((sum, s) => sum + s.cases.length, 0);
  return totalCases * avgCaseDuration;
}

/**
 * Create a test plan from predefined test cases
 *
 * @param cases - Array of test cases
 * @param config - Plan configuration
 * @returns Test plan
 */
export function createTestPlan(cases: TestCase[], config: QAPlanConfig): TestPlan {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const suites = groupIntoSuites(cases);

  return {
    id: planId,
    url: config.url,
    createdAt: Date.now(),
    suites,
    config,
    estimatedDuration: calculateDuration(suites),
    totalCases: cases.length,
  };
}
