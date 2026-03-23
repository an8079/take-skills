/**
 * Metrics Module
 *
 * Centralized metrics collection and aggregation for Claude Studio.
 */

export {
  MetricsCollector,
  metricsCollector,
  type CounterMetric,
  type GaugeMetric,
  type HistogramMetric,
  type CollectedMetrics,
  type MetricType,
} from "./collector.js";

export {
  percentile,
  p50,
  p75,
  p90,
  p95,
  p99,
  avg,
  min,
  max,
  latencySummary,
  aggregateHistograms,
  formatDuration,
  formatBytes,
  type LatencySummary,
} from "./aggregator.js";
