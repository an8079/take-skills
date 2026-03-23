/**
 * Phase State Machine
 *
 * Defines valid states and transitions for project phases.
 * Inspired by get-shit-done's discuss → plan → execute → verify cycle,
 * but with explicit state governance and gate controls.
 */

export type PhaseStatus =
  | "draft"           // Phase defined but not started
  | "discussing"      // Capturing implementation decisions
  | "planned"         // Research + plan complete, ready for execution
  | "executing"       // Implementation in progress
  | "verifying"       // Verification and testing in progress
  | "blocked"         // Phase blocked by issues or dependencies
  | "completed"       // Phase verified and closed
  | "archived";       // Phase archived after milestone completion

export type TransitionEvent =
  | "START_DISCUSS"
  | "END_DISCUSS"
  | "START_PLAN"
  | "END_PLAN"
  | "START_EXECUTE"
  | "END_EXECUTE"
  | "START_VERIFY"
  | "END_VERIFY"
  | "BLOCK"
  | "UNBLOCK"
  | "ARCHIVE";

export interface StateTransition {
  from: PhaseStatus;
  to: PhaseStatus;
  event: TransitionEvent;
  guard?: () => boolean | Promise<boolean>;
  onTransition?: () => void | Promise<void>;
}

const VALID_TRANSITIONS: StateTransition[] = [
  // Draft → Discuss
  { from: "draft", to: "discussing", event: "START_DISCUSS" },

  // Discuss → Planned
  { from: "discussing", to: "planned", event: "END_DISCUSS" },

  // Planned → Executing
  { from: "planned", to: "executing", event: "START_EXECUTE" },

  // Executing → Verifying
  { from: "executing", to: "verifying", event: "END_EXECUTE" },

  // Verifying → Completed
  { from: "verifying", to: "completed", event: "END_VERIFY" },

  // Any active state → Blocked
  { from: "discussing", to: "blocked", event: "BLOCK" },
  { from: "planned", to: "blocked", event: "BLOCK" },
  { from: "executing", to: "blocked", event: "BLOCK" },
  { from: "verifying", to: "blocked", event: "BLOCK" },

  // Blocked → Resume previous state
  { from: "blocked", to: "discussing", event: "UNBLOCK", guard: () => false }, // Must specify target
  { from: "blocked", to: "planned", event: "UNBLOCK", guard: () => false },
  { from: "blocked", to: "executing", event: "UNBLOCK", guard: () => false },
  { from: "blocked", to: "verifying", event: "UNBLOCK", guard: () => false },

  // Completed → Archived
  { from: "completed", to: "archived", event: "ARCHIVE" },

  // Draft → Archived (for unused phases)
  { from: "draft", to: "archived", event: "ARCHIVE" },
];

export interface StateMachineContext {
  currentStatus: PhaseStatus;
  previousStatus?: PhaseStatus;
  blockedAt?: number;
  transitionHistory: Array<{
    from: PhaseStatus;
    to: PhaseStatus;
    event: TransitionEvent;
    timestamp: number;
  }>;
}

export class PhaseStateMachine {
  private context: StateMachineContext;

  constructor(initialStatus: PhaseStatus = "draft") {
    this.context = {
      currentStatus: initialStatus,
      transitionHistory: [],
    };
  }

  getStatus(): PhaseStatus {
    return this.context.currentStatus;
  }

  getHistory(): StateMachineContext["transitionHistory"] {
    return [...this.context.transitionHistory];
  }

  canTransition(event: TransitionEvent, targetStatus?: PhaseStatus): boolean {
    const transitions = this.getValidTransitions(event);
    if (transitions.length === 0) return false;

    if (targetStatus) {
      return transitions.some(t => t.to === targetStatus);
    }

    return transitions.length === 1 && transitions[0].to !== undefined;
  }

  getValidTransitions(event: TransitionEvent): StateTransition[] {
    return VALID_TRANSITIONS.filter(
      t => t.from === this.context.currentStatus && t.event === event
    );
  }

  async transition(
    event: TransitionEvent,
    targetStatus?: PhaseStatus,
    options?: { guard?: () => boolean | Promise<boolean> }
  ): Promise<{ success: boolean; error?: string }> {
    const transitions = this.getValidTransitions(event);

    if (transitions.length === 0) {
      return {
        success: false,
        error: `Invalid transition: ${event} from ${this.context.currentStatus}`,
      };
    }

    let transition: StateTransition;

    if (targetStatus) {
      transition = transitions.find(t => t.to === targetStatus)!;
      if (!transition) {
        return {
          success: false,
          error: `Cannot transition to ${targetStatus} via ${event}`,
        };
      }
    } else if (transitions.length === 1) {
      transition = transitions[0];
    } else {
      return {
        success: false,
        error: `Ambiguous transition: specify target status`,
      };
    }

    if (transition.guard) {
      const guardResult = await transition.guard();
      if (!guardResult) {
        return { success: false, error: "Transition guard failed" };
      }
    }

    if (options?.guard) {
      const guardResult = await options.guard();
      if (!guardResult) {
        return { success: false, error: "Custom guard failed" };
      }
    }

    const previousStatus = this.context.currentStatus;
    this.context.previousStatus = previousStatus;
    this.context.currentStatus = transition.to;

    this.context.transitionHistory.push({
      from: previousStatus,
      to: transition.to,
      event,
      timestamp: Date.now(),
    });

    if (transition.onTransition) {
      await transition.onTransition();
    }

    return { success: true };
  }

  isActive(): boolean {
    return ["discussing", "planned", "executing", "verifying"].includes(
      this.context.currentStatus
    );
  }

  isBlocked(): boolean {
    return this.context.currentStatus === "blocked";
  }

  isCompleted(): boolean {
    return this.context.currentStatus === "completed";
  }

  getBlockingInfo(): { blockedAt?: number; duration?: number } {
    if (this.context.currentStatus !== "blocked") {
      return {};
    }
    return {
      blockedAt: this.context.blockedAt,
      duration: this.context.blockedAt
        ? Date.now() - this.context.blockedAt
        : undefined,
    };
  }
}

export function createPhaseStateMachine(initialStatus?: PhaseStatus): PhaseStateMachine {
  return new PhaseStateMachine(initialStatus);
}

export { VALID_TRANSITIONS };
