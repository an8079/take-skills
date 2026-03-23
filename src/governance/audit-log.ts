/**
 * Audit Log
 *
 * Immutable record of all governance decisions and process events.
 * Provides accountability and traceability.
 */

export interface AuditEntry {
  id: string;
  timestamp: number;
  category: "phase" | "approval" | "gate" | "violation" | "config";
  action: string;
  actor: string;
  phaseId?: string;
  details: Record<string, unknown>;
  metadata?: {
    ip?: string;
    sessionId?: string;
    userAgent?: string;
  };
}

export class AuditLog {
  private entries: AuditEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 10000) {
    this.maxEntries = maxEntries;
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  log(
    category: AuditEntry["category"],
    action: string,
    actor: string,
    details: Record<string, unknown> = {},
    options?: { phaseId?: string; metadata?: AuditEntry["metadata"] }
  ): AuditEntry {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      action,
      actor,
      phaseId: options?.phaseId,
      details,
      metadata: options?.metadata,
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    return entry;
  }

  getEntries(filters?: {
    category?: AuditEntry["category"];
    phaseId?: string;
    actor?: string;
    fromTimestamp?: number;
    toTimestamp?: number;
  }): AuditEntry[] {
    return this.entries.filter(entry => {
      if (filters?.category && entry.category !== filters.category) return false;
      if (filters?.phaseId && entry.phaseId !== filters.phaseId) return false;
      if (filters?.actor && entry.actor !== filters.actor) return false;
      if (filters?.fromTimestamp && entry.timestamp < filters.fromTimestamp) return false;
      if (filters?.toTimestamp && entry.timestamp > filters.toTimestamp) return false;
      return true;
    });
  }

  getPhaseHistory(phaseId: string): AuditEntry[] {
    return this.getEntries({ phaseId });
  }

  getRecentEntries(count: number = 100): AuditEntry[] {
    return this.entries.slice(-count);
  }

  search(query: string): AuditEntry[] {
    const lower = query.toLowerCase();
    return this.entries.filter(entry => {
      return (
        entry.action.toLowerCase().includes(lower) ||
        JSON.stringify(entry.details).toLowerCase().includes(lower)
      );
    });
  }

  export(): AuditEntry[] {
    return JSON.parse(JSON.stringify(this.entries));
  }

  import(entries: AuditEntry[]): void {
    this.entries = [...this.entries, ...entries].slice(-this.maxEntries);
  }

  clear(): void {
    this.entries = [];
  }

  size(): number {
    return this.entries.length;
  }
}
