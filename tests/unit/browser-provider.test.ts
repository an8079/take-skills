import { describe, expect, it } from "vitest";
import { PlaywrightProvider, createPlaywrightProvider } from "../../src/providers/browser/playwright.js";

class FakeLocator {
  constructor(private readonly page: FakePage, private readonly selector: string) {}

  async click(): Promise<void> {
    this.page.actions.push(`click:${this.selector}`);
  }

  async dblclick(): Promise<void> {
    this.page.actions.push(`dblclick:${this.selector}`);
  }

  async hover(): Promise<void> {
    this.page.actions.push(`hover:${this.selector}`);
  }

  async fill(value: string): Promise<void> {
    this.page.fields.set(this.selector, value);
  }

  async press(key: string): Promise<void> {
    this.page.actions.push(`press:${this.selector}:${key}`);
  }

  async type(text: string): Promise<void> {
    this.page.fields.set(this.selector, `${this.page.fields.get(this.selector) ?? ""}${text}`);
  }

  async selectOption(values: string | string[] | Array<{ value?: string; label?: string }>): Promise<string[]> {
    const normalized = Array.isArray(values)
      ? values.map((value) => (typeof value === "string" ? value : value.value ?? value.label ?? ""))
      : [values];
    this.page.selects.set(this.selector, normalized);
    return normalized;
  }

  async setChecked(checked: boolean): Promise<void> {
    this.page.checked.set(this.selector, checked);
  }

  async setInputFiles(files: string | string[]): Promise<void> {
    this.page.uploads.set(this.selector, Array.isArray(files) ? files : [files]);
  }

  async textContent(): Promise<string | null> {
    return this.page.text.get(this.selector) ?? null;
  }

  async getAttribute(name: string): Promise<string | null> {
    return this.page.attributes.get(`${this.selector}:${name}`) ?? null;
  }

  async isVisible(): Promise<boolean> {
    return this.page.visible.get(this.selector) ?? false;
  }

  async waitFor(): Promise<void> {}

  async screenshot(): Promise<Buffer> {
    return Buffer.from(`locator:${this.selector}`);
  }
}

class FakePage {
  urlValue = "about:blank";
  titleValue = "Blank";
  html = "<html><body>blank</body></html>";
  bodyText = "blank";
  actions: string[] = [];
  fields = new Map<string, string>();
  selects = new Map<string, string[]>();
  checked = new Map<string, boolean>();
  uploads = new Map<string, string[]>();
  text = new Map<string, string>();
  attributes = new Map<string, string>();
  visible = new Map<string, boolean>();
  viewport: { width: number; height: number } | null = null;
  listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  async goto(url: string): Promise<void> {
    this.urlValue = url;
    this.titleValue = `Title for ${url}`;
  }

  async goBack(): Promise<void> {
    this.actions.push("goBack");
  }

  async goForward(): Promise<void> {
    this.actions.push("goForward");
  }

  async reload(): Promise<void> {
    this.actions.push("reload");
  }

  async title(): Promise<string> {
    return this.titleValue;
  }

  url(): string {
    return this.urlValue;
  }

  async content(): Promise<string> {
    return this.html;
  }

  locator(selector: string): FakeLocator {
    return new FakeLocator(this, selector);
  }

  async waitForSelector(): Promise<void> {}
  async waitForLoadState(): Promise<void> {}
  async waitForFunction(): Promise<void> {}
  async waitForURL(): Promise<void> {}

  async screenshot(): Promise<Buffer> {
    return Buffer.from("page-screenshot");
  }

  async evaluate<R = unknown, A = unknown>(
    pageFunction: string | ((arg: A) => R | Promise<R>),
    arg?: A
  ): Promise<R> {
    if (typeof pageFunction === "string") {
      return (0, eval)(pageFunction) as R;
    }

    const previousDocument = (globalThis as Record<string, unknown>).document;
    (globalThis as Record<string, unknown>).document = {
      body: {
        innerText: this.bodyText,
        textContent: this.bodyText,
      },
      querySelector: (selector: string) => ({
        outerHTML: this.html,
        textContent: this.text.get(selector) ?? this.bodyText,
      }),
    };

    try {
      return await pageFunction(arg as A);
    } finally {
      if (previousDocument === undefined) {
        delete (globalThis as Record<string, unknown>).document;
      } else {
        (globalThis as Record<string, unknown>).document = previousDocument;
      }
    }
  }

  async setViewportSize(viewport: { width: number; height: number }): Promise<void> {
    this.viewport = viewport;
  }

  async close(): Promise<void> {}

  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, payload: unknown): void {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(payload);
    }
  }
}

class FakeContext {
  page = new FakePage();
  cookiesStore: Array<Record<string, unknown>> = [];
  tracing = {
    start: async () => undefined,
    stop: async () => undefined,
  };

  async newPage(): Promise<FakePage> {
    return this.page;
  }

  async close(): Promise<void> {}

  async cookies(): Promise<Array<Record<string, unknown>>> {
    return this.cookiesStore;
  }

  async addCookies(cookies: Array<Record<string, unknown>>): Promise<void> {
    this.cookiesStore = [...cookies];
  }

  async clearCookies(): Promise<void> {
    this.cookiesStore = [];
  }

  async addInitScript(): Promise<void> {}
}

class FakeBrowser {
  context = new FakeContext();

  async newContext(): Promise<FakeContext> {
    return this.context;
  }

  async close(): Promise<void> {}
}

function createFakeLoader(browser = new FakeBrowser()) {
  return async () => ({
    chromium: {
      launch: async () => browser,
    },
  });
}

describe("PlaywrightProvider", () => {
  it("executes core browser actions through the Playwright adapter", async () => {
    const fakeBrowser = new FakeBrowser();
    const provider = new PlaywrightProvider(createFakeLoader(fakeBrowser) as any);

    await provider.launch({ headless: true });
    await provider.newPage({ width: 1440, height: 900 });
    await provider.navigate({ url: "https://example.com", waitUntil: "load" });

    fakeBrowser.context.page.text.set("#headline", "Hello world");
    fakeBrowser.context.page.attributes.set("#headline:data-id", "hero");
    fakeBrowser.context.page.visible.set("#headline", true);

    await provider.fill("#name", "Ada");
    await provider.typeText("#name", " Lovelace");
    await provider.select("#role", "admin");
    await provider.setChecked("#terms", true);

    const screenshot = await provider.screenshot();
    const evalResult = await provider.evaluate<string>("'ok'");
    const text = await provider.getText({ selector: "#headline" });
    const html = await provider.getHtml("#headline");

    await provider.setCookies([{ name: "session", value: "abc", domain: "example.com" }]);
    const cookies = await provider.getCookies();
    await provider.deleteCookies(["session"], "example.com");

    expect(await provider.getTitle()).toBe("Title for https://example.com");
    expect(await provider.getUrl()).toBe("https://example.com");
    expect(text).toBe("Hello world");
    expect(html).toContain("<html>");
    expect(await provider.getAttribute("#headline", "data-id")).toBe("hero");
    expect(await provider.isVisible("#headline")).toBe(true);
    expect(screenshot).toBe(Buffer.from("page-screenshot").toString("base64"));
    expect(evalResult.success).toBe(true);
    expect(evalResult.value).toBe("ok");
    expect(cookies).toHaveLength(1);
    expect(fakeBrowser.context.cookiesStore).toHaveLength(0);
    expect(fakeBrowser.context.page.fields.get("#name")).toBe("Ada Lovelace");
    expect(fakeBrowser.context.page.selects.get("#role")).toEqual(["admin"]);
    expect(fakeBrowser.context.page.checked.get("#terms")).toBe(true);
  });

  it("captures console, network, and trace evidence", async () => {
    const fakeBrowser = new FakeBrowser();
    const provider = new PlaywrightProvider(createFakeLoader(fakeBrowser) as any);

    await provider.launch();
    await provider.newPage();
    await provider.enableConsoleCapture();
    await provider.enableNetworkCapture();
    await provider.startTrace("trace-1");
    await provider.recordAction("navigate", "https://example.com");

    fakeBrowser.context.page.emit("console", {
      type: () => "warning",
      text: () => "hello",
      location: () => ({ url: "https://example.com/app.js", lineNumber: 12, columnNumber: 3 }),
    });
    fakeBrowser.context.page.emit("request", {
      url: () => "https://example.com/api",
      method: () => "GET",
      headers: () => ({ accept: "application/json" }),
    });
    fakeBrowser.context.page.emit("response", {
      url: () => "https://example.com/api",
      status: () => 200,
      headers: () => ({ "content-type": "application/json" }),
      request: () => ({
        url: () => "https://example.com/api",
        method: () => "GET",
        headers: () => ({ accept: "application/json" }),
      }),
      text: async () => '{"ok":true}',
    });

    await Promise.resolve();
    const trace = await provider.stopTrace();

    expect(provider.getConsoleMessages()).toHaveLength(1);
    expect(provider.getConsoleMessages()[0].type).toBe("warn");
    expect(provider.getNetworkLogs()).toHaveLength(1);
    expect(provider.getNetworkLogs()[0].status).toBe(200);
    expect(trace.id).toBe("trace-1");
    expect(trace.actions.some((action) => action.action === "navigate")).toBe(true);
    expect(trace.consoleLogs).toHaveLength(1);
    expect(trace.networkLogs).toHaveLength(1);
  });

  it("provides the exported factory", () => {
    const provider = createPlaywrightProvider();
    expect(provider.type).toBe("playwright");
  });
});
