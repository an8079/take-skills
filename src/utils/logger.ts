/**
 * Logger Utility
 *
 * Provides structured logging for Claude Studio with configurable log levels.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_NAMES = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

let currentLogLevel = LogLevel.INFO;

export interface LogOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

/**
 * Set the global log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Get the current log level
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Format a log message
 */
function formatMessage(
  level: LogLevel,
  message: string,
  options: LogOptions
): string {
  const parts: string[] = [];

  if (options.timestamp !== false) {
    const now = new Date();
    const ts = now.toISOString().slice(11, 23);
    parts.push(`[${ts}]`);
  }

  parts.push(`[${LOG_LEVEL_NAMES[level]}]`);

  if (options.prefix) {
    parts.push(`[${options.prefix}]`);
  }

  parts.push(message);

  return parts.join(" ");
}

/**
 * Log a debug message
 */
export function debug(message: string, options?: LogOptions): void {
  if (currentLogLevel > LogLevel.DEBUG) return;
  console.debug(formatMessage(LogLevel.DEBUG, message, options ?? {}));
}

/**
 * Log an info message
 */
export function info(message: string, options?: LogOptions): void {
  if (currentLogLevel > LogLevel.INFO) return;
  console.info(formatMessage(LogLevel.INFO, message, options ?? {}));
}

/**
 * Log a warning message
 */
export function warn(message: string, options?: LogOptions): void {
  if (currentLogLevel > LogLevel.WARN) return;
  console.warn(formatMessage(LogLevel.WARN, message, options ?? {}));
}

/**
 * Log an error message
 */
export function error(message: string, options?: LogOptions): void {
  if (currentLogLevel > LogLevel.ERROR) return;
  console.error(formatMessage(LogLevel.ERROR, message, options ?? {}));
}

/**
 * Create a logger instance with a prefix
 */
export function createLogger(prefix: string): {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
} {
  return {
    debug: (message: string) => debug(message, { prefix }),
    info: (message: string) => info(message, { prefix }),
    warn: (message: string) => warn(message, { prefix }),
    error: (message: string) => error(message, { prefix }),
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger("claude-studio");
