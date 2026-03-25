/**
 * QA Evidence Collector
 *
 * Collects screenshots, logs, and traces for test failures.
 */

import type { BrowserProvider } from "../providers/browser/types.js";
import type { TraceSession, ScreenshotOptions } from "../providers/browser/types.js";

/**
 * Evidence type enumeration
 */
export type EvidenceType = "screenshot" | "console" | "network" | "trace" | "html" | "state";

/**
 * Single evidence item
 */
export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  timestamp: number;
  data: string | Record<string, unknown> | unknown[];
  metadata?: Record<string, unknown>;
}

/**
 * Evidence collection configuration
 */
export interface EvidenceCollectorConfig {
  collectScreenshots?: boolean;
  collectConsole?: boolean;
  collectNetwork?: boolean;
  collectTrace?: boolean;
  collectHtml?: boolean;
  screenshotOptions?: ScreenshotOptions;
}

/**
 * Evidence collector for QA failures
 *
 * Collects various forms of evidence from browser sessions
 * to help diagnose and reproduce test failures.
 */
export class EvidenceCollector {
  private browser: BrowserProvider;
  private config: EvidenceCollectorConfig;
  private evidence: EvidenceItem[] = [];
  private screenshotCounter = 0;
  private traceSession: TraceSession | null = null;

  constructor(browser: BrowserProvider, config: EvidenceCollectorConfig = {}) {
    this.browser = browser;
    this.config = {
      collectScreenshots: true,
      collectConsole: true,
      collectNetwork: true,
      collectTrace: true,
      collectHtml: true,
      ...config,
    };
  }

  /**
   * Generate unique evidence ID
   */
  private generateId(type: EvidenceType): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Collect all enabled evidence types
   */
  async collectAll(): Promise<EvidenceItem[]> {
    this.evidence = [];

    if (this.config.collectScreenshots) {
      await this.captureScreenshot();
    }
    if (this.config.collectConsole) {
      await this.captureConsole();
    }
    if (this.config.collectNetwork) {
      await this.captureNetwork();
    }
    if (this.config.collectTrace && this.traceSession) {
      await this.captureTrace();
    }
    if (this.config.collectHtml) {
      await this.captureHtml();
    }

    return this.evidence;
  }

  /**
   * Capture current page screenshot
   */
  async captureScreenshot(label?: string): Promise<string> {
    try {
      const options = this.config.screenshotOptions ?? {};
      const base64 = await this.browser.screenshot(options);
      const id = this.generateId("screenshot");
      this.screenshotCounter++;

      const item: EvidenceItem = {
        id,
        type: "screenshot",
        timestamp: Date.now(),
        data: base64,
        metadata: {
          label: label ?? `screenshot_${this.screenshotCounter}`,
          format: options.type ?? "png",
        },
      };

      this.evidence.push(item);
      return id;
    } catch (err) {
      const id = this.generateId("screenshot");
      this.evidence.push({
        id,
        type: "screenshot",
        timestamp: Date.now(),
        data: "",
        metadata: { error: String(err) },
      });
      return id;
    }
  }

  /**
   * Capture console logs
   */
  async captureConsole(): Promise<string> {
    const messages = this.browser.getConsoleMessages();
    const id = this.generateId("console");

    const item: EvidenceItem = {
      id,
      type: "console",
      timestamp: Date.now(),
      data: messages.map((m) => ({
        type: m.type,
        text: m.text,
        location: m.location,
        timestamp: m.timestamp,
      })),
      metadata: { count: messages.length },
    };

    this.evidence.push(item);
    return id;
  }

  /**
   * Capture network logs
   */
  async captureNetwork(): Promise<string> {
    const logs = this.browser.getNetworkLogs();
    const id = this.generateId("network");

    const item: EvidenceItem = {
      id,
      type: "network",
      timestamp: Date.now(),
      data: logs,
      metadata: { count: logs.length },
    };

    this.evidence.push(item);
    return id;
  }

  /**
   * Capture trace session
   */
  async captureTrace(): Promise<string | null> {
    if (!this.traceSession) {
      return null;
    }

    const id = this.generateId("trace");

    const item: EvidenceItem = {
      id,
      type: "trace",
      timestamp: Date.now(),
      data: this.traceSession as unknown as Record<string, unknown>,
      metadata: {
        duration: this.traceSession.endTime
          ? this.traceSession.endTime - this.traceSession.startTime
          : undefined,
        actionCount: this.traceSession.actions.length,
      },
    };

    this.evidence.push(item);
    return id;
  }

  /**
   * Capture page HTML
   */
  async captureHtml(selector?: string): Promise<string> {
    try {
      const html = await this.browser.getHtml(selector);
      const id = this.generateId("html");

      const item: EvidenceItem = {
        id,
        type: "html",
        timestamp: Date.now(),
        data: html,
        metadata: { selector: selector ?? "full_page" },
      };

      this.evidence.push(item);
      return id;
    } catch (err) {
      const id = this.generateId("html");
      this.evidence.push({
        id,
        type: "html",
        timestamp: Date.now(),
        data: "",
        metadata: { error: String(err) },
      });
      return id;
    }
  }

  /**
   * Add custom state evidence
   */
  addStateEvidence(key: string, state: Record<string, unknown>): string {
    const id = this.generateId("state");

    const item: EvidenceItem = {
      id,
      type: "state",
      timestamp: Date.now(),
      data: { [key]: state },
      metadata: { key },
    };

    this.evidence.push(item);
    return id;
  }

  /**
   * Start trace session
   */
  async startTrace(id: string): Promise<void> {
    await this.browser.startTrace(id);
    this.traceSession = {
      id,
      startTime: Date.now(),
      actions: [],
      screenshots: [],
      consoleLogs: [],
      networkLogs: [],
      errors: [],
    };
  }

  /**
   * Stop trace session
   */
  async stopTrace(): Promise<TraceSession | null> {
    if (!this.traceSession) {
      return null;
    }

    const session = await this.browser.stopTrace();
    this.traceSession = null;
    return session;
  }

  /**
   * Get all collected evidence
   */
  getEvidence(): EvidenceItem[] {
    return [...this.evidence];
  }

  /**
   * Get evidence by type
   */
  getEvidenceByType(type: EvidenceType): EvidenceItem[] {
    return this.evidence.filter((e) => e.type === type);
  }

  /**
   * Clear all evidence
   */
  clear(): void {
    this.evidence = [];
    this.screenshotCounter = 0;
    this.traceSession = null;
  }

  /**
   * Export evidence as JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      timestamp: Date.now(),
      count: this.evidence.length,
      evidence: this.evidence,
    };
  }
}
