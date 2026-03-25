/**
 * Browser Provider Types
 *
 * Abstract interface for browser automation providers.
 * Supports Playwright and Puppeteer implementations.
 */

/**
 * Supported browser providers
 */
export type BrowserProviderType = "playwright" | "puppeteer";

/**
 * Browser launch options
 */
export interface BrowserLaunchOptions {
  headless?: boolean;
  args?: string[];
  timeout?: number;
  userDataDir?: string;
  viewport?: Viewport;
}

/**
 * Viewport configuration
 */
export interface Viewport {
  width: number;
  height: number;
}

/**
 * Navigation options
 */
export interface NavigationOptions {
  timeout?: number;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  url: string;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  fullPage?: boolean;
  path?: string;
  type?: "png" | "jpeg" | "webp";
  quality?: number;
}

/**
 * Console message from browser
 */
export interface BrowserConsoleMessage {
  type: "log" | "warn" | "error" | "debug" | "info";
  text: string;
  location: {
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  timestamp: number;
}

/**
 * Network request/response pair
 */
export interface NetworkCapture {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  status: number;
  body?: string;
  timing?: number;
}

/**
 * Page evaluation result
 */
export interface EvaluationResult<T = unknown> {
  success: boolean;
  value?: T;
  error?: string;
}

/**
 * Element selection options
 */
export interface ElementSelector {
  selector: string;
  timeout?: number;
  visible?: boolean;
}

/**
 * Element interaction options
 */
export interface InteractionOptions {
  delay?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
  force?: boolean;
}

/**
 * Trace data for a single action
 */
export interface ActionTrace {
  timestamp: number;
  action: string;
  target?: string;
  duration?: number;
  success: boolean;
  error?: string;
}

/**
 * Complete trace session
 */
export interface TraceSession {
  id: string;
  startTime: number;
  endTime?: number;
  actions: ActionTrace[];
  screenshots: string[];
  consoleLogs: BrowserConsoleMessage[];
  networkLogs: NetworkCapture[];
  errors: string[];
}

/**
 * Cookie configuration
 */
export interface CookieConfig {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  selector: string;
  filePaths: string[];
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  error?: string;
}

/**
 * Text content extraction options
 */
export interface TextExtractionOptions {
  selector?: string;
  includeHidden?: boolean;
  stripTags?: boolean;
}

/**
 * Browser provider interface - abstract interface for browser automation
 * Implement this interface to add support for different browser automation tools
 */
export interface BrowserProvider {
  /** Provider identifier */
  readonly type: BrowserProviderType;
  readonly version: string;

  // Lifecycle
  /**
   * Launch browser instance
   * @param options - Launch configuration
   */
  launch(options?: BrowserLaunchOptions): Promise<void>;

  /**
   * Close browser instance
   */
  close(): Promise<void>;

  // Page management
  /**
   * Create new page/context
   * @param viewport - Optional viewport configuration
   */
  newPage(viewport?: Viewport): Promise<void>;

  /**
   * Close current page/context
   */
  closePage(): Promise<void>;

  // Navigation
  /**
   * Navigate to URL
   * @param options - Navigation options including URL
   */
  navigate(options: NavigationOptions): Promise<void>;

  /**
   * Go back in history
   */
  goBack(): Promise<void>;

  /**
   * Go forward in history
   */
  goForward(): Promise<void>;

  /**
   * Reload current page
   */
  reload(): Promise<void>;

  // Content extraction
  /**
   * Get page title
   */
  getTitle(): Promise<string>;

  /**
   * Get current URL
   */
  getUrl(): Promise<string>;

  /**
   * Extract text content
   * @param options - Extraction options
   */
  getText(options?: TextExtractionOptions): Promise<string>;

  /**
   * Get HTML content
   * @param selector - Optional element selector
   */
  getHtml(selector?: string): Promise<string>;

  // Element interaction
  /**
   * Click element
   * @param selector - Element selector
   * @param options - Interaction options
   */
  click(selector: string, options?: InteractionOptions): Promise<void>;

  /**
   * Double click element
   * @param selector - Element selector
   * @param options - Interaction options
   */
  dblClick(selector: string, options?: InteractionOptions): Promise<void>;

  /**
   * Right click element
   * @param selector - Element selector
   * @param options - Interaction options
   */
  rightClick(selector: string, options?: InteractionOptions): Promise<void>;

  /**
   * Hover over element
   * @param selector - Element selector
   */
  hover(selector: string): Promise<void>;

  /**
   * Fill input field
   * @param selector - Element selector
   * @param value - Value to fill
   */
  fill(selector: string, value: string): Promise<void>;

  /**
   * Press keyboard key
   * @param key - Key to press
   * @param modifiers - Optional modifier keys
   */
  press(key: string, modifiers?: ("Control" | "Alt" | "Shift" | "Meta")[]): Promise<void>;

  /**
   * Type text character by character
   * @param selector - Element selector
   * @param text - Text to type
   * @param delay - Delay between keystrokes
   */
  typeText(selector: string, text: string, delay?: number): Promise<void>;

  /**
   * Select option in dropdown
   * @param selector - Element selector
   * @param value - Value to select
   * @param label - Optional label
   */
  select(selector: string, value: string, label?: string): Promise<string[]>;

  /**
   * Check/uncheck checkbox or radio
   * @param selector - Element selector
   * @param checked - Whether to check or uncheck
   */
  setChecked(selector: string, checked: boolean): Promise<void>;

  /**
   * Upload files
   * @param config - File upload configuration
   */
  uploadFiles(config: FileUploadConfig): Promise<UploadResult>;

  // Cookies
  /**
   * Get cookies
   * @param urls - Optional URLs to get cookies for
   */
  getCookies(urls?: string[]): Promise<CookieConfig[]>;

  /**
   * Set cookies
   * @param cookies - Cookies to set
   */
  setCookies(cookies: CookieConfig[]): Promise<void>;

  /**
   * Delete cookies
   * @param names - Cookie names to delete
   * @param domain - Optional domain
   */
  deleteCookies(names: string[], domain?: string): Promise<void>;

  // Screenshot
  /**
   * Take screenshot
   * @param options - Screenshot options
   */
  screenshot(options?: ScreenshotOptions): Promise<string>;

  // Scripts
  /**
   * Evaluate JavaScript expression
   * @param expression - JavaScript expression
   */
  evaluate<T = unknown>(expression: string): Promise<EvaluationResult<T>>;

  /**
   * Add script to run on page load
   * @param script - Script content
   */
  addInitScript(script: string): Promise<void>;

  // Wait utilities
  /**
   * Wait for selector
   * @param selector - Element selector
   * @param timeout - Optional timeout
   */
  waitForSelector(selector: string, timeout?: number): Promise<void>;

  /**
   * Wait for navigation
   * @param options - Navigation options
   */
  waitForNavigation(options?: NavigationOptions): Promise<void>;

  /**
   * Wait for function
   * @param fn - Function to evaluate
   * @param timeout - Optional timeout
   * @param polling - Polling interval
   */
  waitForFunction(
    fn: string,
    timeout?: number,
    polling?: number
  ): Promise<void>;

  /**
   * Wait for URL pattern
   * @param pattern - URL pattern or regex
   */
  waitForUrl(pattern: string | RegExp): Promise<void>;

  // Tracing
  /**
   * Start trace session
   * @param id - Trace session ID
   */
  startTrace(id: string): Promise<void>;

  /**
   * Stop trace session and return data
   */
  stopTrace(): Promise<TraceSession>;

  /**
   * Record action in current trace
   * @param action - Action name
   * @param target - Target element
   */
  recordAction(action: string, target?: string): Promise<void>;

  // Console capture
  /**
   * Enable console message capture
   */
  enableConsoleCapture(): Promise<void>;

  /**
   * Disable console message capture
   */
  disableConsoleCapture(): Promise<void>;

  /**
   * Get captured console messages
   */
  getConsoleMessages(): BrowserConsoleMessage[];

  // Network capture
  /**
   * Enable network request capture
   */
  enableNetworkCapture(): Promise<void>;

  /**
   * Disable network request capture
   */
  disableNetworkCapture(): Promise<void>;

  /**
   * Get captured network requests
   */
  getNetworkLogs(): NetworkCapture[];
}

/**
 * Factory function for creating browser providers
 */
export type BrowserProviderFactory = (
  type: BrowserProviderType
) => BrowserProvider;
