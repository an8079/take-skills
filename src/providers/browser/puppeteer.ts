/**
 * Puppeteer Browser Provider
 * Stub - requires 'puppeteer' package
 */

import type { BrowserProvider, BrowserLaunchOptions, Viewport, NavigationOptions, ScreenshotOptions, EvaluationResult, FileUploadConfig, UploadResult, CookieConfig, TraceSession } from "./types.js";

export class PuppeteerProvider implements BrowserProvider {
  readonly type = "puppeteer" as const;
  readonly version = "1.0.0";
  private _page: unknown = null;

  async launch(_options?: BrowserLaunchOptions): Promise<void> { throw new Error("Puppeteer not installed"); }
  async close(): Promise<void> { this._page = null; }
  async newPage(_viewport?: Viewport): Promise<void> { if (!this._page) throw new Error("Browser not launched"); }
  async closePage(): Promise<void> { this._page = null; }
  async navigate(_options: NavigationOptions): Promise<void> { if (!this._page) throw new Error("No page"); }
  async screenshot(_options?: ScreenshotOptions): Promise<string> { return ""; }
  async evaluate<T = unknown>(_expr: string): Promise<EvaluationResult<T>> { return { result: null, value: null }; }
  async click(_sel: string): Promise<void> {}
  async hover(_sel: string): Promise<void> {}
  async fill(_sel: string, _val: string): Promise<void> {}
  async press(_key: string, _mods?: string[]): Promise<void> {}
  async typeText(_sel: string, _text: string, _delay?: number): Promise<void> {}
  async select(_sel: string, _val: string, _label?: string): Promise<string[]> { return []; }
  async setChecked(_sel: string, _checked: boolean): Promise<void> {}
  async uploadFiles(_cfg: FileUploadConfig): Promise<UploadResult> { return { success: false, path: "" }; }
  async getText(_sel?: string): Promise<string> { return ""; }
  async getAttribute(_sel: string, _attr: string): Promise<string | null> { return null; }
  async isVisible(_sel: string): Promise<boolean> { return false; }
  async waitForSelector(_sel: string, _timeout?: number): Promise<void> {}
  async interceptNetwork(_pattern: string): Promise<void> {}
  async startTracing(): Promise<void> { this.traceSession = { startedAt: Date.now(), actions: [], screenshots: [] }; }
  async stopTracing(): Promise<TraceSession> { const s = this.traceSession || { startedAt: 0, actions: [], screenshots: [] }; this.traceSession = null; return s; }
  async setCookies(_cookies: CookieConfig[]): Promise<void> {}
  async getCookies(): Promise<CookieConfig[]> { return []; }
  private traceSession: TraceSession | null = null;
}
