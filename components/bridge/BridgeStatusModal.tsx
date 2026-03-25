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
    active: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEP_ORDER: BridgeStatus[] = [
    "PENDING_ORIGIN_TX",
    "CONFIRMING",
    "AWAITING_RELAY",
    "PROCESSING_DESTINATION",
    "COMPLETED",
];

function getStepIndex(status: BridgeStatus): number {
    const idx = STEP_ORDER.indexOf(status);
    return idx >= 0 ? idx : 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BridgeStatusModal: React.FC<BridgeStatusModalProps> = ({
    operation,
    isOpen,
    onClose,
}) => {
    const t = useTranslations("bridge");
    const { status, isPolling } = useBridgeStatusPoller(
        operation?.originTxHash ?? null,
    );

    const currentStatus: BridgeStatus =
        status?.status ?? operation?.status ?? "PENDING_ORIGIN_TX";

    const isFailed = currentStatus === "FAILED" || currentStatus === "EXPIRED";
    const isCompleted = currentStatus === "COMPLETED";
    const activeIndex = getStepIndex(currentStatus);

    const confirmationText = useMemo(() => {
        if (!status?.originConfirmations) return null;
        return `${status.originConfirmations}/${status.requiredConfirmations}`;
    }, [status?.originConfirmations, status?.requiredConfirmations]);

    // Build the list of visual progress steps
    const steps: StatusStep[] = useMemo(
        () => [
            {
                key: "pending",
                label: t("status.pending"),
                done: activeIndex >= 1,
                active: activeIndex === 0,
            },
            {
                key: "confirming",
                label: confirmationText
                    ? `${t("status.confirming")} (${confirmationText})`
                    : t("status.confirming"),
                done: activeIndex >= 2,
                active: activeIndex === 1,
            },
            {
                key: "relaying",
                label: t("status.relaying"),
                done: activeIndex >= 3,
                active: activeIndex === 2,
            },
            {
                key: "processing",
                label: t("status.processing"),
                done: activeIndex >= 4,
                active: activeIndex === 3,
            },
            {
                key: "completed",
                label: isFailed
                    ? t("status.failed")
                    : t("status.completed"),
                done: isCompleted,
                active: false,
            },
        ],
        [activeIndex, isFailed, isCompleted, confirmationText, t],
    );

    // Modal title based on state
    const title = isFailed
        ? t("status.failed")
        : isCompleted
          ? t("status.completed")
          : t("status.title");

    if (!operation) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            ariaLabel={t("status.title")}
        >
            <div className="flex flex-col gap-5">
                {/* ---- Amount display ---- */}
                <div className="rounded-xl bg-[#0F0F0F] p-4 text-center">
                    <div className="text-[24px] font-medium text-primary leading-[32px] [font-feature-settings:'ss11'_on,'cv09'_on]">
                        {operation.amountHuman} {operation.token}
                    </div>
                    <div className="text-sm text-secondary mt-1">
                        {operation.direction === "SOURCE_TO_GOLIATH"
                            ? `Ethereum → Goliath`
                            : `Goliath → Ethereum`}
                    </div>
                </div>

                {/* ---- Step indicators with connecting lines ---- */}
                <div className="flex flex-col">
                    {steps.map((step, i) => {
                        const isLastAndFailed =
                            isFailed && i === steps.length - 1;
                        const isLast = i === steps.length - 1;

                        // Dot styles
                        let dotOuter: string;
                        let dotInner: React.ReactNode;

                        if (step.done) {
                            dotOuter = "bg-green-500/20 border-green-500/40";
                            dotInner = (
                                <span className="text-green-400 text-xs">
                                    &#10003;
                                </span>
                            );
                        } else if (step.active && !isFailed) {
                            dotOuter = "bg-green-500/10 border-green-500/50";
                            dotInner = (
                                <span className="block w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                            );
                        } else if (isLastAndFailed) {
                            dotOuter = "bg-red-500/20 border-red-500/40";
                            dotInner = (
                                <span className="text-red-400 text-xs">
                                    &#10005;
                                </span>
                            );
                        } else {
                            dotOuter = "bg-[#1a1a2e] border-[#2a2a3e]";
                            dotInner = (
                                <span className="block w-2 h-2 rounded-full bg-[#3a3a4e]" />
                            );
                        }

                        const labelClass = step.done || step.active
                            ? "text-primary"
                            : "text-secondary";

                        // Connecting line
                        const lineColor = step.done
                            ? "bg-green-500/40"
                            : "bg-[#2a2a3e]";

                        return (
                            <div key={step.key}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${dotOuter}`}
                                    >
                                        {dotInner}
                                    </div>
                                    <span
                                        className={`text-[14px] font-medium leading-[20px] ${labelClass}`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className="ml-[13px] w-px h-4 my-1">
                                        <div className={`w-full h-full ${lineColor}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ---- ETA ---- */}
                {!isCompleted && !isFailed && (
                    <div className="rounded-xl bg-[#0F0F0F] p-3 text-center">
                        <span className="text-secondary text-sm">
                            {t("form.estimatedArrival")}:&nbsp;
                        </span>
                        <span className="text-primary text-sm font-medium">
                            {status?.estimatedCompletionTime
                                ? t("form.estimatedArrivalValue")
                                : t("form.estimatedArrivalValue")}
                        </span>
                        {isPolling && (
                            <span className="inline-block ml-2 w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin align-middle" />
                        )}
                    </div>
                )}

                {/* ---- Explorer links ---- */}
                <div className="flex flex-col gap-2">
                    {operation.originTxHash && (
                        <a
                            href={buildExplorerUrl(
                                operation.originTxHash,
                                "tx",
                                operation.originChainId,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 text-sm text-blue-400 hover:underline"
                        >
                            {t("status.viewOriginTx")}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 1H1.5C1.22 1 1 1.22 1 1.5V10.5C1 10.78 1.22 11 1.5 11H10.5C10.78 11 11 10.78 11 10.5V7M8 1H11V4M11 1L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </a>
                    )}
                    {(status?.destinationTxHash || operation.destinationTxHash) && (
                        <a
                            href={buildExplorerUrl(
                                (status?.destinationTxHash || operation.destinationTxHash)!,
                                "tx",
                                operation.destinationChainId,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 text-sm text-blue-400 hover:underline"
                        >
                            {t("status.viewDestTx")}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 1H1.5C1.22 1 1 1.22 1 1.5V10.5C1 10.78 1.22 11 1.5 11H10.5C10.78 11 11 10.78 11 10.5V7M8 1H11V4M11 1L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </a>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default BridgeStatusModal;
