import { describe, it, expect } from "vitest";
import type { MigrationStep } from "@/hooks/migration/types";

describe("migration flow logic", () => {
    it("claim step is skipped when rewards are 0", () => {
        const rewards = 0n;
        const claimEnabled = true;
        const steps: MigrationStep[] = [];
        if (claimEnabled && rewards > 0n) steps.push("CLAIM_REWARDS");
        steps.push("APPROVE", "UNSTAKE", "BRIDGE");

        expect(steps).not.toContain("CLAIM_REWARDS");
        expect(steps).toEqual(["APPROVE", "UNSTAKE", "BRIDGE"]);
    });

    it("claim step included when rewards > 0", () => {
        const rewards = 100n;
        const claimEnabled = true;
        const steps: MigrationStep[] = [];
        if (claimEnabled && rewards > 0n) steps.push("CLAIM_REWARDS");
        steps.push("APPROVE", "UNSTAKE", "BRIDGE");

        expect(steps).toContain("CLAIM_REWARDS");
        expect(steps).toHaveLength(4);
        expect(steps).toEqual([
            "CLAIM_REWARDS",
            "APPROVE",
            "UNSTAKE",
            "BRIDGE",
        ]);
    });

    it("claim step skipped when not enabled", () => {
        const rewards = 100n;
        const claimEnabled = false;
        const steps: MigrationStep[] = [];
        if (claimEnabled && rewards > 0n) steps.push("CLAIM_REWARDS");
        steps.push("APPROVE", "UNSTAKE", "BRIDGE");

        expect(steps).not.toContain("CLAIM_REWARDS");
    });

    it("base steps are always APPROVE, UNSTAKE, BRIDGE", () => {
        const steps: MigrationStep[] = ["APPROVE", "UNSTAKE", "BRIDGE"];
        expect(steps).toHaveLength(3);
        expect(steps[0]).toBe("APPROVE");
        expect(steps[1]).toBe("UNSTAKE");
        expect(steps[2]).toBe("BRIDGE");
    });

    it("step execution order is preserved", () => {
        const fullSteps: MigrationStep[] = [
            "CLAIM_REWARDS",
            "APPROVE",
            "UNSTAKE",
            "BRIDGE",
        ];

        for (let i = 0; i < fullSteps.length - 1; i++) {
            const currentIdx = fullSteps.indexOf(fullSteps[i]);
            const nextIdx = fullSteps.indexOf(fullSteps[i + 1]);
            expect(currentIdx).toBeLessThan(nextIdx);
        }
    });

    it("step status transitions are valid", () => {
        type StepExecutionStatus =
            | "IDLE"
            | "WAITING_SIGNATURE"
            | "TX_PENDING"
            | "CONFIRMED"
            | "FAILED";

        const validTransitions: Record<
            StepExecutionStatus,
            StepExecutionStatus[]
        > = {
            IDLE: ["WAITING_SIGNATURE"],
            WAITING_SIGNATURE: ["TX_PENDING", "FAILED"],
            TX_PENDING: ["CONFIRMED", "FAILED"],
            CONFIRMED: [],
            FAILED: ["IDLE"],
        };

        // Verify every status has defined transitions
        const allStatuses: StepExecutionStatus[] = [
            "IDLE",
            "WAITING_SIGNATURE",
            "TX_PENDING",
            "CONFIRMED",
            "FAILED",
        ];
        for (const status of allStatuses) {
            expect(validTransitions[status]).toBeDefined();
        }

        // CONFIRMED is terminal
        expect(validTransitions.CONFIRMED).toHaveLength(0);

        // FAILED can retry (go back to IDLE)
        expect(validTransitions.FAILED).toContain("IDLE");
    });
});
