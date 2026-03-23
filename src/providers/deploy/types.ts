/**
 * Deploy Provider Types
 *
 * Abstract interface for deployment and canary release providers.
 * Supports staged rollout with traffic splitting and health monitoring.
 */

/**
 * Supported deploy provider types
 */
export type DeployProviderType = "cli" | "script" | "builtin" | "kubernetes" | "docker";

/**
 * Traffic splitting strategy for canary releases
 */
export type TrafficSplitStrategy = "percentage" | "ip-based" | "header-based" | "cookie-based";

/**
 * Deployment status
 */
export type DeploymentStatus = "pending" | "in_progress" | "completed" | "failed" | "rolled_back" | "canary_active";

/**
 * Canary release policy configuration
 */
export interface CanaryPolicy {
  /** Initial percentage of traffic to route to canary */
  initialTrafficPercent: number;
  /** Increment percentage for each step */
  incrementPercent: number;
  /** Interval between traffic increases (ms) */
  incrementIntervalMs: number;
  /** Maximum traffic percentage for canary */
  maxTrafficPercent: number;
  /** Health check endpoint to verify canary stability */
  healthCheckEndpoint?: string;
  /** Number of successful health checks required before proceeding */
  healthCheckSuccessThreshold: number;
  /** Error rate threshold that triggers automatic rollback (%) */
  errorRateThreshold: number;
  /** Latency threshold for automatic rollback (ms) */
  latencyThresholdMs: number;
  /** Whether to enable automatic rollback */
  autoRollback: boolean;
  /** Strategy for traffic splitting */
  trafficSplitStrategy: TrafficSplitStrategy;
}

/**
 * Deployment artifact with rollout status
 */
export interface DeploymentArtifact {
  /** Unique deployment identifier */
  id: string;
  /** Version being deployed */
  version: string;
  /** Target environment */
  environment: string;
  /** Deployment status */
  status: DeploymentStatus;
  /** Canary policy if canary deployment */
  canaryPolicy?: CanaryPolicy;
  /** Current canary traffic percentage (0-100) */
  canaryTrafficPercent?: number;
  /** Timestamp when deployment started */
  startedAt: number;
  /** Timestamp when deployment completed/failed */
  completedAt?: number;
  /** Deployment artifacts (files, images, etc.) */
  artifacts: string[];
  /** Rollback artifact IDs if applicable */
  rollbackFromId?: string;
  /** Deployment metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Health check result for deployment verification
 */
export interface HealthCheckResult {
  /** Whether the health check passed */
  passed: boolean;
  /** Endpoint that was checked */
  endpoint: string;
  /** Response time in ms */
  responseTimeMs: number;
  /** HTTP status code */
  statusCode?: number;
  /** Error message if failed */
  error?: string;
  /** Additional health metrics */
  metrics?: {
    errorRate?: number;
    latencyP50?: number;
    latencyP95?: number;
    latencyP99?: number;
    requestCount?: number;
  };
  /** Timestamp of the check */
  timestamp: number;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  success: boolean;
  rolledBackToVersion?: string;
  artifactsRestored: string[];
  error?: string;
  durationMs: number;
  timestamp: number;
}

/**
 * Canary release progress
 */
export interface CanaryProgress {
  deploymentId: string;
  currentTrafficPercent: number;
  targetTrafficPercent: number;
  isStable: boolean;
  healthChecks: HealthCheckResult[];
  errorRate: number;
  avgLatencyMs: number;
  canarySteps: Array<{
    trafficPercent: number;
    timestamp: number;
    success: boolean;
    healthCheckResult?: HealthCheckResult;
  }>;
}

/**
 * Deployment result for a single deployment operation
 */
export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  status: DeploymentStatus;
  message: string;
  artifacts: string[];
  rollbackFromId?: string;
  canaryProgress?: CanaryProgress;
  durationMs?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Deploy check configuration
 */
export interface DeployCheckConfig {
  name: string;
  command?: string;
  script?: string;
  timeout?: number;
  severity?: "critical" | "major" | "minor";
  tags?: string[];
}

/**
 * Canary release provider interface - abstract interface for deployment automation
 * Implement this interface to add support for different deployment methods
 */
export interface CanaryReleaseProvider {
  /** Provider identifier */
  readonly type: DeployProviderType;
  readonly version: string;

  // Lifecycle
  /**
   * Initialize deploy provider
   * @param config - Optional provider configuration
   */
  initialize(config?: Record<string, unknown>): Promise<void>;

  /**
   * Cleanup deploy provider resources
   */
  cleanup(): Promise<void>;

  // Deployment operations
  /**
   * Deploy an artifact to target environment
   * @param artifact - Deployment artifact to deploy
   * @returns Deployment result
   */
  deploy(artifact: DeploymentArtifact): Promise<DeploymentResult>;

  /**
   * Rollback a deployment to a previous version
   * @param deploymentId - ID of deployment to rollback
   * @param targetVersion - Version to rollback to
   * @returns Rollback result
   */
  rollback(deploymentId: string, targetVersion?: string): Promise<RollbackResult>;

  /**
   * Get current deployment status
   * @param deploymentId - ID of deployment to check
   * @returns Current deployment status
   */
  getDeploymentStatus(deploymentId: string): Promise<DeploymentArtifact | null>;

  // Canary release operations
  /**
   * Start a canary release with given policy
   * @param artifact - Deployment artifact
   * @param policy - Canary release policy
   * @returns Deployment result with canary progress
   */
  startCanaryRelease(artifact: DeploymentArtifact, policy: CanaryPolicy): Promise<DeploymentResult>;

  /**
   * Promote canary to full deployment
   * @param deploymentId - ID of canary deployment to promote
   * @returns Deployment result
   */
  promoteCanary(deploymentId: string): Promise<DeploymentResult>;

  /**
   * Abort canary release and rollback
   * @param deploymentId - ID of canary deployment to abort
   * @returns Rollback result
   */
  abortCanaryRelease(deploymentId: string): Promise<RollbackResult>;

  /**
   * Get canary release progress
   * @param deploymentId - ID of canary deployment
   * @returns Canary progress or null if not found
   */
  getCanaryProgress(deploymentId: string): Promise<CanaryProgress | null>;

  /**
   * Increment canary traffic percentage
   * @param deploymentId - ID of canary deployment
   * @param incrementPercent - Percentage to add
   * @returns Updated canary progress
   */
  incrementCanaryTraffic(deploymentId: string, incrementPercent: number): Promise<CanaryProgress>;

  // Health monitoring
  /**
   * Run health check on deployed artifact
   * @param deploymentId - ID of deployment to check
   * @param endpoint - Health check endpoint
   * @returns Health check result
   */
  runHealthCheck(deploymentId: string, endpoint: string): Promise<HealthCheckResult>;

  /**
   * Run multiple health checks
   * @param deploymentId - ID of deployment to check
   * @param endpoints - Array of endpoints to check
   * @returns Array of health check results
   */
  runHealthChecks(deploymentId: string, endpoints: string[]): Promise<HealthCheckResult[]>;

  // Verification and evidence
  /**
   * Verify deployment completed successfully
   * @param deploymentId - ID of deployment to verify
   * @returns True if verified
   */
  verifyDeployment(deploymentId: string): Promise<boolean>;

  /**
   * Generate release evidence for audit
   * @param deploymentId - ID of deployment
   * @returns Release evidence data
   */
  generateReleaseEvidence(deploymentId: string): Promise<Record<string, unknown>>;
}

/**
 * Factory function for creating deploy providers
 */
export type DeployProviderFactory = (type: DeployProviderType) => CanaryReleaseProvider;
