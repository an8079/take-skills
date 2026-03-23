/**
 * CLI Commands E2E Tests
 *
 * Tests for doctor, setup, verify, status, and pipeline-run commands.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runDoctorChecks, printDoctorResults, type DoctorResult } from '../../src/commands/doctor.js';
import { runSetup, printSetupResults, type SetupResult } from '../../src/commands/setup.js';
import { runVerify, printVerifyResults, type VerifyResult } from '../../src/commands/verify.js';
import { getStatus, printStatus, type StatusInfo } from '../../src/commands/status.js';
import { checkPipelineReady, printPipelineInfo, type PipelineRunResult } from '../../src/commands/pipeline-run.js';
import { listPipelineStages, expandPipeline } from '../../src/commands/index.js';

describe('CLI Commands E2E Tests', () => {
  describe('Doctor Command', () => {
    it('should run doctor checks and return result', () => {
      const result = runDoctorChecks();

      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(Array.isArray(result.checks)).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should include required health check categories', () => {
      const result = runDoctorChecks();

      const checkNames = result.checks.map(c => c.name);

      expect(checkNames).toContain('node-version');
      expect(checkNames).toContain('commands-built-in');
      expect(checkNames).toContain('commands-core');
      expect(checkNames).toContain('agents');
      expect(checkNames).toContain('dist');
    });

    it('should correctly determine overall health', () => {
      const result = runDoctorChecks();

      const failures = result.checks.filter(c => c.status === 'fail');

      if (failures.length === 0) {
        expect(result.healthy).toBe(true);
      } else {
        expect(result.healthy).toBe(false);
      }
    });

    it('should include summary message', () => {
      const result = runDoctorChecks();

      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should have pass/fail/warn status for each check', () => {
      const result = runDoctorChecks();

      for (const check of result.checks) {
        expect(['pass', 'fail', 'warn']).toContain(check.status);
      }
    });
  });

  describe('Setup Command', () => {
    it('should run setup and return result', () => {
      const result = runSetup();

      expect(result).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(Array.isArray(result.steps)).toBe(true);
    });

    it('should include setup step names', () => {
      const result = runSetup();

      const stepNames = result.steps.map(s => s.name);

      expect(stepNames).toContain('user-config');
      expect(stepNames).toContain('project-config');
      expect(stepNames).toContain('user-commands');
      expect(stepNames).toContain('build');
    });

    it('should have ok/skip/fail status for each step', () => {
      const result = runSetup();

      for (const step of result.steps) {
        expect(['ok', 'skip', 'fail']).toContain(step.status);
      }
    });

    it('should set success based on step statuses', () => {
      const result = runSetup();

      const hasFailures = result.steps.some(s => s.status === 'fail');

      if (hasFailures) {
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Verify Command', () => {
    it('should run verify checks and return result', () => {
      const result = runVerify();

      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(Array.isArray(result.checks)).toBe(true);
    });

    it('should include verification categories', () => {
      const result = runVerify();

      const categories = result.checks.map(c => c.category);

      expect(categories).toContain('system-health');
      expect(categories).toContain('core-commands');
      expect(categories).toContain('agents');
    });

    it('should have pass/fail status for each check', () => {
      const result = runVerify();

      for (const check of result.checks) {
        expect(['pass', 'fail']).toContain(check.status);
      }
    });

    it('should set success based on check statuses', () => {
      const result = runVerify();

      const failures = result.checks.filter(c => c.status === 'fail');

      if (failures.length === 0) {
        expect(result.success).toBe(true);
      } else {
        expect(result.success).toBe(false);
      }
    });

    it('should include summary message', () => {
      const result = runVerify();

      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe('Status Command', () => {
    it('should get system status', () => {
      const status = getStatus();

      expect(status).toBeDefined();
      expect(status.version).toBeDefined();
      expect(status.node).toBeDefined();
      expect(status.health).toBeDefined();
    });

    it('should include system information', () => {
      const status = getStatus();

      expect(status.system).toBeDefined();
      expect(status.system.commands).toBeDefined();
      expect(status.system.agents).toBeDefined();
      expect(status.system.dist).toBeDefined();
      expect(status.system.config).toBeDefined();
    });

    it('should include command counts and search paths', () => {
      const status = getStatus();

      expect(status.system.commands.total).toBeGreaterThanOrEqual(0);
      expect(status.system.commands.searchPaths).toBeDefined();
      expect(Array.isArray(status.system.commands.searchPaths)).toBe(true);
    });

    it('should include agent categories', () => {
      const status = getStatus();

      expect(status.system.agents.total).toBeGreaterThanOrEqual(0);
      expect(status.system.agents.categories).toBeDefined();
    });

    it('should have valid health status', () => {
      const status = getStatus();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(status.health);
    });
  });

  describe('Pipeline Run Command', () => {
    it('should check pipeline readiness', () => {
      const result = checkPipelineReady();

      expect(result).toBeDefined();
      expect(result.pipeline).toBeDefined();
      expect(result.stages).toBeDefined();
      expect(Array.isArray(result.stages)).toBe(true);
    });

    it('should return ready or not-ready status', () => {
      const result = checkPipelineReady();

      expect(['ready', 'not-ready']).toContain(result.status);
    });

    it('should include pipeline message', () => {
      const result = checkPipelineReady();

      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should list pipeline stages', () => {
      const stages = listPipelineStages();

      expect(stages).toBeDefined();
      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThan(0);
    });

    it('should expand pipeline definition', () => {
      const pipeline = expandPipeline();

      expect(pipeline).toBeDefined();
      expect(pipeline.description).toBeDefined();
      expect(pipeline.stages).toBeDefined();
      expect(Array.isArray(pipeline.stages)).toBe(true);
    });
  });
});
