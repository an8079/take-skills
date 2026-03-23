/**
 * Metrics Command - Display Pipeline Metrics
 *
 * Shows collected metrics from the MetricsCollector in various formats.
 */

import chalk from "chalk";
import { metricsCollector, latencySummary, formatDuration } from "../metrics/index.js";
import type { CollectedMetrics } from "../metrics/collector.js";

/**
 * Get all collected metrics
 */
export function getMetrics(): CollectedMetrics {
  return metricsCollector.getMetrics();
}

/**
 * Print metrics as a formatted table to console
 */
export function printMetricsTable(): void {
  const metrics = metricsCollector.getMetrics();

  console.log("\n" + "=".repeat(70));
  console.log("  CLAUDE STUDIO METRICS");
  console.log("=".repeat(70) + "\n");

  // Counters
  console.log(chalk.bold("Counters:"));
  if (Object.keys(metrics.counters).length === 0) {
    console.log("  (no counters recorded)");
  } else {
    for (const [name, metric] of Object.entries(metrics.counters)) {
      console.log(`  ${chalk.cyan(name)}: ${metric.value}`);
    }
  }

  // Gauges
  console.log(chalk.bold("\nGauges:"));
  if (Object.keys(metrics.gauges).length === 0) {
    console.log("  (no gauges recorded)");
  } else {
    for (const [name, metric] of Object.entries(metrics.gauges)) {
      console.log(`  ${chalk.cyan(name)}: ${metric.value}`);
    }
  }

  // Histograms
  console.log(chalk.bold("\nHistograms:"));
  if (Object.keys(metrics.histograms).length === 0) {
    console.log("  (no histograms recorded)");
  } else {
    for (const [name, metric] of Object.entries(metrics.histograms)) {
      if (metric.count === 0) {
        console.log(`  ${chalk.cyan(name)}: no data`);
        continue;
      }
      const summary = latencySummary(metric);
      console.log(`  ${chalk.cyan(name)}:`);
      console.log(`    count: ${summary.count}, sum: ${formatDuration(summary.sum)}, avg: ${formatDuration(summary.avg)}`);
      console.log(`    min: ${formatDuration(summary.min)}, max: ${formatDuration(summary.max)}`);
      console.log(`    p50: ${formatDuration(summary.p50)}, p75: ${formatDuration(summary.p75)}`);
      console.log(`    p90: ${formatDuration(summary.p90)}, p95: ${formatDuration(summary.p95)}, p99: ${formatDuration(summary.p99)}`);
    }
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

/**
 * Print metrics as JSON (for external tools)
 */
export function printMetricsJson(): void {
  const metrics = metricsCollector.getMetrics();
  console.log(JSON.stringify(metrics, null, 2));
}

/**
 * Reset all metrics
 */
export function resetMetrics(): void {
  metricsCollector.reset();
  console.log(chalk.green("Metrics reset successfully."));
}

/**
 * Run the metrics command with subcommand
 */
export function runMetrics(subcommand: string): void {
  switch (subcommand) {
    case "show":
      printMetricsTable();
      break;
    case "json":
      printMetricsJson();
      break;
    case "reset":
      resetMetrics();
      break;
    default:
      // Default to table view
      printMetricsTable();
  }
}
