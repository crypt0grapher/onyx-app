"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import { useBridgeStatusPoller } from "@/hooks/bridge/useBridgeStatusPoller";
import { useClipboard } from "@/hooks/common/useClipboard";
import { buildBridgeExplorerUrl } from "@/utils/explorer";
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
    onStatusChange?: (id: string, updates: Partial<BridgeOperation>) => void;
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

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

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

const CopyIcon: React.FC = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
    >
        <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 4V2C8 1.45 7.55 1 7 1H2C1.45 1 1 1.45 1 2V7C1 7.55 1.45 8 2 8H4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
);

const CopiedIcon: React.FC = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
    >
        <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="1.5"
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
    onStatusChange,
}) => {
    const t = useTranslations("bridge");
    const { copyToClipboard } = useClipboard();
    const [copiedHash, setCopiedHash] = useState<string | null>(null);
    const hasSyncedRef = useRef<string | null>(null);

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

    // Reset sync tracking when operation changes
    useEffect(() => {
        hasSyncedRef.current = null;
    }, [operation?.id]);

    // Sync terminal status back to localStorage via parent
    useEffect(() => {
        if (!operation || !status || !onStatusChange) return;
        if (hasSyncedRef.current === operation.id) return;

        const apiStatus = status.status;
        if (apiStatus === "COMPLETED" || apiStatus === "FAILED" || apiStatus === "EXPIRED") {
            hasSyncedRef.current = operation.id;
            onStatusChange(operation.id, {
                status: apiStatus,
                destinationTxHash: status.destinationTxHash || operation.destinationTxHash,
            });
        }
    }, [status, operation, onStatusChange]);

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

    // Copy handler
    const handleCopy = useCallback(
        async (hash: string) => {
            const ok = await copyToClipboard(hash);
            if (ok) {
                setCopiedHash(hash);
                setTimeout(() => setCopiedHash(null), 2000);
            }
        },
        [copyToClipboard],
    );

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
                    <div className="rounded-xl bg-[#0F0F0F] p-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-secondary text-xs">
                                {originChainName} Tx
                            </span>
                            <div className="flex items-center gap-2">
                                {operation.originTxHash && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleCopy(operation.originTxHash!)
                                            }
                                            className="text-secondary hover:text-primary transition-colors cursor-pointer"
                                            title="Copy tx hash"
                                        >
                                            {copiedHash === operation.originTxHash ? (
                                                <span className="text-green-400">
                                                    <CopiedIcon />
                                                </span>
                                            ) : (
                                                <CopyIcon />
                                            )}
                                        </button>
                                        <a
                                            href={buildBridgeExplorerUrl(
                                                operation.originTxHash,
                                                "origin",
                                                operation.direction,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <ExternalLinkIcon />
                                        </a>
                                    </>
                                )}
                                {operation.originTxHash && activeIndex >= 2 ? (
                                    <span className="text-green-400 text-xs">&#10003;</span>
                                ) : operation.originTxHash ? (
                                    <span className="inline-block w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                ) : null}
                            </div>
                        </div>
                        {operation.originTxHash ? (
                            <p className="font-mono text-xs text-primary break-all leading-relaxed">
                                {operation.originTxHash}
                            </p>
                        ) : (
                            <p className="text-sm text-secondary italic">
                                Awaiting...
                            </p>
                        )}
                    </div>

                    {/* Destination tx */}
                    <div className="rounded-xl bg-[#0F0F0F] p-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-secondary text-xs">
                                {destChainName} Tx
                            </span>
                            <div className="flex items-center gap-2">
                                {destTxHash && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(destTxHash)}
                                            className="text-secondary hover:text-primary transition-colors cursor-pointer"
                                            title="Copy tx hash"
                                        >
                                            {copiedHash === destTxHash ? (
                                                <span className="text-green-400">
                                                    <CopiedIcon />
                                                </span>
                                            ) : (
                                                <CopyIcon />
                                            )}
                                        </button>
                                        <a
                                            href={buildBridgeExplorerUrl(
                                                destTxHash,
                                                "destination",
                                                operation.direction,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <ExternalLinkIcon />
                                        </a>
                                    </>
                                )}
                                {isCompleted && destTxHash ? (
                                    <span className="text-green-400 text-xs">&#10003;</span>
                                ) : null}
                            </div>
                        </div>
                        {destTxHash ? (
                            <p className="font-mono text-xs text-primary break-all leading-relaxed">
                                {destTxHash}
                            </p>
                        ) : (
                            <p className="text-sm text-secondary italic">
                                Awaiting...
                            </p>
                        )}
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
                                "bg-green-500/20 border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.5)]";
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
