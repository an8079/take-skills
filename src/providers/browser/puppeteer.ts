/**
 * Puppeteer Browser Provider
 * Stub - requires 'puppeteer' package
 */

import type {
  BrowserProvider,
  BrowserLaunchOptions,
  Viewport,
  NavigationOptions,
  ScreenshotOptions,
  EvaluationResult,
  FileUploadConfig,
  UploadResult,
  CookieConfig,
  TraceSession,
  TextExtractionOptions,
  InteractionOptions,
  NetworkCapture,
  BrowserConsoleMessage,
  ActionTrace,
} from "./types.js";

export class PuppeteerProvider implements BrowserProvider {
  readonly type = "puppeteer" as const;
  readonly version = "1.0.0";
  private _page: unknown = null;
  private traceSession: TraceSession | null = null;

  async launch(_options?: BrowserLaunchOptions): Promise<void> {
    throw new Error("Puppeteer not installed - stub implementation");
  }

  async close(): Promise<void> {
    this._page = null;
    this.traceSession = null;
  }

  async newPage(_viewport?: Viewport): Promise<void> {
    if (!this._page) throw new Error("Browser not launched");
  }

  async closePage(): Promise<void> {
    this._page = null;
  }

  async navigate(_options: NavigationOptions): Promise<void> {
    if (!this._page) throw new Error("No page");
  }

  async goBack(): Promise<void> {
    if (!this._page) throw new Error("No page");
  }

  async goForward(): Promise<void> {
    if (!this._page) throw new Error("No page");
  }

  async reload(): Promise<void> {
    if (!this._page) throw new Error("No page");
  }

  async getTitle(): Promise<string> {
    return "";
  }

  async getUrl(): Promise<string> {
    return "";
  }

  async getText(_options?: TextExtractionOptions): Promise<string> {
    return "";
  }

  async getHtml(_selector?: string): Promise<string> {
    return "";
  }

  async screenshot(_options?: ScreenshotOptions): Promise<string> {
    return "";
  }

  async click(_selector: string, _options?: InteractionOptions): Promise<void> {}

  async dblClick(_selector: string, _options?: InteractionOptions): Promise<void> {}

  async rightClick(_selector: string, _options?: InteractionOptions): Promise<void> {}

  async hover(_selector: string): Promise<void> {}

  async fill(_selector: string, _value: string): Promise<void> {}

  async press(_key: string, _modifiers?: ("Control" | "Alt" | "Shift" | "Meta")[]): Promise<void> {}

  async typeText(_selector: string, _text: string, _delay?: number): Promise<void> {}

  async select(_selector: string, _value: string, _label?: string): Promise<string[]> {
    return [];
  }

  async setChecked(_selector: string, _checked: boolean): Promise<void> {}

  async uploadFiles(_config: FileUploadConfig): Promise<UploadResult> {
    return { success: false };
  }

  async getCookies(_urls?: string[]): Promise<CookieConfig[]> {
    return [];
  }

  async setCookies(_cookies: CookieConfig[]): Promise<void> {}

  async deleteCookies(_names: string[], _domain?: string): Promise<void> {}

  async evaluate<T = unknown>(_expression: string): Promise<EvaluationResult<T>> {
    return { success: false, value: undefined, error: "Puppeteer not installed" };
  }

  async addInitScript(_script: string): Promise<void> {}

  async waitForSelector(_selector: string, _timeout?: number): Promise<void> {}

  async waitForNavigation(_options?: NavigationOptions): Promise<void> {}

  async waitForFunction(_fn: string, _timeout?: number, _polling?: number): Promise<void> {}

  async waitForUrl(_pattern: string | RegExp): Promise<void> {}

  async startTrace(id: string): Promise<void> {
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

  async stopTrace(): Promise<TraceSession> {
    const session = this.traceSession || {
      id: "unknown",
      startTime: 0,
      actions: [],
      screenshots: [],
      consoleLogs: [],
      networkLogs: [],
      errors: [],
    };
    this.traceSession = null;
    return session;
  }

  async recordAction(_action: string, _target?: string): Promise<void> {}

  async enableConsoleCapture(): Promise<void> {}

  async disableConsoleCapture(): Promise<void> {}

  getConsoleMessages(): BrowserConsoleMessage[] {
    return [];
  }

  async enableNetworkCapture(): Promise<void> {}

  async disableNetworkCapture(): Promise<void> {}

  getNetworkLogs(): NetworkCapture[] {
    return [];
  }

  async getAttribute(_selector: string, _attribute: string): Promise<string | null> {
    return null;
  }

  async isVisible(_selector: string): Promise<boolean> {
    return false;
  }

  async interceptNetwork(_urlPattern: string): Promise<void> {}
}

export function createPuppeteerProvider(): BrowserProvider {
  return new PuppeteerProvider();
}
