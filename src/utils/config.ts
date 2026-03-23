/**
 * Configuration Utility
 *
 * Handles loading and merging configuration from environment variables
 * and configuration files.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import type { PluginConfig } from "../types/index.js";

/**
 * Default configuration
 */
export function getDefaultConfig(): PluginConfig {
  return {
    agents: {
      omc: { model: "claude-opus-4-6" },
      explore: { model: "claude-haiku-4-5" },
      analyst: { model: "claude-opus-4-6" },
      planner: { model: "claude-opus-4-6" },
      architect: { model: "claude-opus-4-6" },
      debugger: { model: "claude-sonnet-4-6" },
      executor: { model: "claude-sonnet-4-6" },
      verifier: { model: "claude-sonnet-4-6" },
      securityReviewer: { model: "claude-sonnet-4-6" },
      codeReviewer: { model: "claude-opus-4-6" },
      testEngineer: { model: "claude-sonnet-4-6" },
      designer: { model: "claude-sonnet-4-6" },
      writer: { model: "claude-haiku-4-5" },
      qaTester: { model: "claude-sonnet-4-6" },
      scientist: { model: "claude-sonnet-4-6" },
      tracer: { model: "claude-sonnet-4-6" },
      gitMaster: { model: "claude-sonnet-4-6" },
      codeSimplifier: { model: "claude-opus-4-6" },
      critic: { model: "claude-opus-4-6" },
      documentSpecialist: { model: "claude-sonnet-4-6" },
    },
    features: {
      parallelExecution: true,
      lspTools: true,
      astTools: true,
      continuationEnforcement: true,
      autoContextInjection: true,
    },
    permissions: {
      allowBash: true,
      allowEdit: true,
      allowWrite: true,
      maxBackgroundTasks: 5,
    },
    magicKeywords: {
      ultrawork: ["ultrawork", "ulw", "uw"],
      search: ["search", "find", "locate"],
      analyze: ["analyze", "investigate", "examine"],
      ultrathink: ["ultrathink", "think", "reason", "ponder"],
    },
  };
}

export const DEFAULT_CONFIG = getDefaultConfig();

/**
 * Deep merge two objects
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, unknown>;

  for (const key of Object.keys(source) as (keyof T)[]) {
    if (key === "__proto__" || key === "constructor" || key === "prototype")
      continue;

    const sourceValue = source[key];
    const targetValue = result[key as string];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key as string] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      result[key as string] = sourceValue as unknown;
    }
  }

  return result as T;
}

/**
 * Parse JSONC (JSON with Comments)
 */
export function parseJsonc(content: string): unknown {
  // Remove single-line and multi-line comments
  const cleaned = content
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  if (!cleaned) return {};

  return JSON.parse(cleaned);
}

/**
 * Load configuration from a JSONC file
 */
export function loadJsoncFile(path: string): PluginConfig | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, "utf-8");
    const result = parseJsonc(content);
    return result as PluginConfig;
  } catch (error) {
    console.error(`Error loading config from ${path}:`, error);
    return null;
  }
}

/**
 * Get configuration file paths
 */
export function getConfigPaths(): { user: string; project: string } {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const configDir = join(homeDir, ".config");

  return {
    user: join(configDir, "claude-studio", "config.jsonc"),
    project: join(process.cwd(), ".claude", "studio.jsonc"),
  };
}

/**
 * Load configuration from environment variables
 */
export function loadEnvConfig(): Partial<PluginConfig> {
  const config: Partial<PluginConfig> = {};

  // Feature flags
  if (process.env.CLAUDE_STUDIO_PARALLEL_EXECUTION !== undefined) {
    config.features = {
      ...config.features,
      parallelExecution: process.env.CLAUDE_STUDIO_PARALLEL_EXECUTION === "true",
    };
  }

  if (process.env.CLAUDE_STUDIO_LSP_TOOLS !== undefined) {
    config.features = {
      ...config.features,
      lspTools: process.env.CLAUDE_STUDIO_LSP_TOOLS === "true",
    };
  }

  if (process.env.CLAUDE_STUDIO_MAX_BACKGROUND_TASKS) {
    const maxTasks = parseInt(process.env.CLAUDE_STUDIO_MAX_BACKGROUND_TASKS, 10);
    if (!isNaN(maxTasks)) {
      config.permissions = {
        ...config.permissions,
        maxBackgroundTasks: maxTasks,
      };
    }
  }

  return config;
}

/**
 * Load and merge all configuration sources
 */
export function loadConfig(): PluginConfig {
  const paths = getConfigPaths();

  let config = getDefaultConfig();

  // Merge user config
  const userConfig = loadJsoncFile(paths.user);
  if (userConfig) {
    config = deepMerge(config, userConfig);
  }

  // Merge project config
  const projectConfig = loadJsoncFile(paths.project);
  if (projectConfig) {
    config = deepMerge(config, projectConfig);
  }

  // Merge environment variables
  const envConfig = loadEnvConfig();
  config = deepMerge(config, envConfig);

  return config;
}
