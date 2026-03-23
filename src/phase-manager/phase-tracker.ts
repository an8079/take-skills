/**
 * Phase Tracker
 *
 * Tracks progress across all phases in a project.
 * Maintains state, history, and dependencies between phases.
 */

import { PhaseStateMachine, type PhaseStatus, type TransitionEvent } from "./state-machine.js";

export interface Phase {
  id: string;
  number: number;
  name: string;
  description: string;
  status: PhaseStatus;
  stateMachine: PhaseStateMachine;
  context?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  milestones: string[];
}

export interface PhaseTransitionRecord {
  phaseId: string;
  from: PhaseStatus;
  to: PhaseStatus;
  event: TransitionEvent;
  timestamp: number;
  user?: string;
}

export interface PhaseDependencies {
  phaseId: string;
  blockedBy: string[];
  blocks: string[];
}

export interface ProjectPhaseState {
  phases: Phase[];
  currentPhaseId: string | null;
  completedMilestones: string[];
  transitionHistory: PhaseTransitionRecord[];
  dependencies: PhaseDependencies[];
}

export class PhaseTracker {
  private state: ProjectPhaseState;

  constructor() {
    this.state = {
      phases: [],
      currentPhaseId: null,
      completedMilestones: [],
      transitionHistory: [],
      dependencies: [],
    };
  }

  addPhase(name: string, description: string, afterPhaseId?: string): Phase {
    const id = `phase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const number = this.state.phases.length + 1;

    const phase: Phase = {
      id,
      number,
      name,
      description,
      status: "draft",
      stateMachine: new PhaseStateMachine("draft"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      milestones: [],
    };

    this.state.phases.push(phase);

    if (afterPhaseId) {
      this.addDependency(afterPhaseId, id);
    }

    return phase;
  }

  getPhase(id: string): Phase | undefined {
    return this.state.phases.find(p => p.id === id);
  }

  getPhaseByNumber(number: number): Phase | undefined {
    return this.state.phases.find(p => p.number === number);
  }

  getAllPhases(): Phase[] {
    return [...this.state.phases];
  }

  getCurrentPhase(): Phase | null {
    if (!this.state.currentPhaseId) return null;
    return this.getPhase(this.state.currentPhaseId) || null;
  }

  setCurrentPhase(id: string): boolean {
    const phase = this.getPhase(id);
    if (!phase) return false;
    this.state.currentPhaseId = id;
    return true;
  }

  async transitionPhase(
    id: string,
    event: TransitionEvent,
    options?: { targetStatus?: PhaseStatus; user?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const phase = this.getPhase(id);
    if (!phase) {
      return { success: false, error: `Phase ${id} not found` };
    }

    const result = await phase.stateMachine.transition(event, options?.targetStatus);

    if (result.success) {
      phase.status = phase.stateMachine.getStatus();
      phase.updatedAt = Date.now();

      if (phase.status === "completed") {
        phase.completedAt = Date.now();
      }

      this.state.transitionHistory.push({
        phaseId: id,
        from: phase.stateMachine.getHistory()[phase.stateMachine.getHistory().length - 1]?.from || "draft",
        to: phase.status,
        event,
        timestamp: Date.now(),
        user: options?.user,
      });

      if (this.state.currentPhaseId === id && phase.status === "completed") {
        const nextPhase = this.getPhaseByNumber(phase.number + 1);
        this.state.currentPhaseId = nextPhase?.id || null;
      }
    }

    return result;
  }

  addDependency(blockerId: string, blockedId: string): void {
    const existing = this.state.dependencies.find(d => d.phaseId === blockedId);
    if (existing) {
      if (!existing.blockedBy.includes(blockerId)) {
        existing.blockedBy.push(blockerId);
      }
    } else {
      this.state.dependencies.push({
        phaseId: blockedId,
        blockedBy: [blockerId],
        blocks: [],
      });
    }

    const blocker = this.state.dependencies.find(d => d.phaseId === blockerId);
    if (blocker) {
      if (!blocker.blocks.includes(blockedId)) {
        blocker.blocks.push(blockedId);
      }
    } else {
      this.state.dependencies.push({
        phaseId: blockerId,
        blockedBy: [],
        blocks: [blockedId],
      });
    }
  }

  getBlockingPhases(id: string): string[] {
    const dep = this.state.dependencies.find(d => d.phaseId === id);
    return dep?.blockedBy || [];
  }

  getBlockedPhases(id: string): string[] {
    const dep = this.state.dependencies.find(d => d.phaseId === id);
    return dep?.blocks || [];
  }

  canStartPhase(id: string): { allowed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const blockingPhases = this.getBlockingPhases(id);

    for (const blockerId of blockingPhases) {
      const blocker = this.getPhase(blockerId);
      if (blocker && !blocker.stateMachine.isCompleted()) {
        reasons.push(`Phase ${blocker.number} (${blocker.name}) is not completed`);
      }
    }

    return {
      allowed: reasons.length === 0,
      reasons,
    };
  }

  getProgress(): {
    total: number;
    completed: number;
    active: number;
    blocked: number;
    draft: number;
    percentComplete: number;
  } {
    const total = this.state.phases.length;
    const completed = this.state.phases.filter(p => p.stateMachine.isCompleted()).length;
    const active = this.state.phases.filter(p => p.stateMachine.isActive()).length;
    const blocked = this.state.phases.filter(p => p.stateMachine.isBlocked()).length;
    const draft = this.state.phases.filter(p => p.status === "draft").length;

    return {
      total,
      completed,
      active,
      blocked,
      draft,
      percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  getTransitionHistory(): PhaseTransitionRecord[] {
    return [...this.state.transitionHistory];
  }

  serialize(): ProjectPhaseState {
    return JSON.parse(JSON.stringify(this.state));
  }

  static deserialize(data: ProjectPhaseState): PhaseTracker {
    const tracker = new PhaseTracker();
    tracker.state = data;
    for (const phase of tracker.state.phases) {
      phase.stateMachine = new PhaseStateMachine(phase.status);
    }
    return tracker;
  }
}
