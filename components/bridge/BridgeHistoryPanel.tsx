"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useBridgeOperations } from "@/hooks/bridge/useBridgeOperations";
import { buildExplorerUrl } from "@/utils/explorer";
import { truncateAddress } from "@/utils/address";
import type { BridgeOperation } from "@/hooks/bridge/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BridgeHistoryPanelProps {
    onSelectOperation: (op: BridgeOperation) => void;
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: BridgeOperation["status"] }) {
    let color: string;
    let label: string;

    if (status === "COMPLETED") {
        color = "text-green-400 bg-green-500/10";
        label = "Completed";
    } else if (status === "FAILED" || status === "EXPIRED") {
        color = "text-red-400 bg-red-500/10";
        label = status === "FAILED" ? "Failed" : "Expired";
    } else {
        color = "text-yellow-400 bg-yellow-500/10";
        label = "In Progress";
    }

    return (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>
            {label}
        </span>
    );
}

// ---------------------------------------------------------------------------
// TimeAgo
// ---------------------------------------------------------------------------

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BridgeHistoryPanel: React.FC<BridgeHistoryPanelProps> = ({
    onSelectOperation,
}) => {
    const t = useTranslations("bridge");
    const { operations } = useBridgeOperations();

    const sorted = useMemo(
        () => [...operations].sort((a, b) => b.createdAt - a.createdAt),
        [operations],
    );

    if (sorted.length === 0) return null;

    return (
        <div className="w-full max-w-[530px] mt-6">
            <h3 className="text-primary text-[18px] font-medium leading-[24px] mb-3">
                {t("history.title")}
            </h3>

            <div className="flex flex-col gap-2">
                {sorted.map((op) => (
                    <button
                        key={op.id}
                        type="button"
                        onClick={() => onSelectOperation(op)}
                        className="w-full bg-[#141414] border border-[#1F1F1F] rounded-xl p-4 flex items-center justify-between hover:border-[#3a3a3a] transition-colors cursor-pointer"
                    >
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-primary text-sm font-medium">
                                    {op.amountHuman} {op.token}
                                </span>
                                <span className="text-secondary text-xs">
                                    {op.direction === "SOURCE_TO_GOLIATH"
                                        ? "Ethereum → Goliath"
                                        : "Goliath → Ethereum"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {op.originTxHash && (
                                    <a
                                        href={buildExplorerUrl(
                                            op.originTxHash,
                                            "tx",
                                            op.originChainId,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-blue-400 hover:underline font-mono"
                                    >
                                        {truncateAddress(op.originTxHash)}
                                    </a>
                                )}
                                <span className="text-xs text-[#808080]">
                                    {timeAgo(op.createdAt)}
                                </span>
                            </div>
                        </div>
                        <StatusBadge status={op.status} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BridgeHistoryPanel;
