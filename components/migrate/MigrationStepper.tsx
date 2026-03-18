"use client";

import { useTranslations } from "next-intl";
import { formatEther } from "viem";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import { buildExplorerUrl } from "@/utils/explorer";
import { goliathConfig } from "@/config/goliath";
import type {
    MigrationStep,
    StepExecution,
    MigrationPreferences,
    StakingSnapshot,
} from "@/hooks/migration/types";

interface Props {
    visibleSteps: MigrationStep[];
    activeStep: MigrationStep | null;
    stepExecutions: Record<MigrationStep, StepExecution>;
    preferences: MigrationPreferences;
    snapshot: StakingSnapshot;
    onExecuteStep: (step: MigrationStep) => void;
    onToggleStake: (value: boolean) => void;
}

export default function MigrationStepper({
    visibleSteps,
    activeStep,
    stepExecutions,
    preferences,
    snapshot,
    onExecuteStep,
    onToggleStake,
}: Props) {
    const t = useTranslations("migrate");
    const sourceChainId = goliathConfig.bridge.sourceChainId;

    const stepConfig: Record<
        MigrationStep,
        { label: string; description: string }
    > = {
        CLAIM_REWARDS: {
            label: t("steps.claim"),
            description: t("steps.claimDesc"),
        },
        APPROVE: {
            label: t("steps.approve"),
            description: t("steps.approveDesc"),
        },
        UNSTAKE: {
            label: t("steps.unstake"),
            description: t("steps.unstakeDesc", {
                amount: formatEther(snapshot.staked),
            }),
        },
        BRIDGE: {
            label: t("steps.bridge"),
            description: t("steps.bridgeDesc", {
                amount: formatEther(snapshot.walletXcn),
            }),
        },
    };

    return (
        <div className="space-y-4">
            {visibleSteps.map((step, index) => {
                const execution = stepExecutions[step];
                const config = stepConfig[step];
                const isActive = step === activeStep;
                const isCompleted = execution.status === "CONFIRMED";
                const isFailed = execution.status === "FAILED";
                const isPending =
                    execution.status === "WAITING_SIGNATURE" ||
                    execution.status === "TX_PENDING";

                return (
                    <div
                        key={step}
                        className={`bg-[#141414] border rounded-xl p-6 ${
                            isActive
                                ? "border-primary/30"
                                : "border-border-primary"
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    isCompleted
                                        ? "bg-green-500/20 text-green-400"
                                        : isFailed
                                          ? "bg-red-500/20 text-red-400"
                                          : isActive
                                            ? "bg-primary/20 text-primary"
                                            : "bg-[#1a1a2e] text-secondary"
                                }`}
                            >
                                {isCompleted ? "\u2713" : index + 1}
                            </div>
                            <div>
                                <h4 className="text-primary font-medium">
                                    {config.label}
                                </h4>
                                <p className="text-secondary text-sm">
                                    {config.description}
                                </p>
                            </div>
                        </div>

                        {/* Transaction hash link */}
                        {execution.txHash && (
                            <a
                                href={buildExplorerUrl(
                                    execution.txHash,
                                    "tx",
                                    sourceChainId,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-400 hover:underline"
                            >
                                {t("steps.viewTransaction")}
                            </a>
                        )}

                        {/* Error message */}
                        {isFailed && execution.error && (
                            <p className="text-red-400 text-sm mt-2">
                                {execution.error}
                            </p>
                        )}

                        {/* Stake toggle on BRIDGE step */}
                        {step === "BRIDGE" && isActive && (
                            <div className="mt-4 flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.stakeOnGoliath}
                                        onChange={(e) =>
                                            onToggleStake(e.target.checked)
                                        }
                                        disabled={preferences.isToggleLocked}
                                        className="accent-primary"
                                    />
                                    <span className="text-secondary text-sm">
                                        {t("steps.stakeToggle")}
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Action button */}
                        {isActive && !isPending && (
                            <div className="mt-4">
                                <PrimaryButton
                                    label={config.label}
                                    onClick={() => onExecuteStep(step)}
                                />
                            </div>
                        )}
                        {isPending && (
                            <div className="mt-4">
                                <PrimaryButton
                                    label={t("steps.processing")}
                                    disabled={true}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
