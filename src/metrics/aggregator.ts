/**
 * Metrics Aggregator
 *
 * Provides aggregation helpers for metrics data including
 * percentile calculations (p95, p99), averages, and summaries.
 */

import type { HistogramMetric } from "./collector.js";

/**
 * Sort numbers in ascending order
 */
function sortNumbers(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

/**
 * Calculate percentile from sorted values
 *
 * @param sortedValues - Sorted array of numbers (ascending)
 * @param p - Percentile (0-100), e.g., 95 for p95
 * @returns The percentile value
 */
export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  if (sortedValues.length === 1) {
    return sortedValues[0];
  }

  const index = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - fraction) + sortedValues[upper] * fraction;
}

/**
 * Calculate p50 (median) from histogram
 */
export function p50(histogram: HistogramMetric): number {
  const sorted = sortNumbers(histogram.values);
  return percentile(sorted, 50);
}

/**
 * Calculate p75 from histogram
 */
export function p75(histogram: HistogramMetric): number {
  const sorted = sortNumbers(histogram.values);
  return percentile(sorted, 75);
}

/**
 * Calculate p90 from histogram
 */
export function p90(histogram: HistogramMetric): number {
  const sorted = sortNumbers(histogram.values);
  return percentile(sorted, 90);
}

/**
 * Calculate p95 from histogram
 */
export function p95(histogram: HistogramMetric): number {
  const sorted = sortNumbers(histogram.values);
  return percentile(sorted, 95);
}

/**
 * Calculate p99 from histogram
 */
export function p99(histogram: HistogramMetric): number {
  const sorted = sortNumbers(histogram.values);
  return percentile(sorted, 99);
}

/**
 * Calculate average from histogram
 */
export function avg(histogram: HistogramMetric): number {
  if (histogram.count === 0) {
    return 0;
  }
  return histogram.sum / histogram.count;
}

/**
 * Calculate min from histogram
 */
export function min(histogram: HistogramMetric): number {
  if (histogram.values.length === 0) {
    return 0;
  }
  return Math.min(...histogram.values);
}

/**
 * Calculate max from histogram
 */
export function max(histogram: HistogramMetric): number {
  if (histogram.values.length === 0) {
    return 0;
  }
  return Math.max(...histogram.values);
}

/**
 * Full latency summary for a histogram
 */
export interface LatencySummary {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

/**
 * Get full latency summary from histogram
 */
export function latencySummary(histogram: HistogramMetric): LatencySummary {
  return {
    count: histogram.count,
    sum: histogram.sum,
    avg: avg(histogram),
    min: min(histogram),
    max: max(histogram),
    p50: p50(histogram),
    p75: p75(histogram),
    p90: p90(histogram),
    p95: p95(histogram),
    p99: p99(histogram),
  };
}

/**
 * Aggregate multiple histograms into one
 */
export function aggregateHistograms(histograms: HistogramMetric[]): HistogramMetric {
  const allValues: number[] = [];
  let totalSum = 0;
  let totalCount = 0;

  for (const h of histograms) {
    allValues.push(...h.values);
    totalSum += h.sum;
    totalCount += h.count;
  }

  return {
    type: "histogram",
    values: allValues,
    count: totalCount,
    sum: totalSum,
    timestamp: Date.now(),
  };
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format bytes in human-readable form
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}
