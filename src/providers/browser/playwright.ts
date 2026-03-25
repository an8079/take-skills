/**
 * Playwright Browser Provider
 *
 * Real browser automation adapter with lazy Playwright loading.
 * The package is resolved at runtime so the rest of the project can still
 * build in environments where Playwright has not been installed yet.
 */

import { Buffer } from "node:buffer";
import type {
  BrowserProvider,
  BrowserLaunchOptions,
  Viewport,
  NavigationOptions,
  ScreenshotOptions,
  BrowserConsoleMessage,
  NetworkCapture,
  EvaluationResult,
  InteractionOptions,
  TraceSession,
  ActionTrace,
  CookieConfig,
  FileUploadConfig,
  UploadResult,
  TextExtractionOptions,
} from "./types.js";

type PlaywrightLoader = () => Promise<PlaywrightModule>;

interface PlaywrightModule {
  chromium: {
    launch(options?: Record<string, unknown>): Promise<PlaywrightBrowser>;
  };
}

interface PlaywrightBrowser {
  newContext(options?: Record<string, unknown>): Promise<PlaywrightContext>;
  close(): Promise<void>;
}

interface PlaywrightContext {
  newPage(): Promise<PlaywrightPage>;
  close(): Promise<void>;
  cookies(urls?: string[]): Promise<Array<Record<string, unknown>>>;
  addCookies(cookies: Array<Record<string, unknown>>): Promise<void>;
  clearCookies?(): Promise<void>;
  addInitScript(script: string | { content: string }): Promise<void>;
  tracing?: {
    start(options?: Record<string, unknown>): Promise<void>;
    stop(options?: Record<string, unknown>): Promise<void>;
  };
}

interface PlaywrightLocator {
  click(options?: Record<string, unknown>): Promise<void>;
  dblclick(options?: Record<string, unknown>): Promise<void>;
  hover(): Promise<void>;
  fill(value: string): Promise<void>;
  press(key: string): Promise<void>;
  type(text: string, options?: Record<string, unknown>): Promise<void>;
  selectOption(values: string | string[] | Array<{ value?: string; label?: string }>): Promise<string[]>;
  setChecked(checked: boolean): Promise<void>;
  setInputFiles(files: string | string[]): Promise<void>;
  textContent(): Promise<string | null>;
  getAttribute(name: string): Promise<string | null>;
  isVisible(): Promise<boolean>;
  waitFor(options?: Record<string, unknown>): Promise<void>;
  screenshot(options?: Record<string, unknown>): Promise<Uint8Array | Buffer | string>;
}

interface PlaywrightConsoleMessage {
  type(): string;
  text(): string;
  location(): {
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

interface PlaywrightRequest {
  url(): string;
  method(): string;
  headers(): Record<string, string>;
}

interface PlaywrightResponse {
  url(): string;
  status(): number;
  headers(): Record<string, string>;
  request(): PlaywrightRequest;
  text?(): Promise<string>;
}

interface PlaywrightPage {
  goto(url: string, options?: Record<string, unknown>): Promise<void>;
  goBack(options?: Record<string, unknown>): Promise<void>;
  goForward(options?: Record<string, unknown>): Promise<void>;
  reload(options?: Record<string, unknown>): Promise<void>;
  title(): Promise<string>;
  url(): string;
  content(): Promise<string>;
  locator(selector: string): PlaywrightLocator;
  waitForSelector(selector: string, options?: Record<string, unknown>): Promise<void>;
  waitForLoadState(
    state?: "load" | "domcontentloaded" | "networkidle" | "commit",
    options?: Record<string, unknown>
  ): Promise<void>;
  waitForFunction(
    pageFunction: string | ((arg?: unknown) => unknown),
    arg?: unknown,
    options?: Record<string, unknown>
  ): Promise<void>;
  waitForURL(url: string | RegExp, options?: Record<string, unknown>): Promise<void>;
  screenshot(options?: Record<string, unknown>): Promise<Uint8Array | Buffer | string>;
  evaluate<R = unknown, A = unknown>(
    pageFunction: string | ((arg: A) => R | Promise<R>),
    arg?: A
  ): Promise<R>;
  setViewportSize?(viewport: Viewport): Promise<void>;
  close(): Promise<void>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
}

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 720 };
const MAX_CAPTURED_LOGS = 500;

async function defaultPlaywrightLoader(): Promise<PlaywrightModule> {
  try {
    return (await import("playwright")) as unknown as PlaywrightModule;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line preserve-caught-error
    throw new Error(
      `Playwright package is not installed or could not be loaded: ${message}. Run: npm install playwright`
    );
  }
}

export class PlaywrightProvider implements BrowserProvider {
  readonly type = "playwright" as const;
  readonly version = "1.1.0";

  private browser: PlaywrightBrowser | null = null;
  private context: PlaywrightContext | null = null;
  private page: PlaywrightPage | null = null;
  private readonly loader: PlaywrightLoader;

  private traceSession: TraceSession | null = null;
  private consoleLogs: BrowserConsoleMessage[] = [];
  private networkLogs: NetworkCapture[] = [];
  private consoleCaptureEnabled = false;
  private networkCaptureEnabled = false;
  private requestTimings = new Map<string, number>();

  private readonly consoleListener = (message: unknown) => {
    if (!this.consoleCaptureEnabled) {
      return;
    }

    const consoleMessage = message as PlaywrightConsoleMessage;
    const location = consoleMessage.location();
    this.pushConsoleLog({
      type: this.normalizeConsoleType(consoleMessage.type()),
      text: consoleMessage.text(),
      location: {
        url: location.url ?? "",
        lineNumber: location.lineNumber ?? 0,
        columnNumber: location.columnNumber ?? 0,
      },
      timestamp: Date.now(),
    });
  };

  private readonly requestListener = (request: unknown) => {
    if (!this.networkCaptureEnabled) {
      return;
    }

    const typedRequest = request as PlaywrightRequest;
    this.requestTimings.set(
      `${typedRequest.method()} ${typedRequest.url()}`,
      Date.now()
    );
  };

  private readonly responseListener = async (response: unknown) => {
    if (!this.networkCaptureEnabled) {
      return;
    }

    const typedResponse = response as PlaywrightResponse;
    const request = typedResponse.request();
    const key = `${request.method()} ${request.url()}`;
    const startedAt = this.requestTimings.get(key);
    if (startedAt) {
      this.requestTimings.delete(key);
    }

    let body: string | undefined;
    try {
      if (typedResponse.text) {
        body = await typedResponse.text();
      }
    } catch {
      body = undefined;
    }

    this.pushNetworkLog({
      url: typedResponse.url(),
      method: request.method(),
      requestHeaders: request.headers(),
      responseHeaders: typedResponse.headers(),
      status: typedResponse.status(),
      body,
      timing: startedAt ? Date.now() - startedAt : undefined,
    });
  };

  constructor(loader: PlaywrightLoader = defaultPlaywrightLoader) {
    this.loader = loader;
  }

  private normalizeConsoleType(type: string): BrowserConsoleMessage["type"] {
    switch (type) {
      case "warning":
        return "warn";
      case "log":
      case "warn":
      case "error":
      case "debug":
      case "info":
        return type;
      default:
        return "log";
    }
  }

  private requireContext(): PlaywrightContext {
    if (!this.context) {
      throw new Error("Browser context not initialized. Call launch() first.");
    }
    return this.context;
  }

  private requirePage(): PlaywrightPage {
    if (!this.page) {
      throw new Error("No page available. Call newPage() or navigate() first.");
    }
    return this.page;
  }

  private getLocator(selector: string): PlaywrightLocator {
    return this.requirePage().locator(selector);
  }

  private attachPageListeners(page: PlaywrightPage): void {
    if (!page.on) {
      return;
    }
    page.on("console", this.consoleListener);
    page.on("request", this.requestListener);
    page.on("response", this.responseListener);
  }

  private detachPageListeners(page: PlaywrightPage): void {
    if (!page.off) {
      return;
    }
    page.off("console", this.consoleListener);
    page.off("request", this.requestListener);
    page.off("response", this.responseListener);
  }

  private toBase64(data: Uint8Array | Buffer | string): string {
    if (typeof data === "string") {
      return Buffer.from(data).toString("base64");
    }
    return Buffer.from(data).toString("base64");
  }

  private pushConsoleLog(entry: BrowserConsoleMessage): void {
    this.consoleLogs.push(entry);
    if (this.consoleLogs.length > MAX_CAPTURED_LOGS) {
      this.consoleLogs.shift();
    }
  }

  private pushNetworkLog(entry: NetworkCapture): void {
    this.networkLogs.push(entry);
    if (this.networkLogs.length > MAX_CAPTURED_LOGS) {
      this.networkLogs.shift();
    }
  }

  private ensureTraceSession(id = `trace-${Date.now()}`): TraceSession {
    if (!this.traceSession) {
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
    return this.traceSession;
  }

  private recordTraceAction(action: string, target?: string, error?: unknown): void {
    if (!this.traceSession) {
      return;
    }

    const trace: ActionTrace = {
      timestamp: Date.now(),
      action,
      target,
      success: !error,
      error: error ? (error instanceof Error ? error.message : String(error)) : undefined,
    };
    this.traceSession.actions.push(trace);
    if (error) {
      this.traceSession.errors.push(trace.error ?? String(error));
    }
  }

  private async withTrace<T>(
    action: string,
    target: string | undefined,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await operation();
      this.recordTraceAction(action, target);
      return result;
    } catch (error) {
      this.recordTraceAction(action, target, error);
      throw error;
    }
  }

  async launch(options?: BrowserLaunchOptions): Promise<void> {
    if (this.browser || this.context || this.page) {
      await this.close();
    }

    const playwright = await this.loader();
    this.browser = await playwright.chromium.launch({
      headless: options?.headless ?? true,
      args: options?.args,
      timeout: options?.timeout,
    });

    this.context = await this.browser.newContext({
      viewport: options?.viewport ?? DEFAULT_VIEWPORT,
    });

    this.consoleLogs = [];
    this.networkLogs = [];
    this.requestTimings.clear();
    this.page = null;
  }

  async close(): Promise<void> {
    if (this.page) {
      this.detachPageListeners(this.page);
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }

    this.browser = null;
    this.context = null;
    this.page = null;
    this.traceSession = null;
  }

  async newPage(viewport?: Viewport): Promise<void> {
    const context = this.requireContext();
    if (this.page) {
      this.detachPageListeners(this.page);
      await this.page.close();
    }

    this.page = await context.newPage();
    this.attachPageListeners(this.page);
    if (viewport && this.page.setViewportSize) {
      await this.page.setViewportSize(viewport);
    }
  }

  async closePage(): Promise<void> {
    if (!this.page) {
      return;
    }
    this.detachPageListeners(this.page);
    await this.page.close();
    this.page = null;
  }

  async navigate(options: NavigationOptions): Promise<void> {
    if (!this.page) {
      await this.newPage();
    }

    await this.withTrace("navigate", options.url, async () => {
      await this.requirePage().goto(options.url, {
        timeout: options.timeout,
        waitUntil: options.waitUntil,
      });
    });
  }

  async goBack(): Promise<void> {
    await this.withTrace("goBack", undefined, async () => {
      await this.requirePage().goBack();
    });
  }

  async goForward(): Promise<void> {
    await this.withTrace("goForward", undefined, async () => {
      await this.requirePage().goForward();
    });
  }

  async reload(): Promise<void> {
    await this.withTrace("reload", undefined, async () => {
      await this.requirePage().reload();
    });
  }

  async getTitle(): Promise<string> {
    return this.requirePage().title();
  }

  async getUrl(): Promise<string> {
    return this.requirePage().url();
  }

  async getText(options?: TextExtractionOptions): Promise<string> {
    const page = this.requirePage();
    const selector = options?.selector;

    if (selector) {
      const text = await page.locator(selector).textContent();
      return text ?? "";
    }

    return page.evaluate(({ includeHidden }) => {
      const body = document.body;
      return includeHidden ? (body.textContent ?? "") : (body.innerText ?? "");
    }, { includeHidden: options?.includeHidden ?? false });
  }

  async getHtml(selector?: string): Promise<string> {
    const page = this.requirePage();
    if (!selector) {
      return page.content();
    }

    return page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return element?.outerHTML ?? "";
    }, selector);
  }

  async click(selector: string, options?: InteractionOptions): Promise<void> {
    await this.withTrace("click", selector, async () => {
      await this.getLocator(selector).click({
        delay: options?.delay,
        button: options?.button,
        clickCount: options?.clickCount,
        force: options?.force,
      });
    });
  }

  async dblClick(selector: string, options?: InteractionOptions): Promise<void> {
    await this.withTrace("dblClick", selector, async () => {
      await this.getLocator(selector).dblclick({
        delay: options?.delay,
        button: options?.button,
        force: options?.force,
      });
    });
  }

  async rightClick(selector: string, options?: InteractionOptions): Promise<void> {
    await this.withTrace("rightClick", selector, async () => {
      await this.getLocator(selector).click({
        button: "right",
        delay: options?.delay,
        clickCount: options?.clickCount,
        force: options?.force,
      });
    });
  }

  async hover(selector: string): Promise<void> {
    await this.withTrace("hover", selector, async () => {
      await this.getLocator(selector).hover();
    });
  }

  async fill(selector: string, value: string): Promise<void> {
    await this.withTrace("fill", selector, async () => {
      await this.getLocator(selector).fill(value);
    });
  }

  async press(key: string, modifiers?: ("Control" | "Alt" | "Shift" | "Meta")[]): Promise<void> {
    await this.withTrace("press", key, async () => {
      const prefix = modifiers && modifiers.length > 0 ? `${modifiers.join("+")}+` : "";
      await this.requirePage().locator("body").press(`${prefix}${key}`);
    });
  }

  async typeText(selector: string, text: string, delay?: number): Promise<void> {
    await this.withTrace("typeText", selector, async () => {
      await this.getLocator(selector).type(text, { delay });
    });
  }

  async select(selector: string, value: string, label?: string): Promise<string[]> {
    return this.withTrace("select", selector, async () => {
      return this.getLocator(selector).selectOption(label ? [{ value, label }] : value);
    });
  }

  async setChecked(selector: string, checked: boolean): Promise<void> {
    await this.withTrace("setChecked", selector, async () => {
      await this.getLocator(selector).setChecked(checked);
    });
  }

  async uploadFiles(config: FileUploadConfig): Promise<UploadResult> {
    try {
      await this.withTrace("uploadFiles", config.selector, async () => {
        await this.getLocator(config.selector).setInputFiles(config.filePaths);
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getCookies(urls?: string[]): Promise<CookieConfig[]> {
    const cookies = await this.requireContext().cookies(urls);
    return cookies.map((cookie) => ({
      name: String(cookie.name ?? ""),
      value: String(cookie.value ?? ""),
      domain: typeof cookie.domain === "string" ? cookie.domain : undefined,
      path: typeof cookie.path === "string" ? cookie.path : undefined,
      expires: typeof cookie.expires === "number" ? cookie.expires : undefined,
      httpOnly: Boolean(cookie.httpOnly),
      secure: Boolean(cookie.secure),
      sameSite: cookie.sameSite as CookieConfig["sameSite"],
    }));
  }

  async setCookies(cookies: CookieConfig[]): Promise<void> {
    await this.requireContext().addCookies(cookies.map((cookie) => ({ ...cookie })));
  }

  async deleteCookies(names: string[], domain?: string): Promise<void> {
    const context = this.requireContext();
    const currentCookies = await context.cookies();
    const keepers = currentCookies.filter((cookie) => {
      const matchesName = names.includes(String(cookie.name ?? ""));
      const matchesDomain = domain ? cookie.domain === domain : true;
      return !(matchesName && matchesDomain);
    });

    if (context.clearCookies) {
      await context.clearCookies();
      if (keepers.length > 0) {
        await context.addCookies(keepers);
      }
      return;
    }

    throw new Error("Current Playwright context does not support cookie deletion");
  }

  async screenshot(options?: ScreenshotOptions): Promise<string> {
    const data = await this.withTrace("screenshot", options?.path, async () => {
      return this.requirePage().screenshot({
        fullPage: options?.fullPage,
        path: options?.path,
        type: options?.type,
        quality: options?.quality,
      });
    });

    const base64 = this.toBase64(data);
    if (this.traceSession) {
      this.traceSession.screenshots.push(base64);
    }
    return base64;
  }

  async evaluate<T = unknown>(expression: string): Promise<EvaluationResult<T>> {
    try {
      const value = await this.requirePage().evaluate((source) => {
        return (0, eval)(source);
      }, expression);
      this.recordTraceAction("evaluate", expression);
      return { success: true, value };
    } catch (error) {
      this.recordTraceAction("evaluate", expression, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async addInitScript(script: string): Promise<void> {
    await this.requireContext().addInitScript({ content: script });
  }

  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.withTrace("waitForSelector", selector, async () => {
      await this.requirePage().waitForSelector(selector, { timeout });
    });
  }

  async waitForNavigation(options?: NavigationOptions): Promise<void> {
    await this.withTrace("waitForNavigation", options?.url, async () => {
      await this.requirePage().waitForLoadState(options?.waitUntil, {
        timeout: options?.timeout,
      });
    });
  }

  async waitForFunction(fn: string, timeout?: number, polling?: number): Promise<void> {
    await this.withTrace("waitForFunction", fn, async () => {
      await this.requirePage().waitForFunction(
        (source) => Boolean((0, eval)(source as string)),
        fn,
        {
          timeout,
          polling,
        }
      );
    });
  }

  async waitForUrl(pattern: string | RegExp): Promise<void> {
    await this.withTrace("waitForUrl", String(pattern), async () => {
      await this.requirePage().waitForURL(pattern);
    });
  }

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

    const context = this.context;
    if (context?.tracing?.start) {
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
      });
    }
  }

  async stopTrace(): Promise<TraceSession> {
    const session = this.ensureTraceSession();
    session.endTime = Date.now();
    session.consoleLogs = this.getConsoleMessages();
    session.networkLogs = this.getNetworkLogs();

    const context = this.context;
    if (context?.tracing?.stop) {
      await context.tracing.stop();
    }

    this.traceSession = null;
    return session;
  }

  async recordAction(action: string, target?: string): Promise<void> {
    this.ensureTraceSession();
    this.recordTraceAction(action, target);
  }

  async enableConsoleCapture(): Promise<void> {
    this.consoleCaptureEnabled = true;
  }

  async disableConsoleCapture(): Promise<void> {
    this.consoleCaptureEnabled = false;
  }

  getConsoleMessages(): BrowserConsoleMessage[] {
    return this.consoleLogs.map((entry) => ({ ...entry, location: { ...entry.location } }));
  }

  async enableNetworkCapture(): Promise<void> {
    this.networkCaptureEnabled = true;
  }

  async disableNetworkCapture(): Promise<void> {
    this.networkCaptureEnabled = false;
  }

  getNetworkLogs(): NetworkCapture[] {
    return this.networkLogs.map((entry) => ({
      ...entry,
      requestHeaders: { ...entry.requestHeaders },
      responseHeaders: { ...entry.responseHeaders },
    }));
  }

  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return this.getLocator(selector).getAttribute(attribute);
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.getLocator(selector).isVisible();
  }

  async interceptNetwork(_urlPattern: string): Promise<void> {
    await this.enableNetworkCapture();
  }
}

export function createPlaywrightProvider(): BrowserProvider {
  return new PlaywrightProvider();
}
