/**
 * Approval Workflow
 *
 * Manages approval requests and signatures for phase transitions.
 * Provides audit trail and accountability.
 */

export type ApprovalStatus = "pending" | "approved" | "rejected" | "revoked";

export interface ApprovalRequest {
  id: string;
  phaseId: string;
  gateId: string;
  type: "auto" | "manual";
  status: ApprovalStatus;
  requestedAt: number;
  requestedBy: string;
  approver?: string;
  approvedAt?: number;
  rejectedAt?: number;
  comments?: string;
  expiresAt?: number;
}

export interface ApprovalPolicy {
  gateId: string;
  requireApproval: boolean;
  approvers: string[];
  autoApproveIf?: {
    criteria: string;
    check: () => boolean | Promise<boolean>;
  }[];
  timeoutMinutes?: number;
  requireComments?: boolean;
}

const DEFAULT_APPROVAL_POLICIES: ApprovalPolicy[] = [
  {
    gateId: "gate-discuss-complete",
    requireApproval: true,
    approvers: ["user"],
    timeoutMinutes: 60 * 24, // 24 hours
    requireComments: false,
  },
  {
    gateId: "gate-plan-complete",
    requireApproval: true,
    approvers: ["user"],
    timeoutMinutes: 60 * 24,
    requireComments: false,
  },
  {
    gateId: "gate-execute-complete",
    requireApproval: false,
    approvers: [],
    autoApproveIf: [
      {
        criteria: "all plans committed",
        check: () => false,
      },
    ],
  },
  {
    gateId: "gate-verify-complete",
    requireApproval: true,
    approvers: ["user"],
    timeoutMinutes: 60 * 24 * 7, // 7 days for UAT
    requireComments: true,
  },
];

export class ApprovalWorkflow {
  private requests: Map<string, ApprovalRequest> = new Map();
  private policies: Map<string, ApprovalPolicy> = new Map();

  constructor(policies?: ApprovalPolicy[]) {
    for (const policy of DEFAULT_APPROVAL_POLICIES) {
      this.policies.set(policy.gateId, policy);
    }
    if (policies) {
      for (const policy of policies) {
        this.policies.set(policy.gateId, policy);
      }
    }
  }

  setPolicy(policy: ApprovalPolicy): void {
    this.policies.set(policy.gateId, policy);
  }

  getPolicy(gateId: string): ApprovalPolicy | undefined {
    return this.policies.get(gateId);
  }

  async requestApproval(
    phaseId: string,
    gateId: string,
    requestedBy: string,
    options?: { approver?: string; expiresAt?: number }
  ): Promise<ApprovalRequest> {
    const policy = this.policies.get(gateId);

    if (!policy?.requireApproval) {
      return this.createRequest(phaseId, gateId, "auto", requestedBy, options?.expiresAt);
    }

    return this.createRequest(
      phaseId,
      gateId,
      "manual",
      requestedBy,
      options?.expiresAt || (policy.timeoutMinutes ? Date.now() + policy.timeoutMinutes * 60 * 1000 : undefined),
      options?.approver || policy.approvers[0]
    );
  }

  private createRequest(
    phaseId: string,
    gateId: string,
    type: "auto" | "manual",
    requestedBy: string,
    expiresAt?: number,
    approver?: string
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      phaseId,
      gateId,
      type,
      status: "pending",
      requestedAt: Date.now(),
      requestedBy,
      approver,
      expiresAt,
    };

    this.requests.set(request.id, request);
    return request;
  }

  getRequest(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  getRequestsForPhase(phaseId: string): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter(r => r.phaseId === phaseId);
  }

  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter(r => r.status === "pending");
  }

  getPendingForApprover(approver: string): ApprovalRequest[] {
    return this.getPendingRequests().filter(r => r.approver === approver);
  }

  async approve(
    id: string,
    approver: string,
    options?: { comments?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const request = this.requests.get(id);

    if (!request) {
      return { success: false, error: "Approval request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: `Request is already ${request.status}` };
    }

    if (request.approver && request.approver !== approver) {
      return { success: false, error: `Only ${request.approver} can approve this request` };
    }

    if (request.expiresAt && Date.now() > request.expiresAt) {
      request.status = "revoked";
      return { success: false, error: "Approval request has expired" };
    }

    request.status = "approved";
    request.approvedAt = Date.now();
    request.comments = options?.comments;

    return { success: true };
  }

  async reject(
    id: string,
    approver: string,
    comments: string
  ): Promise<{ success: boolean; error?: string }> {
    const request = this.requests.get(id);

    if (!request) {
      return { success: false, error: "Approval request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: `Request is already ${request.status}` };
    }

    if (request.approver && request.approver !== approver) {
      return { success: false, error: `Only ${request.approver} can reject this request` };
    }

    request.status = "rejected";
    request.rejectedAt = Date.now();
    request.comments = comments;

    return { success: true };
  }

  revoke(id: string): { success: boolean; error?: string } {
    const request = this.requests.get(id);

    if (!request) {
      return { success: false, error: "Approval request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: `Cannot revoke a ${request.status} request` };
    }

    request.status = "revoked";
    return { success: true };
  }

  cleanupExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const request of this.requests.values()) {
      if (request.status === "pending" && request.expiresAt && request.expiresAt < now) {
        request.status = "revoked";
        count++;
      }
    }

    return count;
  }

  getAuditLog(): Array<{
    id: string;
    phaseId: string;
    gateId: string;
    action: string;
    timestamp: number;
    actor: string;
  }> {
    const log: Array<{
      id: string;
      phaseId: string;
      gateId: string;
      action: string;
      timestamp: number;
      actor: string;
    }> = [];

    for (const request of this.requests.values()) {
      log.push({
        id: request.id,
        phaseId: request.phaseId,
        gateId: request.gateId,
        action: `requested by ${request.requestedBy}`,
        timestamp: request.requestedAt,
        actor: request.requestedBy,
      });

      if (request.approvedAt) {
        log.push({
          id: request.id,
          phaseId: request.phaseId,
          gateId: request.gateId,
          action: "approved",
          timestamp: request.approvedAt,
          actor: request.approver || "unknown",
        });
      }

      if (request.rejectedAt) {
        log.push({
          id: request.id,
          phaseId: request.phaseId,
          gateId: request.gateId,
          action: "rejected",
          timestamp: request.rejectedAt,
          actor: request.approver || "unknown",
        });
      }
    }

    return log.sort((a, b) => a.timestamp - b.timestamp);
  }
}
