/**
 * Deliverable Checker
 *
 * Validates that phase deliverables meet defined criteria.
 * Used by stage gates to determine if a phase can advance.
 */

export interface Deliverable {
  id: string;
  name: string;
  type: "file" | "test" | "documentation" | "artifact";
  path?: string;
  criteria: DeliverableCriterion[];
  verified: boolean;
  verifiedAt?: number;
  verifiedBy?: string;
  notes?: string;
}

export interface DeliverableCriterion {
  id: string;
  description: string;
  check: () => boolean | Promise<boolean>;
  severity: "required" | "optional";
}

export interface DeliverableCheckResult {
  deliverable: Deliverable;
  passed: boolean;
  failedCriteria: DeliverableCriterion[];
  checkedAt: number;
}

export class DeliverableChecker {
  private deliverables: Map<string, Deliverable> = new Map();

  register(deliverable: Omit<Deliverable, "verified" | "verifiedAt" | "verifiedBy">): void {
    this.deliverables.set(deliverable.id, {
      ...deliverable,
      verified: false,
    });
  }

  get(id: string): Deliverable | undefined {
    return this.deliverables.get(id);
  }

  getAll(): Deliverable[] {
    return Array.from(this.deliverables.values());
  }

  getByPhase(phaseId: string): Deliverable[] {
    return this.getAll().filter(d => d.path?.includes(phaseId));
  }

  async check(id: string): Promise<DeliverableCheckResult | null> {
    const deliverable = this.deliverables.get(id);
    if (!deliverable) return null;

    const failedCriteria: DeliverableCriterion[] = [];

    for (const criterion of deliverable.criteria) {
      try {
        const result = await criterion.check();
        if (!result && criterion.severity === "required") {
          failedCriteria.push(criterion);
        }
      } catch {
        if (criterion.severity === "required") {
          failedCriteria.push(criterion);
        }
      }
    }

    const passed = failedCriteria.length === 0;

    if (passed) {
      deliverable.verified = true;
      deliverable.verifiedAt = Date.now();
    }

    return {
      deliverable,
      passed,
      failedCriteria,
      checkedAt: Date.now(),
    };
  }

  async checkAll(phaseId?: string): Promise<DeliverableCheckResult[]> {
    const deliverables = phaseId ? this.getByPhase(phaseId) : this.getAll();
    const results: DeliverableCheckResult[] = [];

    for (const d of deliverables) {
      const result = await this.check(d.id);
      if (result) results.push(result);
    }

    return results;
  }

  getSummary(): {
    total: number;
    verified: number;
    pending: number;
    passRate: number;
  } {
    const all = this.getAll();
    const verified = all.filter(d => d.verified).length;

    return {
      total: all.length,
      verified,
      pending: all.length - verified,
      passRate: all.length > 0 ? Math.round((verified / all.length) * 100) : 0,
    };
  }
}
