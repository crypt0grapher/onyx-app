"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import { useBridgeStatusPoller } from "@/hooks/bridge/useBridgeStatusPoller";
import { buildExplorerUrl } from "@/utils/explorer";
import type { BridgeOperation } from "@/hooks/bridge/types";
import type { BridgeStatus } from "@/lib/api/services/bridge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BridgeStatusModalProps {
    operation: BridgeOperation | null;
    isOpen: boolean;
    onClose: () => void;
}

interface StatusStep {
    key: string;
    label: string;
    done: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Statuses that indicate the step has been reached or passed. */
const STEP_THRESHOLDS: Record<string, readonly BridgeStatus[]> = {
    confirming: [
        "CONFIRMING",
        "AWAITING_RELAY",
        "PROCESSING_DESTINATION",
        "COMPLETED",
    ],
    relaying: [
        "AWAITING_RELAY",
        "PROCESSING_DESTINATION",
        "COMPLETED",
    ],
    processing: ["PROCESSING_DESTINATION", "COMPLETED"],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BridgeStatusModal: React.FC<BridgeStatusModalProps> = ({
    operation,
    isOpen,
    onClose,
}) => {
    const t = useTranslations("bridge");
    const { status } = useBridgeStatusPoller(
        operation?.originTxHash ?? null,
    );

    const currentStatus: BridgeStatus =
        status?.status ?? operation?.status ?? "PENDING_ORIGIN_TX";

    const isFailed = currentStatus === "FAILED";

    // Build the list of visual progress steps
    const steps: StatusStep[] = useMemo(
        () => [
            {
                key: "pending",
                label: t("status.pending"),
                done: true, // always done once we have an operation
            },
            {
                key: "confirming",
                label: t("status.confirming"),
                done: STEP_THRESHOLDS.confirming.includes(currentStatus),
            },
            {
                key: "relaying",
                label: t("status.relaying"),
                done: STEP_THRESHOLDS.relaying.includes(currentStatus),
            },
            {
                key: "processing",
                label: t("status.processing"),
                done: STEP_THRESHOLDS.processing.includes(currentStatus),
            },
            {
                key: "completed",
                label: isFailed
                    ? t("status.failed")
                    : t("status.completed"),
                done: currentStatus === "COMPLETED",
            },
        ],
        [currentStatus, isFailed, t],
    );

    if (!operation) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t("status.title")}
            ariaLabel={t("status.title")}
        >
            <div className="flex flex-col gap-4">
                {/* ---- Step indicators ---- */}
                <div className="flex flex-col gap-3">
                    {steps.map((step, i) => {
                        const isLastAndFailed =
                            isFailed && i === steps.length - 1;

                        const dotClass = step.done
                            ? "bg-green-500/20 text-green-400"
                            : isLastAndFailed
                              ? "bg-red-500/20 text-red-400"
                              : "bg-[#1a1a2e] text-secondary";

                        const labelClass = step.done
                            ? "text-primary"
                            : "text-secondary";

                        return (
                            <div
                                key={step.key}
                                className="flex items-center gap-3"
                            >
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${dotClass}`}
                                >
                                    {step.done ? "\u2713" : i + 1}
                                </div>
                                <span
                                    className={`text-[14px] font-medium leading-[20px] ${labelClass}`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ---- Explorer links ---- */}
                <div className="flex flex-col gap-1 mt-2">
                    {operation.originTxHash && (
                        <a
                            href={buildExplorerUrl(
                                operation.originTxHash,
                                "tx",
                                operation.originChainId,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-400 hover:underline"
                        >
                            {t("status.viewOriginTx")}
                        </a>
                    )}
                    {status?.destinationTxHash && (
                        <a
                            href={buildExplorerUrl(
                                status.destinationTxHash,
                                "tx",
                                operation.destinationChainId,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-400 hover:underline"
                        >
                            {t("status.viewDestTx")}
                        </a>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default BridgeStatusModal;
