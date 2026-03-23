/**
 * QA Provider Index
 *
 * Export all QA-related types and providers.
 */

export * from "./types.js";
export { CLIQAProvider, createCLIIProvider } from "./cli.js";

import type { QAProvider, QAProviderType } from "./types.js";
import { CLIQAProvider } from "./cli.js";

/**
 * Create a QA provider by type
 * @param type - Provider type (cli, script, or builtin)
 * @returns QA provider instance
 */
export function createQAProvider(type: QAProviderType): QAProvider {
  switch (type) {
    case "cli":
      return new CLIQAProvider();
    case "script":
      // Script provider uses same implementation as CLI for now
      return new CLIQAProvider();
    case "builtin":
      // Builtin provider uses same implementation as CLI for now
      return new CLIQAProvider();
    default:
      throw new Error(`Unknown QA provider type: ${type}`);
  }
}
