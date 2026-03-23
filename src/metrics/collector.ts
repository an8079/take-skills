/**
 * Metrics Collector
 *
 * Centralized metrics collection for the Claude Studio pipeline.
 * Tracks stage durations, gate pass/fail rates, artifact counts,
 * phase transitions, and agent execution times.
 */

export type MetricType = "counter" | "gauge" | "histogram";

export interface MetricValue {
  type: MetricType;
  value: number;
  timestamp: number;
}

export interface CounterMetric {
  type: "counter";
  value: number;
  timestamp: number;
}

export interface GaugeMetric {
  type: "gauge";
  value: number;
  timestamp: number;
}

export interface HistogramMetric {
  type: "histogram";
  values: number[];
  count: number;
  sum: number;
  timestamp: number;
}

export interface CollectedMetrics {
  counters: Record<string, CounterMetric>;
  gauges: Record<string, GaugeMetric>;
  histograms: Record<string, HistogramMetric>;
}

/**
 * MetricsCollector - Central metrics collection class
 *
 * Usage:
 *   const collector = MetricsCollector.getInstance();
 *   collector.increment("stage.completed");
 *   collector.timing("stage.duration", 1234);
 *   collector.gauge("queue.size", 5);
 *   const metrics = collector.getMetrics();
 */
export class MetricsCollector {
  private static instance: MetricsCollector;

  private counters: Map<string, CounterMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();
  private timingStack: Map<string, number> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Reset all metrics (for testing or fresh start)
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timingStack.clear();
  }

  /**
   * Increment a counter metric
   *
   * @param metric - Metric name (e.g., "stage.completed", "gate.pass")
   * @param delta - Amount to increment (default: 1)
   */
  increment(metric: string, delta: number = 1): void {
    const existing = this.counters.get(metric);
    if (existing) {
      existing.value += delta;
      existing.timestamp = Date.now();
    } else {
      this.counters.set(metric, {
        type: "counter",
        value: delta,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Decrement a counter metric
   *
   * @param metric - Metric name
   * @param delta - Amount to decrement (default: 1)
   */
  decrement(metric: string, delta: number = 1): void {
    this.increment(metric, -delta);
  }

  /**
   * Set a gauge metric to a specific value
   *
   * @param metric - Metric name (e.g., "queue.size", "active.agents")
   * @param value - Current value
   */
  gauge(metric: string, value: number): void {
    this.gauges.set(metric, {
      type: "gauge",
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a timing / histogram value
   *
   * @param metric - Metric name (e.g., "stage.duration", "agent.execution.time")
   * @param duration - Duration in milliseconds
   */
  timing(metric: string, duration: number): void {
    const existing = this.histograms.get(metric);
    if (existing) {
      existing.values.push(duration);
      existing.count += 1;
      existing.sum += duration;
      existing.timestamp = Date.now();
    } else {
      this.histograms.set(metric, {
        type: "histogram",
        values: [duration],
        count: 1,
        sum: duration,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Start timing a metric (call timingEnd to finish)
   *
   * @param metric - Metric name
   * @returns Timestamp to pass to timingEnd
   */
  timingStart(metric: string): number {
    const start = Date.now();
    this.timingStack.set(metric, start);
    return start;
  }

  /**
   * End timing and record the duration
   *
   * @param metric - Metric name
   * @returns Duration in milliseconds
   */
  timingEnd(metric: string): number | null {
    const start = this.timingStack.get(metric);
    if (start === undefined) {
      return null;
    }
    const duration = Date.now() - start;
    this.timing(metric, duration);
    this.timingStack.delete(metric);
    return duration;
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): CollectedMetrics {
    const counters: Record<string, CounterMetric> = {};
    const gauges: Record<string, GaugeMetric> = {};
    const histograms: Record<string, HistogramMetric> = {};

    this.counters.forEach((v, k) => {
      counters[k] = v;
    });
    this.gauges.forEach((v, k) => {
      gauges[k] = v;
    });
    this.histograms.forEach((v, k) => {
      histograms[k] = { ...v };
    });

    return { counters, gauges, histograms };
  }

  /**
   * Get a specific counter value
   */
  getCounter(metric: string): number {
    return this.counters.get(metric)?.value ?? 0;
  }

  /**
   * Get a specific gauge value
   */
  getGauge(metric: string): number {
    return this.gauges.get(metric)?.value ?? 0;
  }

  /**
   * Get histogram summary (count, sum, avg)
   */
  getHistogramSummary(metric: string): { count: number; sum: number; avg: number } | null {
    const h = this.histograms.get(metric);
    if (!h || h.count === 0) {
      return null;
    }
    return {
      count: h.count,
      sum: h.sum,
      avg: h.sum / h.count,
    };
  }

  /**
   * Record a stage completion with all related metrics
   */
  recordStageCompletion(
    stageId: string,
    duration: number,
    status: "completed" | "failed" | "skipped"
  ): void {
    // Increment stage attempt counter
    this.increment(`stage.attempted.${stageId}`);

    // Record duration
    this.timing(`stage.duration.${stageId}`, duration);

    // Increment completion counter
    this.increment(`stage.${status}.${stageId}`);
    this.increment(`stage.${status}`);
  }

  /**
   * Record a gate check result
   */
  recordGateCheck(stageId: string, gateId: string, passed: boolean): void {
    this.increment("gate.check");
    this.increment(passed ? "gate.pass" : "gate.fail");
    this.increment(`gate.${passed ? "pass" : "fail"}.${stageId}.${gateId}`);
  }

  /**
   * Record artifact count
   */
  recordArtifactCount(artifactType: string, count: number): void {
    this.gauge(`artifact.count.${artifactType}`, count);
    this.increment(`artifact.created.${artifactType}`, count);
  }

  /**
   * Record phase transition
   */
  recordPhaseTransition(fromPhase: string, toPhase: string): void {
    this.increment("phase.transition");
    this.increment(`phase.transition.${fromPhase}_to_${toPhase}`);
  }

  /**
   * Record agent execution
   */
  recordAgentExecution(agentId: string, duration: number, status: "completed" | "failed"): void {
    this.timing(`agent.duration.${agentId}`, duration);
    this.increment(`agent.${status}.${agentId}`);
    this.increment(`agent.${status}`);
  }
}

/**
 * Convenience singleton export
 */
export const metricsCollector = MetricsCollector.getInstance();
