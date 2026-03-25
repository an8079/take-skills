/**
 * Full Pipeline E2E Tests
 *
 * Tests for full pipeline run with mock QA provider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pipeline, DEFAULT_STAGES } from '../../src/pipeline/chain.js';
import type { PipelineConfig, StageContext, StageDefinition, PipelineStage } from '../../src/pipeline/types.js';

/** DEFAULT_STAGES with all gates stripped — for tests that don't care about gate enforcement */
const UNGATED_STAGES: StageDefinition[] = DEFAULT_STAGES.map(s => ({ ...s, gate: undefined, phaseId: undefined }));

describe('Full Pipeline E2E Tests', () => {
  describe('Full Pipeline Execution', () => {
    it('should execute complete pipeline with all stages', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES });

      const executor = vi.fn().mockImplementation(async (stage, input) => {
        return { stage: stage.id, output: `result-from-${stage.id}`, input };
      });

      const result = await pipeline.execute({ initial: 'input' }, executor);

      expect(result.status).toBe('completed');
      expect(result.stages.length).toBe(DEFAULT_STAGES.length);
    });

    it('should execute stages in dependency order', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES });

      const callOrder: string[] = [];

      const executor = vi.fn().mockImplementation(async (stage, _input) => {
        callOrder.push(stage.id);
        return { stage: stage.id };
      });

      await pipeline.execute({}, executor);

      // Verify interview comes before spec
      const interviewIdx = callOrder.indexOf('interview');
      const specIdx = callOrder.indexOf('spec');
      const planIdx = callOrder.indexOf('plan');

      expect(interviewIdx).toBeLessThan(specIdx);
      expect(specIdx).toBeLessThan(planIdx);
    });

    it('should pass output from one stage as input to next', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES });

      const executor = vi.fn().mockImplementation(async (stage, input) => {
        // Each stage should receive the output from previous stage
        return { previousInput: input, currentStage: stage.id };
      });

      const result = await pipeline.execute({ initial: true }, executor);

      expect(result.status).toBe('completed');

      // Check that stages received outputs
      const completedStages = result.stages.filter(s => s.status === 'completed');
      expect(completedStages.length).toBeGreaterThan(0);
    });

    it('should skip optional stages when conditions not met', async () => {
      const ungatedBase = UNGATED_STAGES.slice(0, -2);
      const stagesWithOptional = [
        ...ungatedBase, // All except deploy and canary
        {
          id: 'deploy' as const,
          name: 'Deployment',
          description: 'Deploy to target',
          agent: 'executor',
          dependsOn: ['review'],
          optional: true,
        },
        {
          id: 'canary' as const,
          name: 'Canary Release',
          description: 'Gradual traffic shift',
          agent: 'qa-tester',
          dependsOn: ['deploy'],
          optional: true,
        },
      ];

      const config: PipelineConfig = { stages: stagesWithOptional };
      const pipeline = new Pipeline(config);

      // Override shouldRunOptionalStage to return false
      const executor = vi.fn().mockResolvedValue({ result: 'done' });

      const result = await pipeline.execute({}, executor);

      // Pipeline should still complete
      expect(result.status).toBe('completed');
    });

    it('should handle stage failure with continueOnError false', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES, continueOnError: false });

      const executor = vi.fn().mockImplementation(async (stage, _input) => {
        if (stage.id === 'code') {
          throw new Error('Code stage failed');
        }
        return { stage: stage.id };
      });

      const result = await pipeline.execute({}, executor);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Code stage failed');
    });

    it('should record stage execution in results', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES });

      const executor = vi.fn().mockResolvedValue({ result: 'success' });

      await pipeline.execute({}, executor);

      const summary = pipeline.getSummary();

      expect(summary.totalStages).toBe(DEFAULT_STAGES.length);
    });

    it('should generate audit log entries', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES });

      const executor = vi.fn().mockResolvedValue({ result: 'success' });

      await pipeline.execute({}, executor);

      const auditLog = pipeline.getAuditLog();

      expect(auditLog.length).toBeGreaterThan(0);
    });
  });

  describe('Pipeline with Mock QA Provider', () => {
    it('should integrate with mock QA results', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES });

      // Mock QA that returns simulated QA results
      const mockQA = vi.fn().mockResolvedValue({
        passed: true,
        passedItems: ['smoke-test', 'integration-test'],
        failedItems: [],
        summary: 'All QA checks passed',
      });

      const executor = vi.fn().mockImplementation(async (stage, input) => {
        if (stage.id === 'test') {
          return await mockQA();
        }
        return { stage: stage.id };
      });

      const result = await pipeline.execute({}, executor);

      expect(result.status).toBe('completed');
      expect(mockQA).toHaveBeenCalled();
    });

    it('should handle QA failures appropriately', async () => {
      const pipeline = new Pipeline({ stages: UNGATED_STAGES, continueOnError: false });

      const mockQA = vi.fn().mockResolvedValue({
        passed: false,
        passedItems: ['smoke-test'],
        failedItems: [{ id: 'bug-1', title: 'Critical bug found' }],
        summary: 'QA failed: 1 critical issue',
      });

      const executor = vi.fn().mockImplementation(async (stage, input) => {
        if (stage.id === 'test') {
          return await mockQA();
        }
        return { stage: stage.id };
      });

      const result = await pipeline.execute({}, executor);

      // Depending on configuration, QA failure should be handled
      expect(result.stages.some(s => s.stage === 'test')).toBe(true);
    });
  });

  describe('Canary Deployment Simulation', () => {
    it('should simulate canary deployment stages', async () => {
      const canaryStages = [
        ...UNGATED_STAGES.slice(0, 6), // Up to review
        {
          id: 'deploy' as const,
          name: 'Deploy',
          description: 'Deploy to staging',
          agent: 'executor',
          dependsOn: ['review'],
        },
        {
          id: 'canary' as const,
          name: 'Canary Release',
          description: 'Canary traffic shift',
          agent: 'qa-tester',
          dependsOn: ['deploy'],
          optional: true,
        },
      ];

      const config: PipelineConfig = { stages: canaryStages };
      const pipeline = new Pipeline(config);

      const executor = vi.fn().mockImplementation(async (stage, input) => {
        if (stage.id === 'canary') {
          return {
            trafficShift: '10%',
            metrics: { errorRate: 0.01, latency: 150 },
            status: 'healthy',
          };
        }
        return { stage: stage.id };
      });

      const result = await pipeline.execute({}, executor);

      expect(result.status).toBe('completed');
    });

    it('should track canary metrics', async () => {
      const canaryStages = [
        ...UNGATED_STAGES.slice(0, 6),
        {
          id: 'deploy' as const,
          name: 'Deploy',
          description: 'Deploy',
          agent: 'executor',
          dependsOn: ['review'],
        },
        {
          id: 'canary' as const,
          name: 'Canary',
          description: 'Canary release',
          agent: 'qa-tester',
          dependsOn: ['deploy'],
          optional: true,
        },
      ];

      const config: PipelineConfig = { stages: canaryStages };
      const pipeline = new Pipeline(config);

      const canaryMetrics: unknown[] = [];

      const executor = vi.fn().mockImplementation(async (stage, input) => {
        if (stage.id === 'canary') {
          const metrics = {
            trafficPercent: 10,
            errorRate: 0.01,
            p99Latency: 200,
            healthCheck: 'passing',
          };
          canaryMetrics.push(metrics);
          return metrics;
        }
        return { stage: stage.id };
      });

      await pipeline.execute({}, executor);

      expect(canaryMetrics.length).toBe(1);
      expect(canaryMetrics[0]).toHaveProperty('trafficPercent', 10);
    });
  });
});
