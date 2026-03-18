"use client";

import { useTranslations } from "next-intl";
import { useMigrationStatus } from "@/hooks/migration/useMigrationStatus";
import { buildExplorerUrl } from "@/utils/explorer";
import { goliathConfig } from "@/config/goliath";
import { getGoliathNetwork } from "@/config/networks";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import type { PendingMigration } from "@/hooks/migration/types";
import type { BridgeStatus } from "@/lib/api/services/bridge";

interface Props {
    pendingMigration: PendingMigration;
    onStartNew: () => void;
}

export default function MigrationStatusPanel({
    pendingMigration,
    onStartNew,
}: Props) {
    const t = useTranslations("migrate");
    const { migrationStatus, shouldPromptStaking } = useMigrationStatus(
        pendingMigration.originTxHash,
    );

    const sourceChainId = goliathConfig.bridge.sourceChainId;
    const goliathChainId = getGoliathNetwork().chainId;
    const currentStatus: BridgeStatus =
        migrationStatus?.status ?? "PENDING_ORIGIN_TX";

    const steps = [
        { label: t("status.submitted"), done: true },
        {
            label: t("status.confirming"),
            done: (
                [
                    "CONFIRMING",
                    "AWAITING_RELAY",
                    "PROCESSING_DESTINATION",
                    "COMPLETED",
                ] as BridgeStatus[]
            ).includes(currentStatus),
        },
        {
            label: t("status.relaying"),
            done: (
                [
                    "AWAITING_RELAY",
                    "PROCESSING_DESTINATION",
                    "COMPLETED",
                ] as BridgeStatus[]
            ).includes(currentStatus),
        },
        {
            label: t("status.processing"),
            done: (
                ["PROCESSING_DESTINATION", "COMPLETED"] as BridgeStatus[]
            ).includes(currentStatus),
        },
        {
            label:
                currentStatus === "FAILED"
                    ? t("status.failed")
                    : t("status.completed"),
            done: currentStatus === "COMPLETED",
        },
    ];

    return (
        <div className="bg-[#141414]/80 backdrop-blur-xl border border-[#ffffff08] rounded-2xl p-6">
            <h3 className="text-primary text-lg font-medium mb-6">
                {t("status.title")}
            </h3>

            <div className="space-y-4 mb-6">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                step.done
                                    ? "bg-green-500/20 text-green-400"
                                    : currentStatus === "FAILED" &&
                                        i === steps.length - 1
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-[#1a1a2e] text-secondary"
                            }`}
                        >
                            {step.done ? "\u2713" : i + 1}
                        </div>
                        <span
                            className={
                                step.done ? "text-primary" : "text-secondary"
                            }
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Explorer links */}
            <div className="space-y-2 mb-6">
                <a
                    href={buildExplorerUrl(
                        pendingMigration.originTxHash,
                        "tx",
                        sourceChainId,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-400 hover:underline block"
                >
                    {t("status.viewOriginTx")}
                </a>
                {migrationStatus?.destinationTxHash && (
                    <a
                        href={buildExplorerUrl(
                            migrationStatus.destinationTxHash,
                            "tx",
                            goliathChainId,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-400 hover:underline block"
                    >
                        {t("status.viewDestTx")}
                    </a>
                )}
            </div>

            {/* Staking prompt */}
            {shouldPromptStaking && (
                <div className="bg-[#1a1a2e] border border-primary/20 rounded-lg p-4 mb-4">
                    <p className="text-primary mb-3">
                        {t("status.stakingPrompt")}
                    </p>
                    <div className="flex gap-3">
                        <PrimaryButton
                            label={t("status.stakeNow")}
                            onClick={() => {
                                /* TODO: wire to GoliathStake */
                            }}
                        />
                        <button
                            onClick={onStartNew}
                            className="text-secondary text-sm hover:text-primary"
                        >
                            {t("status.skipStaking")}
                        </button>
                    </div>
                </div>
            )}

            {/* Start new migration */}
            {(currentStatus === "COMPLETED" || currentStatus === "FAILED") && (
                <PrimaryButton
                    label={t("status.startNew")}
                    onClick={onStartNew}
                />
            )}
        </div>
    );
}
