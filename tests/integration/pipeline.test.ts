/**
 * Pipeline Integration Tests
 *
 * Tests for Pipeline.executeStage with gate blocking behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pipeline, GateBlockedError, DEFAULT_STAGES } from '../../src/pipeline/chain.js';
import type { StageContext, PipelineConfig } from '../../src/pipeline/types.js';

describe('Pipeline Integration Tests', () => {
  describe('executeStage with gate blocking', () => {
    it('should execute stage successfully when no gate is defined', async () => {
      const pipeline = new Pipeline();

      const executor = vi.fn().mockResolvedValue({ output: 'test-result' });

      const context = await pipeline.executeStage('interview', { input: 'test' }, executor);

      expect(context.status).toBe('completed');
      expect(context.output).toEqual({ output: 'test-result' });
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('should throw GateBlockedError when gate blocking criteria fail', async () => {
      const stagesWithGate = [
        {
          id: 'spec' as const,
          name: 'Specification',
          description: 'Create technical specification',
          agent: 'architect',
          command: 'spec',
          dependsOn: ['interview'],
          gate: {
            id: 'test-gate',
            name: 'Test Gate',
            description: 'A test gate',
            fromStatus: 'planned' as const,
            toStatus: 'executing' as const,
            criteria: [
              {
                id: 'blocking-criterion',
                description: 'This is a blocking criterion',
                check: () => false,
                severity: 'blocking' as const,
              },
            ],
            requiresApproval: false,
          },
        },
      ];

      const config: Partial<PipelineConfig> = { stages: stagesWithGate };
      const pipeline = new Pipeline(config);

      const executor = vi.fn().mockResolvedValue({ output: 'test' });

      await expect(
        pipeline.executeStage('spec', { input: 'test' }, executor)
      ).rejects.toThrow(GateBlockedError);

      expect(executor).not.toHaveBeenCalled();
    });

    it('should pass through stage when gate criteria pass', async () => {
      const stagesWithGate = [
        {
          id: 'spec' as const,
          name: 'Specification',
          description: 'Create technical specification',
          agent: 'architect',
          command: 'spec',
          dependsOn: ['interview'],
          gate: {
            id: 'passing-gate',
            name: 'Passing Gate',
            description: 'A gate that passes',
            fromStatus: 'planned' as const,
            toStatus: 'executing' as const,
            criteria: [
              {
                id: 'passing-criterion',
                description: 'This criterion passes',
                check: () => true,
                severity: 'blocking' as const,
              },
            ],
            requiresApproval: false,
          },
        },
      ];

      const config: Partial<PipelineConfig> = { stages: stagesWithGate };
      const pipeline = new Pipeline(config);

      const executor = vi.fn().mockResolvedValue({ output: 'spec-output' });

      const context = await pipeline.executeStage('spec', { input: 'test' }, executor);

      expect(context.status).toBe('completed');
      expect(context.output).toEqual({ output: 'spec-output' });
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('should record gate warnings but not block when only warnings fail', async () => {
      const stagesWithWarning = [
        {
          id: 'code' as const,
          name: 'Code Implementation',
          description: 'Implement features',
          agent: 'executor',
          command: 'code',
          dependsOn: ['plan'],
          gate: {
            id: 'warning-gate',
            name: 'Gate with Warning',
            description: 'A gate with only warnings',
            fromStatus: 'executing' as const,
            toStatus: 'verifying' as const,
            criteria: [
              {
                id: 'warning-criterion',
                description: 'This is a warning only',
                check: () => false,
                severity: 'warning' as const,
              },
            ],
            requiresApproval: false,
          },
        },
      ];

      const config: Partial<PipelineConfig> = { stages: stagesWithWarning };
      const pipeline = new Pipeline(config);

      const executor = vi.fn().mockResolvedValue({ output: 'code-output' });

      const context = await pipeline.executeStage('code', { input: 'test' }, executor);

      expect(context.status).toBe('completed');
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('should handle approval-required gates correctly', async () => {
      const stagesWithApproval = [
        {
          id: 'review' as const,
          name: 'Code Review',
          description: 'Review code quality',
          agent: 'reviewer',
          command: 'review',
          dependsOn: ['test'],
          gate: {
            id: 'approval-gate',
            name: 'Approval Gate',
            description: 'Gate requiring approval',
            fromStatus: 'verifying' as const,
            toStatus: 'completed' as const,
            criteria: [
              {
                id: 'approval-criterion',
                description: 'Requires approval to proceed',
                check: () => false,
                severity: 'blocking' as const,
              },
            ],
            requiresApproval: true,
            approvers: ['user'],
          },
        },
      ];

      const config: Partial<PipelineConfig> = { stages: stagesWithApproval };
      const pipeline = new Pipeline(config);

      const executor = vi.fn().mockResolvedValue({ output: 'review-output' });

      await expect(
        pipeline.executeStage('review', { input: 'test' }, executor)
      ).rejects.toThrow(GateBlockedError);

      expect(executor).not.toHaveBeenCalled();
    });

    it('should track stage dependencies correctly', () => {
      const pipeline = new Pipeline();

      // interview has no dependencies
      const interviewStage = DEFAULT_STAGES.find(s => s.id === 'interview')!;
      expect(pipeline.getNextStages().some(s => s.id === 'interview')).toBe(true);

      // After interview, spec should be next
      pipeline.updateStage({
        stage: 'interview',
        input: null,
        status: 'completed',
        startTime: Date.now(),
        endTime: Date.now(),
        output: { result: 'interview-output' },
      });

      const nextStages = pipeline.getNextStages();
      expect(nextStages.some(s => s.id === 'spec')).toBe(true);
    });

    it('should skip stages with unmet dependencies', () => {
      const pipeline = new Pipeline();

      // Try to run spec without interview
      const specStage = DEFAULT_STAGES.find(s => s.id === 'spec')!;
      expect(pipeline.areDependenciesMet(specStage)).toBe(false);
    });

    it('should report gate status after execution', async () => {
      const stagesWithGate = [
        {
          id: 'deploy' as const,
          name: 'Deployment',
          description: 'Deploy to target',
          agent: 'executor',
          dependsOn: ['review'],
          gate: {
            id: 'deploy-gate',
            name: 'Deploy Gate',
            description: 'Gate for deployment',
            fromStatus: 'completed' as const,
            toStatus: 'archived' as const,
            criteria: [
              {
                id: 'deploy-check',
                description: 'Deploy readiness check',
                check: () => true,
                severity: 'blocking' as const,
              },
            ],
            requiresApproval: false,
          },
        },
      ];

      const config: Partial<PipelineConfig> = { stages: stagesWithGate };
      const pipeline = new Pipeline(config);

      const executor = vi.fn().mockResolvedValue({ output: 'deploy-result' });

      await pipeline.executeStage('deploy', { input: 'test' }, executor);

      const gateStatus = pipeline.getGateStatus();
      expect(gateStatus.length).toBe(1);
      expect(gateStatus[0].gateId).toBe('deploy-gate');
      expect(gateStatus[0].passed).toBe(true);
    });
  });

  describe('Pipeline lifecycle', () => {
    it('should generate unique pipeline ID on construction', () => {
      const pipeline1 = new Pipeline();
      const pipeline2 = new Pipeline();

      const summary1 = pipeline1.getSummary();
      const summary2 = pipeline2.getSummary();

      expect(summary1.pipelineId).not.toBe(summary2.pipelineId);
    });

    it('should track completed stages correctly', async () => {
      const pipeline = new Pipeline();

      const executor = vi.fn().mockResolvedValue({ output: 'result' });

      await pipeline.executeStage('interview', { input: 'test' }, executor);

      const summary = pipeline.getSummary();
      expect(summary.completed).toBe(1);
      expect(summary.failed).toBe(0);
      expect(summary.skipped).toBe(0);
    });

    it('should record audit log entries during execution', async () => {
      const pipeline = new Pipeline();

      const executor = vi.fn().mockImplementation(async (stage, input) => {
        return { output: 'result' };
      });

      await pipeline.execute({}, executor);

      const auditLog = pipeline.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
    });
  });
});
