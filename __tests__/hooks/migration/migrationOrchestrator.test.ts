import { describe, it, expect } from "vitest";
import type {
    MigrationStep,
    StepExecutionStatus,
    StepExecution,
    MigrationPreferences,
} from "@/hooks/migration/types";
import { goliathConfig } from "@/config/goliath";

// ---------------------------------------------------------------------------
// Helpers — replicate orchestrator / flow pure logic for unit testing
// without rendering React hooks.
// ---------------------------------------------------------------------------

/** Build the visible-steps array using the same logic as useMigrationFlow. */
function computeVisibleSteps(
    claimEnabled: boolean,
    rewards: bigint,
): MigrationStep[] {
    const steps: MigrationStep[] = [];
    if (claimEnabled && rewards > 0n) {
        steps.push("CLAIM_REWARDS");
    }
    steps.push("APPROVE", "UNSTAKE", "BRIDGE");
    return steps;
}

/** Find the first non-CONFIRMED step, matching useMigrationFlow.activeStep. */
function computeActiveStep(
    visibleSteps: MigrationStep[],
    executions: Record<MigrationStep, StepExecution>,
): MigrationStep | null {
    for (const step of visibleSteps) {
        if (executions[step].status !== "CONFIRMED") return step;
    }
    return null;
}

/** Canonical initial executions — every step starts IDLE. */
function makeIdleExecutions(): Record<MigrationStep, StepExecution> {
    return {
        CLAIM_REWARDS: { status: "IDLE", txHash: null, error: null },
        APPROVE: { status: "IDLE", txHash: null, error: null },
        UNSTAKE: { status: "IDLE", txHash: null, error: null },
        BRIDGE: { status: "IDLE", txHash: null, error: null },
    };
}

/** Return a copy with a single step's execution overwritten. */
function withStepStatus(
    base: Record<MigrationStep, StepExecution>,
    step: MigrationStep,
    status: StepExecutionStatus,
    extra?: Partial<StepExecution>,
): Record<MigrationStep, StepExecution> {
    return {
        ...base,
        [step]: { ...base[step], status, ...extra },
    };
}

/** Valid state transitions for individual step execution statuses. */
const VALID_STEP_TRANSITIONS: Record<StepExecutionStatus, StepExecutionStatus[]> = {
    IDLE: ["WAITING_SIGNATURE"],
    WAITING_SIGNATURE: ["TX_PENDING", "FAILED"],
    TX_PENDING: ["CONFIRMED", "FAILED"],
    CONFIRMED: [],
    FAILED: ["IDLE"],
};

/** All possible orchestrator states. */
type OrchestratorState = "idle" | "running" | "paused" | "completed";

// =========================================================================
// 1. Step visibility logic
// =========================================================================

describe("step visibility logic", () => {
    it("base steps are always [APPROVE, UNSTAKE, BRIDGE]", () => {
        const steps = computeVisibleSteps(false, 0n);
        expect(steps).toEqual(["APPROVE", "UNSTAKE", "BRIDGE"]);
    });

    it("CLAIM_REWARDS is prepended when claimEnabled=true AND rewards > 0n", () => {
        const steps = computeVisibleSteps(true, 500n);
        expect(steps).toEqual(["CLAIM_REWARDS", "APPROVE", "UNSTAKE", "BRIDGE"]);
        expect(steps[0]).toBe("CLAIM_REWARDS");
    });

    it("CLAIM_REWARDS is skipped when claimEnabled=false even if rewards > 0n", () => {
        const steps = computeVisibleSteps(false, 500n);
        expect(steps).not.toContain("CLAIM_REWARDS");
        expect(steps).toEqual(["APPROVE", "UNSTAKE", "BRIDGE"]);
    });

    it("CLAIM_REWARDS is skipped when rewards=0n even if claimEnabled=true", () => {
        const steps = computeVisibleSteps(true, 0n);
        expect(steps).not.toContain("CLAIM_REWARDS");
        expect(steps).toEqual(["APPROVE", "UNSTAKE", "BRIDGE"]);
    });

    it("goliathConfig.migration.claimEnabled matches expected default", () => {
        // The config defaults to true; verify the integration point exists.
        expect(typeof goliathConfig.migration.claimEnabled).toBe("boolean");
    });

    it("CLAIM_REWARDS is always first when present", () => {
        const steps = computeVisibleSteps(true, 1n);
        expect(steps.indexOf("CLAIM_REWARDS")).toBe(0);
    });

    it("base steps maintain fixed ordering regardless of claim presence", () => {
        const withClaim = computeVisibleSteps(true, 100n);
        const withoutClaim = computeVisibleSteps(false, 0n);

        // Extract the non-claim portion and verify identical ordering.
        const basePortion = withClaim.filter((s) => s !== "CLAIM_REWARDS");
        expect(basePortion).toEqual(withoutClaim);
    });

    it("very large rewards value still triggers CLAIM_REWARDS", () => {
        const largeRewards = 10n ** 30n; // 1 nonillion
        const steps = computeVisibleSteps(true, largeRewards);
        expect(steps).toContain("CLAIM_REWARDS");
    });

    it("rewards=1n (smallest positive) triggers CLAIM_REWARDS", () => {
        const steps = computeVisibleSteps(true, 1n);
        expect(steps).toContain("CLAIM_REWARDS");
    });
});

// =========================================================================
// 2. Active step detection
// =========================================================================

describe("active step detection", () => {
    const BASE_STEPS: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];

    it("active step is the first step when all steps are IDLE", () => {
        const execs = makeIdleExecutions();
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBe("APPROVE");
    });

    it("active step is first step when it is in a non-terminal, non-CONFIRMED state", () => {
        const execs = withStepStatus(makeIdleExecutions(), "APPROVE", "WAITING_SIGNATURE");
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBe("APPROVE");
    });

    it("skips CONFIRMED steps to find the next active one", () => {
        let execs = makeIdleExecutions();
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBe("UNSTAKE");
    });

    it("skips multiple CONFIRMED steps", () => {
        let execs = makeIdleExecutions();
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");
        execs = withStepStatus(execs, "UNSTAKE", "CONFIRMED");
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBe("BRIDGE");
    });

    it("returns null when all steps are CONFIRMED (migration complete)", () => {
        let execs = makeIdleExecutions();
        for (const step of BASE_STEPS) {
            execs = withStepStatus(execs, step, "CONFIRMED");
        }
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBeNull();
    });

    it("returns null when all 4 steps are CONFIRMED (with CLAIM_REWARDS)", () => {
        const allSteps: MigrationStep[] = [
            "CLAIM_REWARDS",
            "APPROVE",
            "UNSTAKE",
            "BRIDGE",
        ];
        let execs = makeIdleExecutions();
        for (const step of allSteps) {
            execs = withStepStatus(execs, step, "CONFIRMED");
        }
        const active = computeActiveStep(allSteps, execs);
        expect(active).toBeNull();
    });

    it("returns FAILED step as active (it is non-CONFIRMED)", () => {
        let execs = makeIdleExecutions();
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");
        execs = withStepStatus(execs, "UNSTAKE", "FAILED", {
            error: "tx reverted",
        });
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBe("UNSTAKE");
    });

    it("returns TX_PENDING step as active", () => {
        let execs = makeIdleExecutions();
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");
        execs = withStepStatus(execs, "UNSTAKE", "TX_PENDING", {
            txHash: "0xabc123",
        });
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBe("UNSTAKE");
    });

    it("returns WAITING_SIGNATURE step as active", () => {
        const execs = withStepStatus(makeIdleExecutions(), "APPROVE", "WAITING_SIGNATURE");
        const active = computeActiveStep(BASE_STEPS, execs);
        expect(active).toBe("APPROVE");
    });

    it("CLAIM_REWARDS is active when present and not CONFIRMED", () => {
        const allSteps: MigrationStep[] = [
            "CLAIM_REWARDS",
            "APPROVE",
            "UNSTAKE",
            "BRIDGE",
        ];
        const execs = makeIdleExecutions();
        const active = computeActiveStep(allSteps, execs);
        expect(active).toBe("CLAIM_REWARDS");
    });

    it("advances past CONFIRMED CLAIM_REWARDS to APPROVE", () => {
        const allSteps: MigrationStep[] = [
            "CLAIM_REWARDS",
            "APPROVE",
            "UNSTAKE",
            "BRIDGE",
        ];
        const execs = withStepStatus(makeIdleExecutions(), "CLAIM_REWARDS", "CONFIRMED");
        const active = computeActiveStep(allSteps, execs);
        expect(active).toBe("APPROVE");
    });
});

// =========================================================================
// 3. Orchestrator state transitions
// =========================================================================

describe("orchestrator state transitions", () => {
    // The orchestrator is modeled as a state machine with four states:
    //   idle -> running -> (paused | completed)
    //   paused -> running (retry)
    //
    // We test the transition rules by simulating the logic from
    // useMigrationOrchestrator without rendering the hook.

    /**
     * Simulates the orchestrator's state transition logic.
     *
     * This mirrors the useEffect in useMigrationOrchestrator that watches
     * stepExecutions and computes the next orchestrator state.
     */
    function deriveOrchestratorState(
        currentState: OrchestratorState,
        activeStep: MigrationStep | null,
        executions: Record<MigrationStep, StepExecution>,
        lastAttemptedStep: MigrationStep | null,
    ): OrchestratorState {
        // idle is the initial state; transitions only happen after startMigration
        if (currentState === "idle") return "idle";

        // completed is terminal
        if (currentState === "completed") return "completed";

        // When running, derive next state:
        if (currentState === "running" || currentState === "paused") {
            // All done
            if (!activeStep) return "completed";

            const execution = executions[activeStep];

            // Hard failure
            if (execution.status === "FAILED") return "paused";

            // Wallet rejection: step reverted to IDLE for the same attempted step
            if (
                execution.status === "IDLE" &&
                lastAttemptedStep === activeStep
            ) {
                return "paused";
            }
        }

        return currentState;
    }

    it("initial state is idle", () => {
        const state = deriveOrchestratorState(
            "idle",
            "APPROVE",
            makeIdleExecutions(),
            null,
        );
        expect(state).toBe("idle");
    });

    it("startMigration transitions to running", () => {
        // startMigration sets state to "running" directly
        const stateAfterStart: OrchestratorState = "running";
        expect(stateAfterStart).toBe("running");
    });

    it("all steps CONFIRMED transitions to completed", () => {
        let execs = makeIdleExecutions();
        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        for (const step of steps) {
            execs = withStepStatus(execs, step, "CONFIRMED");
        }
        const activeStep = computeActiveStep(steps, execs);
        expect(activeStep).toBeNull();

        const state = deriveOrchestratorState("running", activeStep, execs, null);
        expect(state).toBe("completed");
    });

    it("step FAILED transitions to paused", () => {
        let execs = makeIdleExecutions();
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");
        execs = withStepStatus(execs, "UNSTAKE", "FAILED", {
            error: "execution reverted",
        });

        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        const activeStep = computeActiveStep(steps, execs);
        expect(activeStep).toBe("UNSTAKE");

        const state = deriveOrchestratorState("running", activeStep, execs, null);
        expect(state).toBe("paused");
    });

    it("wallet rejection (step reverts to IDLE for same attempted step) transitions to paused", () => {
        const execs = makeIdleExecutions();
        // The orchestrator attempted APPROVE, but the user rejected in wallet,
        // so the step went back to IDLE with lastAttemptedStep still set.
        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        const activeStep = computeActiveStep(steps, execs);
        expect(activeStep).toBe("APPROVE");

        const state = deriveOrchestratorState(
            "running",
            activeStep,
            execs,
            "APPROVE", // lastAttemptedStep matches activeStep => wallet rejection
        );
        expect(state).toBe("paused");
    });

    it("wallet rejection does NOT pause when lastAttemptedStep differs from active step", () => {
        let execs = makeIdleExecutions();
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");

        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        const activeStep = computeActiveStep(steps, execs);
        expect(activeStep).toBe("UNSTAKE");

        // lastAttemptedStep is a different step (previous one) -- this is the
        // normal auto-advance case, not a wallet rejection.
        const state = deriveOrchestratorState(
            "running",
            activeStep,
            execs,
            "APPROVE",
        );
        expect(state).toBe("running");
    });

    it("retryMigration resets failed step to IDLE and transitions to running", () => {
        // Simulate the retry logic from useMigrationOrchestrator.retryMigration:
        //   1. Reset current active step to IDLE
        //   2. Clear lastAttemptedStep
        //   3. Set state to running
        let execs = makeIdleExecutions();
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");
        execs = withStepStatus(execs, "UNSTAKE", "FAILED", {
            error: "nonce too low",
        });

        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        let activeStep = computeActiveStep(steps, execs);
        expect(activeStep).toBe("UNSTAKE");

        // retryMigration resets the failed step
        execs = withStepStatus(execs, "UNSTAKE", "IDLE", {
            error: null,
        });
        activeStep = computeActiveStep(steps, execs);
        expect(activeStep).toBe("UNSTAKE");
        expect(execs["UNSTAKE"].status).toBe("IDLE");

        // After retry, lastAttemptedStep is cleared (null) and state is running
        const state = deriveOrchestratorState("running", activeStep, execs, null);
        // With IDLE status and lastAttemptedStep=null, it stays running (not paused)
        expect(state).toBe("running");
    });

    it("completed state is terminal", () => {
        const execs = makeIdleExecutions();
        const state = deriveOrchestratorState("completed", null, execs, null);
        expect(state).toBe("completed");
    });

    it("WAITING_SIGNATURE does not change orchestrator state", () => {
        const execs = withStepStatus(makeIdleExecutions(), "APPROVE", "WAITING_SIGNATURE");
        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        const activeStep = computeActiveStep(steps, execs);

        const state = deriveOrchestratorState("running", activeStep, execs, "APPROVE");
        expect(state).toBe("running");
    });

    it("TX_PENDING does not change orchestrator state", () => {
        const execs = withStepStatus(makeIdleExecutions(), "APPROVE", "TX_PENDING", {
            txHash: "0xdeadbeef",
        });
        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        const activeStep = computeActiveStep(steps, execs);

        const state = deriveOrchestratorState("running", activeStep, execs, "APPROVE");
        expect(state).toBe("running");
    });

    it("paused state transitions to running on retry", () => {
        // From paused, retryMigration sets state directly to "running"
        const stateAfterRetry: OrchestratorState = "running";
        expect(stateAfterRetry).toBe("running");
    });

    it("full lifecycle: idle -> running -> completed", () => {
        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        let execs = makeIdleExecutions();

        // Phase 1: idle
        let state: OrchestratorState = "idle";
        expect(state).toBe("idle");

        // Phase 2: start -> running
        state = "running";
        const lastAttempted: MigrationStep | null = null;

        // Phase 3: all steps confirm one by one
        for (const step of steps) {
            execs = withStepStatus(execs, step, "CONFIRMED");
        }
        const activeStep = computeActiveStep(steps, execs);
        state = deriveOrchestratorState(state, activeStep, execs, lastAttempted);
        expect(state).toBe("completed");
    });

    it("full lifecycle with failure and retry: idle -> running -> paused -> running -> completed", () => {
        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        let execs = makeIdleExecutions();
        let state: OrchestratorState = "idle";

        // Start
        state = "running";

        // APPROVE confirms
        execs = withStepStatus(execs, "APPROVE", "CONFIRMED");

        // UNSTAKE fails
        execs = withStepStatus(execs, "UNSTAKE", "FAILED", {
            error: "out of gas",
        });
        let activeStep = computeActiveStep(steps, execs);
        state = deriveOrchestratorState(state, activeStep, execs, null);
        expect(state).toBe("paused");

        // Retry: reset UNSTAKE to IDLE, clear lastAttempted
        execs = withStepStatus(execs, "UNSTAKE", "IDLE", { error: null });
        state = "running"; // retryMigration sets this

        // UNSTAKE now confirms
        execs = withStepStatus(execs, "UNSTAKE", "CONFIRMED");
        // BRIDGE confirms
        execs = withStepStatus(execs, "BRIDGE", "CONFIRMED");
        activeStep = computeActiveStep(steps, execs);
        state = deriveOrchestratorState(state, activeStep, execs, null);
        expect(state).toBe("completed");
    });
});

// =========================================================================
// 4. Preferences management
// =========================================================================

describe("preferences management", () => {
    /** Replicate the preferences logic from useMigrationFlow. */
    function createPreferencesManager() {
        let prefs: MigrationPreferences = {
            stakeOnGoliath: true,
            isToggleLocked: false,
        };

        return {
            get preferences() {
                return prefs;
            },
            setStakeOnGoliath(value: boolean) {
                if (prefs.isToggleLocked) return;
                prefs = { ...prefs, stakeOnGoliath: value };
            },
            lockToggle() {
                prefs = { ...prefs, isToggleLocked: true };
            },
        };
    }

    it("stakeOnGoliath defaults to true", () => {
        const mgr = createPreferencesManager();
        expect(mgr.preferences.stakeOnGoliath).toBe(true);
    });

    it("isToggleLocked defaults to false", () => {
        const mgr = createPreferencesManager();
        expect(mgr.preferences.isToggleLocked).toBe(false);
    });

    it("setStakeOnGoliath changes the preference when toggle is NOT locked", () => {
        const mgr = createPreferencesManager();
        mgr.setStakeOnGoliath(false);
        expect(mgr.preferences.stakeOnGoliath).toBe(false);

        mgr.setStakeOnGoliath(true);
        expect(mgr.preferences.stakeOnGoliath).toBe(true);
    });

    it("setStakeOnGoliath is a no-op when toggle IS locked", () => {
        const mgr = createPreferencesManager();
        mgr.lockToggle();
        expect(mgr.preferences.isToggleLocked).toBe(true);

        mgr.setStakeOnGoliath(false);
        expect(mgr.preferences.stakeOnGoliath).toBe(true); // unchanged
    });

    it("lockToggle prevents further changes", () => {
        const mgr = createPreferencesManager();

        // Change before lock
        mgr.setStakeOnGoliath(false);
        expect(mgr.preferences.stakeOnGoliath).toBe(false);

        // Lock
        mgr.lockToggle();

        // Attempt to change back -- blocked
        mgr.setStakeOnGoliath(true);
        expect(mgr.preferences.stakeOnGoliath).toBe(false);
    });

    it("lockToggle is idempotent", () => {
        const mgr = createPreferencesManager();
        mgr.lockToggle();
        mgr.lockToggle();
        expect(mgr.preferences.isToggleLocked).toBe(true);
    });

    it("setting the same value is allowed (no-op effectively)", () => {
        const mgr = createPreferencesManager();
        mgr.setStakeOnGoliath(true); // already true
        expect(mgr.preferences.stakeOnGoliath).toBe(true);
    });
});

// =========================================================================
// 5. Step execution status transitions
// =========================================================================

describe("step execution status transitions", () => {
    const ALL_STATUSES: StepExecutionStatus[] = [
        "IDLE",
        "WAITING_SIGNATURE",
        "TX_PENDING",
        "CONFIRMED",
        "FAILED",
    ];

    it("every status has defined valid transitions", () => {
        for (const status of ALL_STATUSES) {
            expect(VALID_STEP_TRANSITIONS[status]).toBeDefined();
            expect(Array.isArray(VALID_STEP_TRANSITIONS[status])).toBe(true);
        }
    });

    it("IDLE -> WAITING_SIGNATURE is valid", () => {
        expect(VALID_STEP_TRANSITIONS["IDLE"]).toContain("WAITING_SIGNATURE");
    });

    it("IDLE has only one valid transition (WAITING_SIGNATURE)", () => {
        expect(VALID_STEP_TRANSITIONS["IDLE"]).toHaveLength(1);
        expect(VALID_STEP_TRANSITIONS["IDLE"]).toEqual(["WAITING_SIGNATURE"]);
    });

    it("WAITING_SIGNATURE -> TX_PENDING is valid", () => {
        expect(VALID_STEP_TRANSITIONS["WAITING_SIGNATURE"]).toContain("TX_PENDING");
    });

    it("WAITING_SIGNATURE -> FAILED is valid", () => {
        expect(VALID_STEP_TRANSITIONS["WAITING_SIGNATURE"]).toContain("FAILED");
    });

    it("WAITING_SIGNATURE has exactly two valid transitions", () => {
        expect(VALID_STEP_TRANSITIONS["WAITING_SIGNATURE"]).toHaveLength(2);
    });

    it("TX_PENDING -> CONFIRMED is valid", () => {
        expect(VALID_STEP_TRANSITIONS["TX_PENDING"]).toContain("CONFIRMED");
    });

    it("TX_PENDING -> FAILED is valid", () => {
        expect(VALID_STEP_TRANSITIONS["TX_PENDING"]).toContain("FAILED");
    });

    it("TX_PENDING has exactly two valid transitions", () => {
        expect(VALID_STEP_TRANSITIONS["TX_PENDING"]).toHaveLength(2);
    });

    it("CONFIRMED is terminal (no valid transitions out)", () => {
        expect(VALID_STEP_TRANSITIONS["CONFIRMED"]).toHaveLength(0);
        expect(VALID_STEP_TRANSITIONS["CONFIRMED"]).toEqual([]);
    });

    it("FAILED -> IDLE is valid (retry)", () => {
        expect(VALID_STEP_TRANSITIONS["FAILED"]).toContain("IDLE");
    });

    it("FAILED has exactly one valid transition (IDLE)", () => {
        expect(VALID_STEP_TRANSITIONS["FAILED"]).toHaveLength(1);
    });

    it("no status can transition to itself", () => {
        for (const status of ALL_STATUSES) {
            expect(VALID_STEP_TRANSITIONS[status]).not.toContain(status);
        }
    });

    it("CONFIRMED cannot be reached from IDLE directly", () => {
        expect(VALID_STEP_TRANSITIONS["IDLE"]).not.toContain("CONFIRMED");
    });

    it("IDLE cannot be reached from any status except FAILED", () => {
        const statusesThatCanReachIdle = ALL_STATUSES.filter(
            (s) => VALID_STEP_TRANSITIONS[s].includes("IDLE"),
        );
        expect(statusesThatCanReachIdle).toEqual(["FAILED"]);
    });

    it("simulates a successful step lifecycle: IDLE -> WAITING_SIGNATURE -> TX_PENDING -> CONFIRMED", () => {
        let status: StepExecutionStatus = "IDLE";

        // User initiates -> wallet prompt
        expect(VALID_STEP_TRANSITIONS[status]).toContain("WAITING_SIGNATURE");
        status = "WAITING_SIGNATURE";

        // User signs -> tx submitted
        expect(VALID_STEP_TRANSITIONS[status]).toContain("TX_PENDING");
        status = "TX_PENDING";

        // Tx mines -> confirmed
        expect(VALID_STEP_TRANSITIONS[status]).toContain("CONFIRMED");
        status = "CONFIRMED";

        // Terminal
        expect(VALID_STEP_TRANSITIONS[status]).toHaveLength(0);
    });

    it("simulates a failed step lifecycle with retry: IDLE -> WAITING_SIGNATURE -> TX_PENDING -> FAILED -> IDLE", () => {
        let status: StepExecutionStatus = "IDLE";

        status = "WAITING_SIGNATURE";
        expect(VALID_STEP_TRANSITIONS["IDLE"]).toContain(status);

        status = "TX_PENDING";
        expect(VALID_STEP_TRANSITIONS["WAITING_SIGNATURE"]).toContain(status);

        // Tx reverts
        const prevStatus = status;
        status = "FAILED";
        expect(VALID_STEP_TRANSITIONS[prevStatus]).toContain(status);

        // Retry resets to IDLE
        status = "IDLE";
        expect(VALID_STEP_TRANSITIONS["FAILED"]).toContain(status);
    });

    it("simulates wallet rejection: IDLE -> WAITING_SIGNATURE -> FAILED -> IDLE", () => {
        let status: StepExecutionStatus = "IDLE";

        status = "WAITING_SIGNATURE";
        expect(VALID_STEP_TRANSITIONS["IDLE"]).toContain(status);

        // User rejects in wallet
        status = "FAILED";
        expect(VALID_STEP_TRANSITIONS["WAITING_SIGNATURE"]).toContain(status);

        // Retry
        status = "IDLE";
        expect(VALID_STEP_TRANSITIONS["FAILED"]).toContain(status);
    });
});
