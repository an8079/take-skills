/**
 * Browser Provider Index
 *
 * Export all browser-related types and providers.
 */

export * from "./types.js";
export { PlaywrightProvider, createPlaywrightProvider } from "./playwright.js";
export { PuppeteerProvider, createPuppeteerProvider } from "./puppeteer.js";

import type { BrowserProvider, BrowserProviderType } from "./types.js";
import { PlaywrightProvider } from "./playwright.js";
import { PuppeteerProvider } from "./puppeteer.js";

/**
 * Create a browser provider by type
 * @param type - Provider type (playwright or puppeteer)
 * @returns Browser provider instance
 */
export function createBrowserProvider(type: BrowserProviderType): BrowserProvider {
  switch (type) {
    case "playwright":
      return new PlaywrightProvider();
    case "puppeteer":
      return new PuppeteerProvider();
    default:
      throw new Error(`Unknown browser provider type: ${type}`);
  }
}
