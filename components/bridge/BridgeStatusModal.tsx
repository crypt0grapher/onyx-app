"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import { useBridgeStatusPoller } from "@/hooks/bridge/useBridgeStatusPoller";
import { buildExplorerUrl } from "@/utils/explorer";
import { truncateAddress } from "@/utils/address";
import type { BridgeOperation } from "@/hooks/bridge/types";
import type {
    BridgeStatus,
    BridgeStatusResponse,
} from "@/lib/api/services/bridge";

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
    sublabel?: string;
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

/**
 * When a bridge operation has FAILED, determine which step was reached
 * before failure using API timestamps or local operation data.
 */
function getFailedStepIndex(
    apiStatus: BridgeStatusResponse | null,
    operation: BridgeOperation | null,
): number {
    if (apiStatus?.timestamps) {
        if (apiStatus.timestamps.destinationSubmittedAt) return 3;
        if (apiStatus.timestamps.finalizedAt) return 2;
        if (apiStatus.timestamps.depositedAt) return 1;
        return 0;
    }
    if (operation?.destinationTxHash) return 3;
    if (operation?.originTxHash) return 1;
    return 0;
}

const ExternalLinkIcon: React.FC = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
    >
        <path
            d="M5 1H1.5C1.22 1 1 1.22 1 1.5V10.5C1 10.78 1.22 11 1.5 11H10.5C10.78 11 11 10.78 11 10.5V7M8 1H11V4M11 1L5.5 6.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

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
    const activeIndex = isFailed
        ? getFailedStepIndex(status ?? null, operation)
        : getStepIndex(currentStatus);

    const confirmationText = useMemo(() => {
        if (!status?.originConfirmations) return null;
        return `${status.originConfirmations}/${status.requiredConfirmations}`;
    }, [status?.originConfirmations, status?.requiredConfirmations]);

    // Chain names based on direction
    const originChainName =
        operation?.direction === "SOURCE_TO_GOLIATH" ? "Ethereum" : "Goliath";
    const destChainName =
        operation?.direction === "SOURCE_TO_GOLIATH" ? "Goliath" : "Ethereum";

    // Build the list of visual progress steps
    const steps: StatusStep[] = useMemo(
        () => [
            {
                key: "pending",
                label: `Deposit sent on ${originChainName}`,
                done: activeIndex >= 1,
                active: activeIndex === 0,
            },
            {
                key: "confirming",
                label: confirmationText
                    ? `Waiting for ${confirmationText} ${originChainName} confirmations`
                    : `Confirming on ${originChainName}`,
                done: activeIndex >= 2,
                active: activeIndex === 1,
            },
            {
                key: "relaying",
                label: "Bridge relayer processing",
                done: activeIndex >= 3,
                active: activeIndex === 2,
            },
            {
                key: "processing",
                label: `Minting on ${destChainName}`,
                done: activeIndex >= 4,
                active: activeIndex === 3,
            },
            {
                key: "completed",
                label: isFailed ? t("status.failed") : "Bridge complete",
                done: isCompleted,
                active: false,
            },
        ],
        [activeIndex, isFailed, isCompleted, confirmationText, originChainName, destChainName, t],
    );

    // Modal title based on state
    const title = isFailed
        ? t("status.failed")
        : isCompleted
          ? t("status.completed")
          : t("status.title");

    // Destination tx hash
    const destTxHash = status?.destinationTxHash || operation?.destinationTxHash;

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
                        {originChainName} → {destChainName}
                    </div>
                </div>

                {/* ---- Transaction hashes ---- */}
                <div className="flex flex-col gap-2">
                    {/* Origin tx */}
                    <div className="rounded-xl bg-[#0F0F0F] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-secondary text-xs whitespace-nowrap">
                                {originChainName} Tx
                            </span>
                            {operation.originTxHash ? (
                                <span className="font-mono text-sm text-primary truncate">
                                    {truncateAddress(operation.originTxHash)}
                                </span>
                            ) : (
                                <span className="text-sm text-secondary italic">
                                    Awaiting...
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {operation.originTxHash && (
                                <a
                                    href={buildExplorerUrl(
                                        operation.originTxHash,
                                        "tx",
                                        operation.originChainId,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <ExternalLinkIcon />
                                </a>
                            )}
                            {operation.originTxHash && activeIndex >= 2 ? (
                                <span className="text-green-400 text-xs">&#10003;</span>
                            ) : operation.originTxHash ? (
                                <span className="inline-block w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            ) : null}
                        </div>
                    </div>

                    {/* Destination tx */}
                    <div className="rounded-xl bg-[#0F0F0F] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-secondary text-xs whitespace-nowrap">
                                {destChainName} Tx
                            </span>
                            {destTxHash ? (
                                <span className="font-mono text-sm text-primary truncate">
                                    {truncateAddress(destTxHash)}
                                </span>
                            ) : (
                                <span className="text-sm text-secondary italic">
                                    Awaiting...
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {destTxHash && (
                                <a
                                    href={buildExplorerUrl(
                                        destTxHash,
                                        "tx",
                                        operation.destinationChainId,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <ExternalLinkIcon />
                                </a>
                            )}
                            {isCompleted && destTxHash ? (
                                <span className="text-green-400 text-xs">&#10003;</span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* ---- Step indicators with connecting lines ---- */}
                <div className="flex flex-col">
                    {steps.map((step, i) => {
                        const isLastStep = i === steps.length - 1;
                        const isFailedStep =
                            isFailed && i === activeIndex && !isLastStep;
                        const isLastAndFailed = isFailed && isLastStep;
                        const prevStep = i > 0 ? steps[i - 1] : null;

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
                        } else if (isFailedStep) {
                            dotOuter = "bg-red-500/20 border-red-500/40";
                            dotInner = (
                                <span className="text-red-400 text-xs">
                                    &#10005;
                                </span>
                            );
                        } else if (step.active && !isFailed) {
                            dotOuter =
                                "bg-green-500/10 border-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.3)]";
                            dotInner = (
                                <span
                                    className="block w-3 h-3 rounded-full bg-green-400"
                                    style={{
                                        animation:
                                            "bridgePulse 1.5s ease-in-out infinite",
                                    }}
                                />
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

                        const labelClass = isFailedStep || isLastAndFailed
                            ? "text-red-400"
                            : step.done || step.active
                              ? "text-primary"
                              : "text-secondary";

                        // Connecting line between steps
                        let lineClass: string;
                        if (prevStep?.done && step.active) {
                            // Completed-to-active: animated gradient
                            lineClass =
                                "bg-gradient-to-b from-green-500/40 to-green-500/10";
                        } else if (step.done) {
                            lineClass = "bg-green-500/40";
                        } else {
                            lineClass = "bg-[#2a2a3e]";
                        }

                        return (
                            <div key={step.key}>
                                {/* Connecting line above (except first step) */}
                                {i > 0 && (
                                    <div className="ml-[15px] w-px h-4 my-1">
                                        <div
                                            className={`w-full h-full ${lineClass}`}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-shadow duration-300 ${dotOuter}`}
                                    >
                                        {dotInner}
                                    </div>
                                    <span
                                        className={`text-[14px] font-medium leading-[20px] ${labelClass}`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ---- Error message ---- */}
                {isFailed && status?.error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                        <p className="text-red-400 text-sm">{status.error}</p>
                    </div>
                )}

                {/* ---- ETA ---- */}
                {!isCompleted && !isFailed && (
                    <div className="rounded-xl bg-[#0F0F0F] p-3 text-center">
                        <span className="text-secondary text-sm">
                            {t("form.estimatedArrival")}:&nbsp;
                        </span>
                        <span className="text-primary text-sm font-medium">
                            {t("form.estimatedArrivalValue")}
                        </span>
                        {isPolling && (
                            <span className="inline-block ml-2 w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin align-middle" />
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default BridgeStatusModal;
