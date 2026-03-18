"use client";

import { useState, useMemo } from "react";
import { goliathConfig } from "@/config/goliath";
import type {
    MigrationStep,
    StepExecution,
    MigrationPreferences,
    StakingSnapshot,
} from "./types";

export function useMigrationFlow(snapshot: StakingSnapshot) {
    const [stepExecutions, setStepExecutions] = useState<
        Record<MigrationStep, StepExecution>
    >({
        CLAIM_REWARDS: { status: "IDLE", txHash: null, error: null },
        APPROVE: { status: "IDLE", txHash: null, error: null },
        UNSTAKE: { status: "IDLE", txHash: null, error: null },
        BRIDGE: { status: "IDLE", txHash: null, error: null },
    });

    const [preferences, setPreferences] = useState<MigrationPreferences>({
        stakeOnGoliath: true,
        isToggleLocked: false,
    });

    // Determine visible steps based on snapshot and config
    const visibleSteps = useMemo((): MigrationStep[] => {
        const steps: MigrationStep[] = [];
        if (
            goliathConfig.migration.claimEnabled &&
            snapshot.rewards > 0n
        ) {
            steps.push("CLAIM_REWARDS");
        }
        steps.push("APPROVE", "UNSTAKE", "BRIDGE");
        return steps;
    }, [snapshot.rewards]);

    // Active step is the first non-CONFIRMED step
    const activeStep = useMemo((): MigrationStep | null => {
        for (const step of visibleSteps) {
            if (stepExecutions[step].status !== "CONFIRMED") return step;
        }
        return null;
    }, [visibleSteps, stepExecutions]);

    const updateStepExecution = (
        step: MigrationStep,
        update: Partial<StepExecution>,
    ) => {
        setStepExecutions((prev) => ({
            ...prev,
            [step]: { ...prev[step], ...update },
        }));
    };

    const setStakeOnGoliath = (value: boolean) => {
        if (preferences.isToggleLocked) return;
        setPreferences((prev) => ({ ...prev, stakeOnGoliath: value }));
    };

    const lockToggle = () => {
        setPreferences((prev) => ({ ...prev, isToggleLocked: true }));
    };

    return {
        visibleSteps,
        activeStep,
        stepExecutions,
        preferences,
        updateStepExecution,
        setStakeOnGoliath,
        lockToggle,
    };
}
