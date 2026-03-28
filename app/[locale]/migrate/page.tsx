"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { goliathConfig } from "@/config/goliath";
import {
    useMigrationData,
    useMigrationOrchestrator,
    useMigrationResume,
} from "@/hooks/migration";
import {
    MigrationSummary,
    MigrationStatusPanel,
    MigrationProgressBar,
} from "@/components/migrate";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";

export default function Migrate() {
    const t = useTranslations("migrate");
    const { isConnected } = useAccount();
    const { snapshot } = useMigrationData();

    const {
        visibleSteps,
        activeStep,
        stepExecutions,
        orchestratorState,
        startMigration,
        retryMigration,
        clearPendingMigration,
    } = useMigrationOrchestrator(snapshot);

    const { pendingMigration, isResumed } = useMigrationResume();

    const [showStatus, setShowStatus] = useState(true);

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

    const getButtonLabel = () => {
        switch (orchestratorState) {
            case "idle":
                return t("migrateButton");
            case "running":
                return t("migrating");
            case "paused":
                return t("retryMigration");
            case "completed":
                return t("migrationComplete");
        }
    };

    const getButtonDisabled = () =>
        orchestratorState === "running" ||
        orchestratorState === "completed";

    const getButtonAction = () => {
        switch (orchestratorState) {
            case "idle":
                return startMigration;
            case "paused":
                return retryMigration;
            default:
                return undefined;
        }
    };

    const isIdle = orchestratorState === "idle";
    const isRunning = orchestratorState === "running";

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] lg:p-6">
                <div className="px-4 lg:px-0 flex flex-col items-center">
                    <div className="w-full max-w-[640px]">
                        {/* Title + Subtitle */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                ease: "easeOut",
                            }}
                            className="text-center"
                        >
                            <h2 className="text-[28px] font-semibold leading-[36px] text-white mb-1">
                                {t("title")}
                            </h2>
                            <p className="text-secondary text-[14px] leading-[20px] opacity-70 mb-6">
                                {t("subtitle")}
                            </p>
                        </motion.div>

                        {shouldShowStatusPanel ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    ease: "easeOut",
                                    delay: 0.1,
                                }}
                            >
                                <MigrationStatusPanel
                                    pendingMigration={pendingMigration}
                                    onStartNew={handleStartNew}
                                />
                            </motion.div>
                        ) : isEmpty ? (
                            <motion.p
                                className="text-secondary text-center py-12"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                {t("empty")}
                            </motion.p>
                        ) : (
                            <>
                                {/* Main card: summary + button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeOut",
                                        delay: 0.1,
                                    }}
                                >
                                    <MigrationSummary snapshot={snapshot} />

                                    <div className="mt-5">
                                        <PrimaryButton
                                            label={getButtonLabel()}
                                            onClick={getButtonAction()}
                                            disabled={getButtonDisabled()}
                                            className={[
                                                isIdle
                                                    ? "shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                                                    : "",
                                                isRunning
                                                    ? "animate-pulse"
                                                    : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        />
                                    </div>
                                </motion.div>

                                {/* Progress bar */}
                                <motion.div
                                    className="mt-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeOut",
                                        delay: 0.2,
                                    }}
                                >
                                    <MigrationProgressBar
                                        visibleSteps={visibleSteps}
                                        activeStep={activeStep}
                                        stepExecutions={stepExecutions}
                                        orchestratorState={orchestratorState}
                                    />
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
