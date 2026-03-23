/**
 * Mode Context
 *
 * Runtime context for governance mode management.
 * Handles mode transitions, validation, and persistence.
 */

import {
  type GovernanceMode,
  type ModeConfig,
  type GateStrictness,
  type PhaseName,
  getMode,
  isValidMode,
  GOVERNANCE_MODES,
} from "./modes.js";

export interface ModeTransitionEvent {
  fromMode: GovernanceMode | null;
  toMode: GovernanceMode;
  reason: string;
  timestamp: number;
  actor: string;
}

export interface ModeContextOptions {
  initialMode?: GovernanceMode;
  allowDynamicSwitch?: boolean;
  persistMode?: boolean;
  onModeChange?: (event: ModeTransitionEvent) => void;
}

const DEFAULT_OPTIONS: Required<ModeContextOptions> = {
  initialMode: "standard",
  allowDynamicSwitch: true,
  persistMode: true,
  onModeChange: () => {},
};

export class ModeContext {
  private currentMode: ModeConfig;
  private options: Required<ModeContextOptions>;
  private transitionHistory: ModeTransitionEvent[] = [];
  private gateCache: Map<string, GateStrictness> = new Map();

  constructor(options: ModeContextOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.currentMode = getMode(this.options.initialMode);
    this.buildGateCache();
    this.restorePersistedMode();
  }

  // -------------------------------------------------------------------------
  // Mode Access
  // -------------------------------------------------------------------------

  getMode(): GovernanceMode {
    return this.currentMode.id;
  }

  getModeConfig(): ModeConfig {
    return { ...this.currentMode, gates: { ...this.currentMode.gates } };
  }

  getGates(): Record<PhaseName, GateStrictness> {
    return { ...this.currentMode.gates } as Record<PhaseName, GateStrictness>;
  }

  getGateForPhase(phase: PhaseName): GateStrictness {
    const cached = this.gateCache.get(phase);
    if (cached) return cached;
    return this.currentMode.gates[phase] ?? "none";
  }

  isGateEnabled(phase: PhaseName): boolean {
    const strictness = this.getGateForPhase(phase);
    return strictness === "required" || strictness === "warning";
  }

  isGateBlocking(phase: PhaseName): boolean {
    return this.getGateForPhase(phase) === "required";
  }

  // -------------------------------------------------------------------------
  // Artifact Checks
  // -------------------------------------------------------------------------

  getRequiredArtifacts(): string[] {
    return this.currentMode.artifacts.minRequired.map(a => a.id);
  }

  isArtifactRequired(id: string): boolean {
    return this.currentMode.artifacts.minRequired.some(a => a.id === id);
  }

  getOptionalArtifacts(): string[] {
    return this.currentMode.artifacts.optional.map(a => a.id);
  }

  // -------------------------------------------------------------------------
  // Audit Configuration
  // -------------------------------------------------------------------------

  isAuditEnabled(): boolean {
    return this.currentMode.audit.enabled;
  }

  shouldLogPhaseTransitions(): boolean {
    return this.currentMode.audit.logPhaseTransitions;
  }

  shouldLogApprovals(): boolean {
    return this.currentMode.audit.logApprovals;
  }

  shouldLogGateViolations(): boolean {
    return this.currentMode.audit.logGateViolations;
  }

  shouldLogConfigChanges(): boolean {
    return this.currentMode.audit.logConfigChanges;
  }

  shouldLogTeamEvents(): boolean {
    return this.currentMode.audit.logTeamEvents;
  }

  // -------------------------------------------------------------------------
  // Security Configuration
  // -------------------------------------------------------------------------

  isSecurityEnabled(): boolean {
    return this.currentMode.security.enabled;
  }

  requiresCodeSignoff(): boolean {
    return this.currentMode.security.requireCodeSignoff;
  }

  requiresSecurityReview(): boolean {
    return this.currentMode.security.requireSecurityReview;
  }

  blocksOnVulnerabilities(): boolean {
    return this.currentMode.security.blockOnVulnerabilities;
  }

  // -------------------------------------------------------------------------
  // Team Features
  // -------------------------------------------------------------------------

  isTeamFeaturesEnabled(): boolean {
    return this.currentMode.teamFeatures.enabled;
  }

  supportsMultiAgentCoordination(): boolean {
    return this.currentMode.teamFeatures.multiAgentCoordination;
  }

  enforcesRoles(): boolean {
    return this.currentMode.teamFeatures.roleEnforcement;
  }

  hasApprovalWorkflows(): boolean {
    return this.currentMode.teamFeatures.approvalWorkflows;
  }

  hasAutoEscalation(): boolean {
    return this.currentMode.teamFeatures.autoEscalation;
  }

  // -------------------------------------------------------------------------
  // Process Configuration
  // -------------------------------------------------------------------------

  allowsSkipPhases(): boolean {
    return this.currentMode.process.allowSkipPhases;
  }

  getMaxActivePhases(): number {
    return this.currentMode.process.maxActivePhases;
  }

  isAutoAdvanceEnabled(): boolean {
    return this.currentMode.process.autoAdvance;
  }

  requiresExplicitComplete(): boolean {
    return this.currentMode.process.requireExplicitComplete;
  }

  // -------------------------------------------------------------------------
  // Mode Transitions
  // -------------------------------------------------------------------------

  canSwitchMode(): boolean {
    return this.options.allowDynamicSwitch;
  }

  switchMode(newMode: GovernanceMode, reason: string = "", actor: string = "system"): boolean {
    if (!this.options.allowDynamicSwitch) {
      return false;
    }

    if (!isValidMode(newMode)) {
      return false;
    }

    if (newMode === this.currentMode.id) {
      return true;
    }

    const event: ModeTransitionEvent = {
      fromMode: this.currentMode.id,
      toMode: newMode,
      reason,
      timestamp: Date.now(),
      actor,
    };

    this.currentMode = getMode(newMode);
    this.buildGateCache();
    this.transitionHistory.push(event);
    this.options.onModeChange(event);
    this.persistMode();

    return true;
  }

  getTransitionHistory(): ModeTransitionEvent[] {
    return [...this.transitionHistory];
  }

  getLastTransition(): ModeTransitionEvent | null {
    return this.transitionHistory[this.transitionHistory.length - 1] ?? null;
  }

  // -------------------------------------------------------------------------
  // Mode Comparison
  // -------------------------------------------------------------------------

  isMode(mode: GovernanceMode): boolean {
    return this.currentMode.id === mode;
  }

  isAtLeastStrictness(requested: GovernanceMode): boolean {
    const order: GovernanceMode[] = ["lite", "standard", "strict"];
    const currentIndex = order.indexOf(this.currentMode.id);
    const requestedIndex = order.indexOf(requested);
    return currentIndex >= requestedIndex;
  }

  compareModes(other: GovernanceMode): number {
    const order: GovernanceMode[] = ["lite", "standard", "strict"];
    const currentIndex = order.indexOf(this.currentMode.id);
    const otherIndex = order.indexOf(other);
    return currentIndex - otherIndex;
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  getModeSummary(): {
    mode: GovernanceMode;
    name: string;
    description: string;
    gateCount: number;
    requiredArtifactCount: number;
    auditEnabled: boolean;
    securityEnabled: boolean;
    teamFeaturesEnabled: boolean;
  } {
    const requiredGates = Object.values(this.currentMode.gates).filter(
      g => g === "required"
    ).length;

    return {
      mode: this.currentMode.id,
      name: this.currentMode.name,
      description: this.currentMode.description,
      gateCount: requiredGates,
      requiredArtifactCount: this.currentMode.artifacts.minRequired.length,
      auditEnabled: this.currentMode.audit.enabled,
      securityEnabled: this.currentMode.security.enabled,
      teamFeaturesEnabled: this.currentMode.teamFeatures.enabled,
    };
  }

  // -------------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------------

  private buildGateCache(): void {
    this.gateCache.clear();
    for (const [phase, strictness] of Object.entries(this.currentMode.gates)) {
      this.gateCache.set(phase, strictness as GateStrictness);
    }
  }

  private persistMode(): void {
    if (!this.options.persistMode) return;
    try {
      localStorage.setItem("governance-mode", this.currentMode.id);
    } catch {
      // Storage not available
    }
  }

  private restorePersistedMode(): void {
    if (!this.options.persistMode) return;
    try {
      const stored = localStorage.getItem("governance-mode");
      if (stored && isValidMode(stored)) {
        this.currentMode = getMode(stored);
        this.buildGateCache();
      }
    } catch {
      // Storage not available or corrupted
    }
  }

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------

  toJSON(): object {
    return {
      currentMode: this.currentMode.id,
      transitionHistory: this.transitionHistory,
      options: {
        allowDynamicSwitch: this.options.allowDynamicSwitch,
        persistMode: this.options.persistMode,
      },
    };
  }

  static fromJSON(data: ReturnType<ModeContext["toJSON"]>): ModeContext {
    const parsed = data as {
      currentMode: GovernanceMode;
      transitionHistory: ModeTransitionEvent[];
      options: Partial<ModeContextOptions>;
    };

    const context = new ModeContext({
      initialMode: parsed.currentMode,
      ...parsed.options,
      onModeChange: () => {},
    });

    context.transitionHistory = parsed.transitionHistory ?? [];
    return context;
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export function createModeContext(mode?: GovernanceMode): ModeContext {
  return new ModeContext({ initialMode: mode ?? "standard" });
}

export function createLiteContext(options?: Partial<ModeContextOptions>): ModeContext {
  return new ModeContext({ initialMode: "lite", ...options });
}

export function createStandardContext(options?: Partial<ModeContextOptions>): ModeContext {
  return new ModeContext({ initialMode: "standard", ...options });
}

export function createStrictContext(options?: Partial<ModeContextOptions>): ModeContext {
  return new ModeContext({ initialMode: "strict", ...options });
}
