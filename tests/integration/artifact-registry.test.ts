/**
 * Artifact Registry Integration Tests
 *
 * Tests for Artifact Registry CRUD operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { artifactRegistry, ArtifactRegistry } from '../../src/artifacts/registry.js';
import type { CreateArtifactOptions, ArtifactType } from '../../src/artifacts/types.js';

describe('Artifact Registry Integration Tests', () => {
  beforeEach(() => {
    artifactRegistry.clear();
  });

  describe('CRUD Operations', () => {
    it('should register a new artifact', () => {
      const options: CreateArtifactOptions = {
        type: 'PROJECT',
        id: 'project-1',
        sourceWorkflow: 'discover',
        owner: 'user1',
        content: '# Project\n\nThis is a project.',
      };

      const entry = artifactRegistry.register(options, '/path/to/project.md');

      expect(entry).toBeDefined();
      expect(entry.artifact.frontmatter.id).toBe('project-1');
      expect(entry.artifact.frontmatter.status).toBe('draft');
      expect(entry.type).toBe('PROJECT');
    });

    it('should retrieve an artifact by ID', () => {
      const options: CreateArtifactOptions = {
        type: 'SPEC',
        id: 'spec-1',
        sourceWorkflow: 'spec',
        owner: 'user1',
        content: '# Specification\n\nSpec content.',
      };

      artifactRegistry.register(options, '/path/to/spec.md');

      const retrieved = artifactRegistry.get('spec-1');

      expect(retrieved).toBeDefined();
      expect(retrieved!.artifact.frontmatter.id).toBe('spec-1');
    });

    it('should return undefined for non-existent artifact', () => {
      const result = artifactRegistry.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should update artifact status', () => {
      const options: CreateArtifactOptions = {
        type: 'REQUIREMENTS',
        id: 'req-1',
        sourceWorkflow: 'interview',
        owner: 'user1',
        content: '# Requirements\n\nRequirements content.',
      };

      artifactRegistry.register(options, '/path/to/req.md');

      const updated = artifactRegistry.updateStatus('req-1', 'active');

      expect(updated).toBe(true);

      const retrieved = artifactRegistry.get('req-1');
      expect(retrieved!.artifact.frontmatter.status).toBe('active');
    });

    it('should return false when updating non-existent artifact', () => {
      const result = artifactRegistry.updateStatus('non-existent', 'active');
      expect(result).toBe(false);
    });

    it('should update artifact approval state', () => {
      const options: CreateArtifactOptions = {
        type: 'PLAN',
        id: 'plan-1',
        sourceWorkflow: 'plan',
        owner: 'user1',
        content: '# Plan\n\nPlan content.',
      };

      artifactRegistry.register(options, '/path/to/plan.md');

      const updated = artifactRegistry.updateApprovalState('plan-1', 'approved');

      expect(updated).toBe(true);

      const retrieved = artifactRegistry.get('plan-1');
      expect(retrieved!.artifact.frontmatter.approvalState).toBe('approved');
    });

    it('should unregister an artifact', () => {
      const options: CreateArtifactOptions = {
        type: 'ROADMAP',
        id: 'roadmap-1',
        sourceWorkflow: 'plan',
        owner: 'user1',
        content: '# Roadmap\n\nRoadmap content.',
      };

      artifactRegistry.register(options, '/path/to/roadmap.md');

      const unregistered = artifactRegistry.unregister('roadmap-1');

      expect(unregistered).toBe(true);
      expect(artifactRegistry.get('roadmap-1')).toBeUndefined();
    });

    it('should return false when unregistering non-existent artifact', () => {
      const result = artifactRegistry.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should clear all artifacts', () => {
      const options1: CreateArtifactOptions = {
        type: 'PROJECT',
        id: 'project-1',
        sourceWorkflow: 'discover',
        owner: 'user1',
        content: '# Project 1',
      };

      const options2: CreateArtifactOptions = {
        type: 'SPEC',
        id: 'spec-1',
        sourceWorkflow: 'spec',
        owner: 'user1',
        content: '# Spec 1',
      };

      artifactRegistry.register(options1, '/path/to/project.md');
      artifactRegistry.register(options2, '/path/to/spec.md');

      artifactRegistry.clear();

      expect(artifactRegistry.getAll()).toHaveLength(0);
    });
  });

  describe('Query Operations', () => {
    beforeEach(() => {
      const artifacts: CreateArtifactOptions[] = [
        {
          type: 'PROJECT',
          id: 'project-1',
          sourceWorkflow: 'discover',
          owner: 'alice',
          content: '# Project 1',
        },
        {
          type: 'REQUIREMENTS',
          id: 'req-1',
          sourceWorkflow: 'interview',
          owner: 'bob',
          content: '# Requirements 1',
        },
        {
          type: 'SPEC',
          id: 'spec-1',
          sourceWorkflow: 'spec',
          owner: 'alice',
          content: '# Spec 1',
        },
        {
          type: 'PLAN',
          id: 'plan-1',
          sourceWorkflow: 'plan',
          owner: 'bob',
          content: '# Plan 1',
        },
      ];

      for (const opts of artifacts) {
        artifactRegistry.register(opts, `/path/to/${opts.id}.md`);
      }
    });

    it('should get all artifacts', () => {
      const all = artifactRegistry.getAll();
      expect(all).toHaveLength(4);
    });

    it('should get artifacts by type', () => {
      const projects = artifactRegistry.getByType('PROJECT');
      expect(projects).toHaveLength(1);
      expect(projects[0].type).toBe('PROJECT');

      const specs = artifactRegistry.getByType('SPEC');
      expect(specs).toHaveLength(1);
    });

    it('should get artifacts by owner', () => {
      const aliceArtifacts = artifactRegistry.getByOwner('alice');
      expect(aliceArtifacts).toHaveLength(2);
      expect(aliceArtifacts.every(a => a.artifact.frontmatter.owner === 'alice')).toBe(true);

      const bobArtifacts = artifactRegistry.getByOwner('bob');
      expect(bobArtifacts).toHaveLength(2);
    });

    it('should get artifacts by status', () => {
      artifactRegistry.updateStatus('project-1', 'active');

      const activeArtifacts = artifactRegistry.getByStatus('active');
      expect(activeArtifacts).toHaveLength(1);
      expect(activeArtifacts[0].artifact.frontmatter.id).toBe('project-1');

      const draftArtifacts = artifactRegistry.getByStatus('draft');
      expect(draftArtifacts).toHaveLength(3);
    });

    it('should get artifacts by approval state', () => {
      artifactRegistry.updateApprovalState('req-1', 'approved');
      artifactRegistry.updateApprovalState('spec-1', 'rejected');

      const approved = artifactRegistry.getByApprovalState('approved');
      expect(approved).toHaveLength(1);
      expect(approved[0].artifact.frontmatter.id).toBe('req-1');

      const rejected = artifactRegistry.getByApprovalState('rejected');
      expect(rejected).toHaveLength(1);
    });
  });

  describe('Dependency Operations', () => {
    beforeEach(() => {
      const artifacts: CreateArtifactOptions[] = [
        {
          type: 'PROJECT',
          id: 'project-1',
          sourceWorkflow: 'discover',
          owner: 'user1',
          dependsOn: [],
          content: '# Project 1',
        },
        {
          type: 'REQUIREMENTS',
          id: 'req-1',
          sourceWorkflow: 'interview',
          owner: 'user1',
          dependsOn: ['project-1'],
          content: '# Requirements 1',
        },
        {
          type: 'SPEC',
          id: 'spec-1',
          sourceWorkflow: 'spec',
          owner: 'user1',
          dependsOn: ['req-1', 'project-1'],
          content: '# Spec 1',
        },
        {
          type: 'PLAN',
          id: 'plan-1',
          sourceWorkflow: 'plan',
          owner: 'user1',
          dependsOn: ['spec-1'],
          content: '# Plan 1',
        },
      ];

      for (const opts of artifacts) {
        artifactRegistry.register(opts, `/path/to/${opts.id}.md`);
      }
    });

    it('should get dependencies of an artifact', () => {
      const specDeps = artifactRegistry.getDependencies('spec-1');

      expect(specDeps).toHaveLength(2);
      const depIds = specDeps.map(d => d.artifact.frontmatter.id).sort();
      expect(depIds).toEqual(['project-1', 'req-1']);
    });

    it('should return empty array for artifact with no dependencies', () => {
      const projectDeps = artifactRegistry.getDependencies('project-1');
      expect(projectDeps).toHaveLength(0);
    });

    it('should return empty array for non-existent artifact', () => {
      const deps = artifactRegistry.getDependencies('non-existent');
      expect(deps).toHaveLength(0);
    });

    it('should get dependents of an artifact', () => {
      const projectDependents = artifactRegistry.getDependents('project-1');

      expect(projectDependents).toHaveLength(2);
      const dependentIds = projectDependents.map(d => d.artifact.frontmatter.id).sort();
      expect(dependentIds).toEqual(['req-1', 'spec-1']);
    });

    it('should return empty array for artifact with no dependents', () => {
      const planDependents = artifactRegistry.getDependents('plan-1');
      expect(planDependents).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      const artifacts: CreateArtifactOptions[] = [
        { type: 'PROJECT', id: 'p1', sourceWorkflow: 'discover', owner: 'alice', content: '# P1' },
        { type: 'PROJECT', id: 'p2', sourceWorkflow: 'discover', owner: 'bob', content: '# P2' },
        { type: 'SPEC', id: 's1', sourceWorkflow: 'spec', owner: 'alice', content: '# S1' },
        { type: 'PLAN', id: 'pl1', sourceWorkflow: 'plan', owner: 'alice', content: '# PL1' },
      ];

      for (const opts of artifacts) {
        artifactRegistry.register(opts, `/path/to/${opts.id}.md`);
      }

      artifactRegistry.updateStatus('p1', 'active');
      artifactRegistry.updateApprovalState('p2', 'approved');
    });

    it('should return correct statistics', () => {
      const stats = artifactRegistry.getStats();

      expect(stats.total).toBe(4);
      expect(stats.byType['PROJECT']).toBe(2);
      expect(stats.byType['SPEC']).toBe(1);
      expect(stats.byType['PLAN']).toBe(1);
      expect(stats.byStatus['active']).toBe(1);
      expect(stats.byStatus['draft']).toBe(3);
      expect(stats.byApprovalState['approved']).toBe(1);
      expect(stats.byApprovalState['pending']).toBe(3);
    });
  });
});
