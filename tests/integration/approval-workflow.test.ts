/**
 * Approval Workflow Integration Tests
 *
 * Tests for ApprovalWorkflow approval flows.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ApprovalWorkflow,
  type ApprovalRequest,
  type ApprovalPolicy,
} from '../../src/phase-manager/approval-workflow.js';

describe('Approval Workflow Integration Tests', () => {
  describe('Request Approval', () => {
    it('should create auto-approved request when gate does not require approval', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-execute-complete', 'pipeline');

      expect(request.type).toBe('auto');
      expect(request.status).toBe('pending');
      expect(request.phaseId).toBe('phase1');
      expect(request.gateId).toBe('gate-execute-complete');
    });

    it('should create manual approval request when gate requires approval', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      expect(request.type).toBe('manual');
      expect(request.status).toBe('pending');
      expect(request.approver).toBe('user');
    });

    it('should generate unique approval IDs', async () => {
      const workflow = new ApprovalWorkflow();

      const request1 = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      const request2 = await workflow.requestApproval('phase2', 'gate-plan-complete', 'pipeline');

      expect(request1.id).not.toBe(request2.id);
    });

    it('should store approval request in workflow', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      const retrieved = workflow.getRequest(request.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(request.id);
    });

    it('should get all requests for a phase', async () => {
      const workflow = new ApprovalWorkflow();

      await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      await workflow.requestApproval('phase1', 'gate-plan-complete', 'pipeline');
      await workflow.requestApproval('phase2', 'gate-discuss-complete', 'pipeline');

      const phase1Requests = workflow.getRequestsForPhase('phase1');

      expect(phase1Requests).toHaveLength(2);
      expect(phase1Requests.every(r => r.phaseId === 'phase1')).toBe(true);
    });

    it('should set expiration time when timeout is configured', async () => {
      const policy: ApprovalPolicy = {
        gateId: 'test-gate',
        requireApproval: true,
        approvers: ['user'],
        timeoutMinutes: 60,
      };

      const workflow = new ApprovalWorkflow([policy]);

      const request = await workflow.requestApproval('phase1', 'test-gate', 'pipeline');

      expect(request.expiresAt).toBeDefined();
      expect(request.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('Approve Approval', () => {
    it('should approve a pending request', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      const result = await workflow.approve(request.id, 'user');

      expect(result.success).toBe(true);

      const updated = workflow.getRequest(request.id);
      expect(updated!.status).toBe('approved');
      expect(updated!.approvedAt).toBeDefined();
    });

    it('should allow approver to add comments when approving', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      await workflow.approve(request.id, 'user', { comments: 'Looks good!' });

      const updated = workflow.getRequest(request.id);
      expect(updated!.comments).toBe('Looks good!');
    });

    it('should reject approval for non-existent request', async () => {
      const workflow = new ApprovalWorkflow();

      const result = await workflow.approve('non-existent-id', 'user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject approval for already approved request', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      await workflow.approve(request.id, 'user');

      const result = await workflow.approve(request.id, 'user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already approved');
    });

    it('should reject if wrong approver tries to approve', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      const result = await workflow.approve(request.id, 'wrong-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only user can approve');
    });

    it('should reject expired approval requests', async () => {
      const workflow = new ApprovalWorkflow();

      // Create a request that expires immediately
      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline', {
        expiresAt: Date.now() - 1000,
      });

      const result = await workflow.approve(request.id, 'user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('Reject Approval', () => {
    it('should reject a pending request', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      const result = await workflow.reject(request.id, 'user', 'Needs more work');

      expect(result.success).toBe(true);

      const updated = workflow.getRequest(request.id);
      expect(updated!.status).toBe('rejected');
      expect(updated!.rejectedAt).toBeDefined();
      expect(updated!.comments).toBe('Needs more work');
    });

    it('should reject rejection for non-existent request', async () => {
      const workflow = new ApprovalWorkflow();

      const result = await workflow.reject('non-existent-id', 'user', 'reason');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject if wrong approver tries to reject', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      const result = await workflow.reject(request.id, 'wrong-user', 'reason');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only user can reject');
    });
  });

  describe('Revoke Approval', () => {
    it('should revoke a pending request', () => {
      const workflow = new ApprovalWorkflow();

      workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      const pendingRequests = workflow.getPendingRequests();
      const requestId = pendingRequests[0].id;

      const result = workflow.revoke(requestId);

      expect(result.success).toBe(true);

      const updated = workflow.getRequest(requestId);
      expect(updated!.status).toBe('revoked');
    });

    it('should reject revoke for already approved request', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      await workflow.approve(request.id, 'user');

      const result = workflow.revoke(request.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot revoke');
    });
  });

  describe('Policy Management', () => {
    it('should use default policies', () => {
      const workflow = new ApprovalWorkflow();

      const discussPolicy = workflow.getPolicy('gate-discuss-complete');
      const planPolicy = workflow.getPolicy('gate-plan-complete');
      const executePolicy = workflow.getPolicy('gate-execute-complete');

      expect(discussPolicy).toBeDefined();
      expect(discussPolicy!.requireApproval).toBe(true);
      expect(planPolicy).toBeDefined();
      expect(planPolicy!.requireApproval).toBe(true);
      expect(executePolicy).toBeDefined();
      expect(executePolicy!.requireApproval).toBe(false);
    });

    it('should override default policy with custom policy', () => {
      const customPolicy: ApprovalPolicy = {
        gateId: 'gate-discuss-complete',
        requireApproval: false,
        approvers: [],
      };

      const workflow = new ApprovalWorkflow([customPolicy]);

      const policy = workflow.getPolicy('gate-discuss-complete');

      expect(policy!.requireApproval).toBe(false);
    });

    it('should add new policy', () => {
      const workflow = new ApprovalWorkflow();

      const newPolicy: ApprovalPolicy = {
        gateId: 'custom-gate',
        requireApproval: true,
        approvers: ['admin'],
      };

      workflow.setPolicy(newPolicy);

      const policy = workflow.getPolicy('custom-gate');

      expect(policy).toBeDefined();
      expect(policy!.requireApproval).toBe(true);
      expect(policy!.approvers).toContain('admin');
    });
  });

  describe('Pending Requests', () => {
    it('should get all pending requests', async () => {
      const workflow = new ApprovalWorkflow();

      await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      await workflow.requestApproval('phase2', 'gate-discuss-complete', 'pipeline');
      await workflow.requestApproval('phase3', 'gate-discuss-complete', 'pipeline');

      const pending = workflow.getPendingRequests();

      expect(pending).toHaveLength(3);
      expect(pending.every(r => r.status === 'pending')).toBe(true);
    });

    it('should get pending requests for specific approver', async () => {
      const workflow = new ApprovalWorkflow();

      await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      await workflow.requestApproval('phase2', 'gate-plan-complete', 'pipeline');
      await workflow.requestApproval('phase3', 'gate-verify-complete', 'pipeline');

      const pendingForUser = workflow.getPendingForApprover('user');

      expect(pendingForUser.length).toBeGreaterThan(0);
      expect(pendingForUser.every(r => r.approver === 'user')).toBe(true);
    });

    it('should not include approved/rejected in pending requests', async () => {
      const workflow = new ApprovalWorkflow();

      const req1 = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      const req2 = await workflow.requestApproval('phase2', 'gate-discuss-complete', 'pipeline');
      const req3 = await workflow.requestApproval('phase3', 'gate-discuss-complete', 'pipeline');

      await workflow.approve(req1.id, 'user');
      await workflow.reject(req2.id, 'user', 'rejected');

      const pending = workflow.getPendingRequests();

      expect(pending.some(r => r.id === req1.id)).toBe(false);
      expect(pending.some(r => r.id === req2.id)).toBe(false);
      expect(pending.some(r => r.id === req3.id)).toBe(true);
    });
  });

  describe('Cleanup Expired', () => {
    it('should revoke expired requests', async () => {
      const workflow = new ApprovalWorkflow();

      // Create requests that will expire
      await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline', {
        expiresAt: Date.now() - 1000,
      });
      await workflow.requestApproval('phase2', 'gate-discuss-complete', 'pipeline', {
        expiresAt: Date.now() - 2000,
      });
      await workflow.requestApproval('phase3', 'gate-discuss-complete', 'pipeline', {
        expiresAt: Date.now() + 60000, // Not expired
      });

      const count = workflow.cleanupExpired();

      expect(count).toBe(2);

      const pending = workflow.getPendingRequests();
      expect(pending).toHaveLength(1);
      expect(pending[0].phaseId).toBe('phase3');
    });
  });

  describe('Audit Log', () => {
    it('should generate audit log for approval lifecycle', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      await workflow.approve(request.id, 'user', { comments: 'Approved!' });

      const auditLog = workflow.getAuditLog();

      expect(auditLog.length).toBe(2);

      expect(auditLog[0].action).toContain('requested by');
      expect(auditLog[0].phaseId).toBe('phase1');

      expect(auditLog[1].action).toBe('approved');
      expect(auditLog[1].actor).toBe('user');
    });

    it('should include rejection in audit log', async () => {
      const workflow = new ApprovalWorkflow();

      const request = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');
      await workflow.reject(request.id, 'user', 'Not ready');

      const auditLog = workflow.getAuditLog();

      expect(auditLog.some(entry => entry.action === 'rejected')).toBe(true);
    });

    it('should sort audit log by timestamp', async () => {
      const workflow = new ApprovalWorkflow();

      const request1 = await workflow.requestApproval('phase1', 'gate-discuss-complete', 'pipeline');

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const request2 = await workflow.requestApproval('phase2', 'gate-discuss-complete', 'pipeline');

      const auditLog = workflow.getAuditLog();

      expect(auditLog[0].timestamp).toBeLessThan(auditLog[1].timestamp);
    });
  });
});
