"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAccount } from "wagmi";
import { goliathConfig } from "@/config/goliath";
import {
    useMigrationData,
    useMigrationFlow,
    useMigrationTransactions,
    useMigrationPersistence,
    useMigrationResume,
} from "@/hooks/migration";
import type { MigrationStep } from "@/hooks/migration";
import {
    MigrationSummary,
    MigrationStepper,
    MigrationStatusPanel,
} from "@/components/migrate";

export default function Migrate() {
    const t = useTranslations("migrate");
    const { address, isConnected } = useAccount();
    const { snapshot } = useMigrationData();

    const {
        visibleSteps,
        activeStep,
        stepExecutions,
        preferences,
        updateStepExecution,
        setStakeOnGoliath,
        lockToggle,
    } = useMigrationFlow(snapshot);

    const { savePendingMigration, clearPendingMigration } =
        useMigrationPersistence(address);

    const { pendingMigration, isResumed } = useMigrationResume();

    const [showStatus, setShowStatus] = useState(true);

    const { executeClaim, executeApprove, executeUnstake, executeBridge } =
        useMigrationTransactions(
            snapshot,
            updateStepExecution,
            lockToggle,
            savePendingMigration,
            preferences.stakeOnGoliath,
        );

    const handleExecuteStep = (step: MigrationStep) => {
        switch (step) {
            case "CLAIM_REWARDS":
                executeClaim();
                break;
            case "APPROVE":
                executeApprove();
                break;
            case "UNSTAKE":
                executeUnstake();
                break;
            case "BRIDGE":
                executeBridge();
                break;
        }
    };

    const handleStartNew = useCallback(() => {
        clearPendingMigration();
        setShowStatus(false);
    }, [clearPendingMigration]);

    if (!goliathConfig.migration.migrationEnabled) {
        return (
            <div className="min-h-screen">
                <main className="lg:ml-[304px] lg:p-6">
                    <div className="px-4 lg:px-0 flex items-center justify-center h-[60vh]">
                        <p className="text-secondary text-lg">
                            {t("disabled")}
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen">
                <main className="lg:ml-[304px] lg:p-6">
                    <div className="px-4 lg:px-0 flex items-center justify-center h-[60vh]">
                        <p className="text-secondary text-lg">
                            {t("connect")}
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const isEmpty =
        snapshot.staked === 0n &&
        snapshot.rewards === 0n &&
        snapshot.walletXcn === 0n;

    const shouldShowStatusPanel =
        isResumed && pendingMigration !== null && showStatus;

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] lg:p-6">
                <div className="px-4 lg:px-0">
                    <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                        {t("title")}
                    </h2>
                    <p className="text-secondary text-[14px] leading-[20px] mb-[24px]">
                        {t("subtitle")}
                    </p>

                    {shouldShowStatusPanel ? (
                        <MigrationStatusPanel
                            pendingMigration={pendingMigration}
                            onStartNew={handleStartNew}
                        />
                    ) : isEmpty ? (
                        <p className="text-secondary text-center py-12">
                            {t("empty")}
                        </p>
                    ) : (
                        <>
                            <MigrationSummary snapshot={snapshot} />
                            <MigrationStepper
                                visibleSteps={visibleSteps}
                                activeStep={activeStep}
                                stepExecutions={stepExecutions}
                                preferences={preferences}
                                snapshot={snapshot}
                                onExecuteStep={handleExecuteStep}
                                onToggleStake={setStakeOnGoliath}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
