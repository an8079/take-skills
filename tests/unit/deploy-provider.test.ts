import http from "http";
import { afterEach, describe, expect, it } from "vitest";
import { CLIDeployProvider } from "../../src/providers/deploy/canary.js";
import type { DeploymentArtifact } from "../../src/providers/deploy/types.js";

function createDeployment(
  overrides?: Partial<DeploymentArtifact>
): DeploymentArtifact {
  return {
    id: "deploy-1",
    version: "1.0.0",
    environment: "staging",
    status: "completed",
    startedAt: Date.now(),
    artifacts: ["dist/app.tgz"],
    metadata: {},
    ...overrides,
  };
}

async function createHealthServer(
  statusCode: number,
  body = "ok"
): Promise<{ server: http.Server; url: string }> {
  const server = http.createServer((_req, res) => {
    res.statusCode = statusCode;
    res.end(body);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind health server");
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}/health`,
  };
}

describe("CLIDeployProvider", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
          })
      )
    );
  });

  it("verifies completed deployments with passing health checks", async () => {
    const { server, url } = await createHealthServer(200);
    servers.push(server);

    const provider = new CLIDeployProvider();
    const artifact = createDeployment({
      metadata: {
        healthCheckEndpoints: [url],
      },
    });

    (provider as any).deployments.set(artifact.id, artifact);

    const verified = await provider.verifyDeployment(artifact.id);
    const evidence = await provider.generateReleaseEvidence(artifact.id);

    expect(verified).toBe(true);
    expect((evidence.verification as { passed: boolean }).passed).toBe(true);
    expect((evidence.verification as { healthChecks: Array<{ endpoint: string }> }).healthChecks[0].endpoint).toBe(url);
  });

  it("fails verification when health checks fail", async () => {
    const { server, url } = await createHealthServer(500, "bad");
    servers.push(server);

    const provider = new CLIDeployProvider();
    const artifact = createDeployment({
      id: "deploy-2",
      metadata: {
        healthCheckEndpoints: [url],
      },
    });

    (provider as any).deployments.set(artifact.id, artifact);

    const verified = await provider.verifyDeployment(artifact.id);
    const evidence = await provider.generateReleaseEvidence(artifact.id);

    expect(verified).toBe(false);
    expect((evidence.verification as { reasons: string[] }).reasons[0]).toContain("Health check failed");
  });

  it("fails canary verification when runtime metrics exceed policy thresholds", async () => {
    const provider = new CLIDeployProvider();
    const artifact = createDeployment({
      id: "deploy-3",
      status: "canary_active",
      canaryPolicy: {
        initialTrafficPercent: 10,
        incrementPercent: 10,
        incrementIntervalMs: 1000,
        maxTrafficPercent: 50,
        healthCheckSuccessThreshold: 2,
        errorRateThreshold: 1,
        latencyThresholdMs: 50,
        autoRollback: true,
        trafficSplitStrategy: "percentage",
      },
    });

    (provider as any).deployments.set(artifact.id, artifact);
    (provider as any).canaryProgress.set(artifact.id, {
      deploymentId: artifact.id,
      currentTrafficPercent: 10,
      targetTrafficPercent: 50,
      isStable: false,
      healthChecks: [],
      errorRate: 3,
      avgLatencyMs: 120,
      canarySteps: [],
    });

    const verified = await provider.verifyDeployment(artifact.id);
    const evidence = await provider.generateReleaseEvidence(artifact.id);

    expect(verified).toBe(false);
    expect((evidence.verification as { reasons: string[] }).reasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("error rate"),
        expect.stringContaining("latency"),
        "Canary progress is not stable",
      ])
    );
  });
});
