/**
 * CLI Deploy/Canary Provider
 *
 * Local CLI/script-based deployment provider implementation.
 * Executes shell commands and scripts for deployment and canary release.
 */

import { spawn } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import http from "http";
import https from "https";
import type {
  CanaryReleaseProvider,
  DeployProviderType,
  DeploymentArtifact,
  DeploymentResult,
  DeploymentStatus,
  CanaryPolicy,
  CanaryProgress,
  HealthCheckResult,
  RollbackResult,
} from "./types.js";

/**
 * Default canary policy
 */
const DEFAULT_CANARY_POLICY: CanaryPolicy = {
  initialTrafficPercent: 10,
  incrementPercent: 10,
  incrementIntervalMs: 300000, // 5 minutes
  maxTrafficPercent: 100,
  healthCheckSuccessThreshold: 3,
  errorRateThreshold: 5, // 5%
  latencyThresholdMs: 1000,
  autoRollback: true,
  trafficSplitStrategy: "percentage",
};

/**
 * CLI Deploy provider implementation
 */
export class CLIDeployProvider implements CanaryReleaseProvider {
  readonly type: DeployProviderType = "cli";
  readonly version = "1.0.0";

  private initialized = false;
  private tempDir: string;
  private deployments: Map<string, DeploymentArtifact> = new Map();
  private canaryProgress: Map<string, CanaryProgress> = new Map();
  private verificationResults: Map<string, {
    passed: boolean;
    checkedAt: number;
    healthChecks: HealthCheckResult[];
    commands: Array<{ command: string; exitCode: number; stdout: string; stderr: string }>;
    reasons: string[];
  }> = new Map();

  private readonly ALLOWED_DEPLOY_COMMANDS = [
    "npm run deploy",
    "npm run build",
    "npm run ship",
    "npm run release",
    "npm run package",
    "yarn deploy",
    "yarn build",
    "yarn ship",
    "pnpm deploy",
    "pnpm build",
  ];

  private isCommandAllowed(cmd: string): boolean {
    const trimmed = cmd.trim();
    // Allow npm/yarn/pnpm scripts - must match ENTIRE string (^...$), not just prefix
    const safePattern = /^(npm run|yarn|pnpm) [\w:-]+$/;
    if (safePattern.test(trimmed)) return true;
    // Allow exact matches in allowlist
    return this.ALLOWED_DEPLOY_COMMANDS.includes(trimmed);
  }

  constructor() {
    this.tempDir = join(process.cwd(), ".deploy-temp");
  }

  /**
   * Initialize the CLI provider
   */
  async initialize(config?: Record<string, unknown>): Promise<void> {
    if (config?.tempDir) {
      this.tempDir = config.tempDir as string;
    }

    if (!existsSync(this.tempDir)) {
      await mkdir(this.tempDir, { recursive: true });
    }

    this.initialized = true;
  }

  /**
   * Cleanup temporary resources
   */
  async cleanup(): Promise<void> {
    this.initialized = false;
    this.deployments.clear();
    this.canaryProgress.clear();
    this.verificationResults.clear();
  }

  /**
   * Deploy an artifact to target environment
   */
  async deploy(artifact: DeploymentArtifact): Promise<DeploymentResult> {
    const startTime = Date.now();

    if (!this.initialized) {
      await this.initialize();
    }

    const deployment: DeploymentArtifact = {
      ...artifact,
      status: "in_progress",
      startedAt: Date.now(),
    };

    this.deployments.set(deployment.id, deployment);

    try {
      // Simulate deployment by checking if deploy command exists
      const result = await this.executeDeployCommand(deployment);

      deployment.status = result.success ? "completed" : "failed";
      deployment.completedAt = Date.now();
      this.deployments.set(deployment.id, deployment);

      return {
        success: result.success,
        deploymentId: deployment.id,
        status: deployment.status,
        message: result.message,
        artifacts: deployment.artifacts,
        durationMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      deployment.status = "failed";
      deployment.completedAt = Date.now();
      this.deployments.set(deployment.id, deployment);

      return {
        success: false,
        deploymentId: deployment.id,
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
        artifacts: deployment.artifacts,
        durationMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute deployment command
   */
  private async executeDeployCommand(
    deployment: DeploymentArtifact
  ): Promise<{ success: boolean; message: string }> {
    const deployCmd = (deployment.metadata?.deployCommand as string) || "npm run deploy";

    if (!this.isCommandAllowed(deployCmd)) {
      return {
        success: false,
        message: `Deploy command not allowed: ${deployCmd}. Use: npm run deploy, npm run build, npm run ship, etc.`,
      };
    }

    const result = await this.execCommand(deployCmd, 300000);
    return {
      success: result.exitCode === 0,
      message: result.exitCode === 0 ? result.stdout || "success" : result.stderr || `exit code ${result.exitCode}`,
    };
  }

  /**
   * Rollback a deployment to a previous version
   */
  async rollback(deploymentId: string, targetVersion?: string): Promise<RollbackResult> {
    const startTime = Date.now();
    const deployment = this.deployments.get(deploymentId);

    if (!deployment) {
      return {
        success: false,
        error: `Deployment ${deploymentId} not found`,
        artifactsRestored: [],
        durationMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }

    // Get rollback command from metadata or use default
    const rollbackCmd = (deployment.metadata?.rollbackCommand as string) ||
      `git checkout ${targetVersion || deployment.version}`;
    const result = await this.execCommand(rollbackCmd, 60000);

    deployment.status = "rolled_back";
    deployment.completedAt = Date.now();
    this.deployments.set(deploymentId, deployment);

    return {
      success: result.exitCode === 0,
      rolledBackToVersion: targetVersion || deployment.version,
      artifactsRestored: deployment.artifacts,
      durationMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Get current deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentArtifact | null> {
    return this.deployments.get(deploymentId) || null;
  }

  /**
   * Start a canary release with given policy
   */
  async startCanaryRelease(
    artifact: DeploymentArtifact,
    policy: CanaryPolicy
  ): Promise<DeploymentResult> {
    const startTime = Date.now();

    if (!this.initialized) {
      await this.initialize();
    }

    const mergedPolicy = { ...DEFAULT_CANARY_POLICY, ...policy };

    const deployment: DeploymentArtifact = {
      ...artifact,
      status: "canary_active",
      canaryPolicy: mergedPolicy,
      canaryTrafficPercent: mergedPolicy.initialTrafficPercent,
      startedAt: Date.now(),
    };

    this.deployments.set(deployment.id, deployment);

    const progress: CanaryProgress = {
      deploymentId: deployment.id,
      currentTrafficPercent: mergedPolicy.initialTrafficPercent,
      targetTrafficPercent: mergedPolicy.maxTrafficPercent,
      isStable: true,
      healthChecks: [],
      errorRate: 0,
      avgLatencyMs: 0,
      canarySteps: [
        {
          trafficPercent: mergedPolicy.initialTrafficPercent,
          timestamp: Date.now(),
          success: true,
        },
      ],
    };

    this.canaryProgress.set(deployment.id, progress);

    return {
      success: true,
      deploymentId: deployment.id,
      status: "canary_active",
      message: `Canary release started with ${mergedPolicy.initialTrafficPercent}% traffic`,
      artifacts: deployment.artifacts,
      canaryProgress: progress,
      durationMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Promote canary to full deployment
   */
  async promoteCanary(deploymentId: string): Promise<DeploymentResult> {
    const startTime = Date.now();
    const deployment = this.deployments.get(deploymentId);

    if (!deployment) {
      return {
        success: false,
        deploymentId,
        status: "failed",
        message: `Deployment ${deploymentId} not found`,
        artifacts: [],
        durationMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }

    deployment.status = "completed";
    deployment.canaryTrafficPercent = 100;
    deployment.completedAt = Date.now();
    this.deployments.set(deploymentId, deployment);

    // Clear canary progress
    this.canaryProgress.delete(deploymentId);

    return {
      success: true,
      deploymentId,
      status: "completed",
      message: "Canary promoted to full deployment",
      artifacts: deployment.artifacts,
      durationMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Abort canary release and rollback
   */
  async abortCanaryRelease(deploymentId: string): Promise<RollbackResult> {
    return this.rollback(deploymentId);
  }

  /**
   * Get canary release progress
   */
  async getCanaryProgress(deploymentId: string): Promise<CanaryProgress | null> {
    return this.canaryProgress.get(deploymentId) || null;
  }

  /**
   * Increment canary traffic percentage
   */
  async incrementCanaryTraffic(
    deploymentId: string,
    incrementPercent: number
  ): Promise<CanaryProgress> {
    const progress = this.canaryProgress.get(deploymentId);
    const deployment = this.deployments.get(deploymentId);

    if (!progress || !deployment) {
      throw new Error(`Canary deployment ${deploymentId} not found`);
    }

    const newTraffic = Math.min(
      progress.currentTrafficPercent + incrementPercent,
      deployment.canaryPolicy?.maxTrafficPercent || 100
    );

    progress.currentTrafficPercent = newTraffic;
    progress.canarySteps.push({
      trafficPercent: newTraffic,
      timestamp: Date.now(),
      success: true,
    });

    this.canaryProgress.set(deploymentId, progress);
    deployment.canaryTrafficPercent = newTraffic;
    this.deployments.set(deploymentId, deployment);

    return progress;
  }

  /**
   * Run health check on deployed artifact
   */
  async runHealthCheck(deploymentId: string, endpoint: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const isHttps = endpoint.startsWith("https://");
      const client = isHttps ? https : http;
      const url = new URL(endpoint);
      const timeout = setTimeout(() => {
        resolve({
          passed: false,
          endpoint,
          responseTimeMs: Date.now() - startTime,
          statusCode: 0,
          error: "Request timeout",
          timestamp: Date.now(),
        });
      }, 10000);

      const req = client.get(endpoint, { hostname: url.hostname, path: url.pathname, method: "GET" }, (res) => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        const passed = res.statusCode === 200 && responseTime < 1000;
        resolve({
          passed,
          endpoint,
          responseTimeMs: responseTime,
          statusCode: res.statusCode || 0,
          error: passed ? undefined : `HTTP ${res.statusCode} or latency ${responseTime}ms exceeded threshold`,
          timestamp: Date.now(),
        });
      });

      req.on("error", (err) => {
        clearTimeout(timeout);
        resolve({
          passed: false,
          endpoint,
          responseTimeMs: Date.now() - startTime,
          statusCode: 0,
          error: err.message,
          timestamp: Date.now(),
        });
      });

      req.end();
    });
  }

  /**
   * Run multiple health checks
   */
  async runHealthChecks(
    deploymentId: string,
    endpoints: string[]
  ): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    for (const endpoint of endpoints) {
      const result = await this.runHealthCheck(deploymentId, endpoint);
      results.push(result);
    }

    const progress = this.canaryProgress.get(deploymentId);
    if (progress) {
      progress.healthChecks = [...progress.healthChecks, ...results];
      const responseTimes = progress.healthChecks.map((result) => result.responseTimeMs);
      progress.avgLatencyMs = responseTimes.length > 0
        ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
        : 0;

      const errorRates = progress.healthChecks
        .map((result) => result.metrics?.errorRate)
        .filter((value): value is number => typeof value === "number");
      progress.errorRate = errorRates.length > 0
        ? errorRates.reduce((sum, value) => sum + value, 0) / errorRates.length
        : 0;

      progress.isStable = results.every((result) => result.passed) &&
        (progress.errorRate === 0 || progress.errorRate <= (this.deployments.get(deploymentId)?.canaryPolicy?.errorRateThreshold ?? Number.POSITIVE_INFINITY)) &&
        progress.avgLatencyMs <= (this.deployments.get(deploymentId)?.canaryPolicy?.latencyThresholdMs ?? Number.POSITIVE_INFINITY);

      this.canaryProgress.set(deploymentId, progress);
    }

    return results;
  }

  private getHealthCheckEndpoints(deployment: DeploymentArtifact): string[] {
    const configured = deployment.metadata?.healthCheckEndpoints;
    const endpoints = Array.isArray(configured)
      ? configured.filter((endpoint): endpoint is string => typeof endpoint === "string" && endpoint.length > 0)
      : typeof configured === "string" && configured.length > 0
        ? [configured]
        : [];

    if (deployment.canaryPolicy?.healthCheckEndpoint) {
      endpoints.push(deployment.canaryPolicy.healthCheckEndpoint);
    }

    return Array.from(new Set(endpoints));
  }

  private getVerificationCommands(deployment: DeploymentArtifact): string[] {
    const configured = deployment.metadata?.verificationCommands ?? deployment.metadata?.verificationCommand;
    if (Array.isArray(configured)) {
      return configured.filter((command): command is string => typeof command === "string" && command.trim().length > 0);
    }
    if (typeof configured === "string" && configured.trim().length > 0) {
      return [configured];
    }
    return [];
  }

  /**
   * Verify deployment completed successfully
   */
  async verifyDeployment(deploymentId: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      return false;
    }

    const healthChecks: HealthCheckResult[] = [];
    const commands: Array<{ command: string; exitCode: number; stdout: string; stderr: string }> = [];
    const reasons: string[] = [];

    if (!["completed", "canary_active", "rolled_back"].includes(deployment.status)) {
      reasons.push(`Deployment status ${deployment.status} is not verifiable`);
    }

    const endpoints = this.getHealthCheckEndpoints(deployment);
    if (endpoints.length > 0) {
      const results = await this.runHealthChecks(deploymentId, endpoints);
      healthChecks.push(...results);

      for (const result of results) {
        if (!result.passed) {
          reasons.push(`Health check failed for ${result.endpoint}: ${result.error ?? `HTTP ${result.statusCode}`}`);
        }
      }
    }

    for (const command of this.getVerificationCommands(deployment)) {
      if (!this.isCommandAllowed(command)) {
        reasons.push(`Verification command not allowed: ${command}`);
        continue;
      }

      const result = await this.execCommand(command, 300000);
      commands.push({ command, ...result });
      if (result.exitCode !== 0) {
        reasons.push(`Verification command failed: ${command}`);
      }
    }

    const progress = this.canaryProgress.get(deploymentId);
    if (deployment.status === "canary_active" && progress && deployment.canaryPolicy) {
      if (progress.errorRate > deployment.canaryPolicy.errorRateThreshold) {
        reasons.push(
          `Canary error rate ${progress.errorRate}% exceeded threshold ${deployment.canaryPolicy.errorRateThreshold}%`
        );
      }
      if (progress.avgLatencyMs > deployment.canaryPolicy.latencyThresholdMs) {
        reasons.push(
          `Canary latency ${progress.avgLatencyMs}ms exceeded threshold ${deployment.canaryPolicy.latencyThresholdMs}ms`
        );
      }
      if (!progress.isStable) {
        reasons.push("Canary progress is not stable");
      }
    }

    const passed = reasons.length === 0;
    this.verificationResults.set(deploymentId, {
      passed,
      checkedAt: Date.now(),
      healthChecks,
      commands,
      reasons,
    });

    return passed;
  }

  /**
   * Generate release evidence for audit
   */
  async generateReleaseEvidence(deploymentId: string): Promise<Record<string, unknown>> {
    const deployment = this.deployments.get(deploymentId);
    const progress = this.canaryProgress.get(deploymentId);

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    return {
      deploymentId,
      version: deployment.version,
      environment: deployment.environment,
      status: deployment.status,
      startedAt: new Date(deployment.startedAt).toISOString(),
      completedAt: deployment.completedAt
        ? new Date(deployment.completedAt).toISOString()
        : null,
      artifacts: deployment.artifacts,
      canaryPolicy: deployment.canaryPolicy,
      canaryProgress: progress
        ? {
            currentTrafficPercent: progress.currentTrafficPercent,
            targetTrafficPercent: progress.targetTrafficPercent,
            isStable: progress.isStable,
            errorRate: progress.errorRate,
            avgLatencyMs: progress.avgLatencyMs,
            steps: progress.canarySteps.length,
          }
        : null,
      rollbackFromId: deployment.rollbackFromId,
      metadata: deployment.metadata,
      verification: this.verificationResults.get(deploymentId) ?? null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute a shell command and return output
   */
  private execCommand(
    command: string,
    timeout: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === "win32";
      const shell = isWindows ? "cmd.exe" : "/bin/sh";
      const shellArgs = isWindows ? ["/c", command] : ["-c", command];

      const child = spawn(shell, shellArgs, {
        timeout,
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? 0,
        });
      });

      child.on("error", (err) => {
        reject(new Error(`Command failed to start: ${err.message}`));
      });
    });
  }
}

/**
 * Create CLI deploy provider instance
 */
export function createCLIDeployProvider(): CanaryReleaseProvider {
  return new CLIDeployProvider();
}
