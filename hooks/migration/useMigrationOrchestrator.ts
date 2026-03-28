"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMigrationFlow } from "./useMigrationFlow";
import { useMigrationTransactions } from "./useMigrationTransactions";
import { useMigrationPersistence } from "./useMigrationPersistence";
import type { MigrationStep, StakingSnapshot } from "./types";

export type OrchestratorState =
    | "idle"
    | "running"
    | "paused"
    | "completed";

export function useMigrationOrchestrator(snapshot: StakingSnapshot) {
    const { address } = useAccount();
    const flow = useMigrationFlow(snapshot);
    const { savePendingMigration, clearPendingMigration } =
        useMigrationPersistence(address);

    const transactions = useMigrationTransactions(
        snapshot,
        flow.updateStepExecution,
        flow.lockToggle,
        savePendingMigration,
        flow.preferences.stakeOnGoliath,
    );

    const [orchestratorState, setOrchestratorState] =
        useState<OrchestratorState>("idle");
    const runningRef = useRef(false);
    // Tracks which step we last attempted so we can detect a
    // wallet-rejection (step reverts to IDLE for the same step).
    const lastAttemptedStepRef = useRef<MigrationStep | null>(null);

    const executors: Record<MigrationStep, () => Promise<void>> = {
        CLAIM_REWARDS: transactions.executeClaim,
        APPROVE: transactions.executeApprove,
        UNSTAKE: transactions.executeUnstake,
        BRIDGE: transactions.executeBridge,
    };

    // Core execution: run the current active step, then let the
    // useEffect below detect the CONFIRMED transition and call again.
    const runNextStep = useCallback(async () => {
        if (!runningRef.current) return;

        const nextStep = flow.activeStep;
        if (!nextStep) {
            setOrchestratorState("completed");
            runningRef.current = false;
            return;
        }

        const execution = flow.stepExecutions[nextStep];
        if (execution.status === "IDLE" || execution.status === "FAILED") {
            lastAttemptedStepRef.current = nextStep;
            await executors[nextStep]();
        }
        // After execution completes, the useEffect watching stepExecutions
        // will detect the status change and trigger the next iteration.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flow.activeStep, flow.stepExecutions]);

    // Watch for step status changes to auto-advance or pause
    useEffect(() => {
        if (!runningRef.current) return;

        const currentStep = flow.activeStep;

        // All steps done
        if (!currentStep) {
            setOrchestratorState("completed");
            runningRef.current = false;
            return;
        }

        const execution = flow.stepExecutions[currentStep];

        if (execution.status === "FAILED") {
            // Hard failure -- pause and let user retry
            setOrchestratorState("paused");
            runningRef.current = false;
            return;
        }

        if (execution.status === "IDLE") {
            // If we already attempted this step and it came back IDLE,
            // the user rejected the wallet prompt.  Pause instead of
            // immediately re-prompting.
            if (lastAttemptedStepRef.current === currentStep) {
                setOrchestratorState("paused");
                runningRef.current = false;
                return;
            }
            // Fresh step (previous step just confirmed and activeStep
            // advanced).  Fire the executor.
            runNextStep();
        }

        // WAITING_SIGNATURE / TX_PENDING -- do nothing, wait for
        // the transaction to resolve.
    }, [flow.activeStep, flow.stepExecutions, runNextStep]);

    const startMigration = useCallback(async () => {
        lastAttemptedStepRef.current = null;
        runningRef.current = true;
        setOrchestratorState("running");
        await runNextStep();
    }, [runNextStep]);

    const retryMigration = useCallback(async () => {
        const currentStep = flow.activeStep;
        if (currentStep) {
            flow.updateStepExecution(currentStep, {
                status: "IDLE",
                error: null,
            });
        }
        lastAttemptedStepRef.current = null;
        runningRef.current = true;
        setOrchestratorState("running");
        // The useEffect will pick up the IDLE status and call runNextStep.
    }, [flow.activeStep, flow.updateStepExecution]);

    return {
        // Pass-through from flow
        visibleSteps: flow.visibleSteps,
        activeStep: flow.activeStep,
        stepExecutions: flow.stepExecutions,
        preferences: flow.preferences,
        setStakeOnGoliath: flow.setStakeOnGoliath,
        // Orchestrator-specific
        orchestratorState,
        startMigration,
        retryMigration,
        savePendingMigration,
        clearPendingMigration,
    };
}
