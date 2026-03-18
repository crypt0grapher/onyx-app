"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useBridgeOperations } from "@/hooks/bridge/useBridgeOperations";
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

    if (status === "COMPLETED") {
        color = "text-green-400 bg-green-500/10";
    } else if (status === "FAILED" || status === "EXPIRED") {
        color = "text-red-400 bg-red-500/10";
    } else {
        color = "text-yellow-400 bg-yellow-500/10";
    }

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
            {status}
        </span>
    );
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

    if (sorted.length === 0) {
        return (
            <p className="text-secondary text-sm text-center py-8">
                {t("history.empty")}
            </p>
        );
    }

    return (
        <div className="mt-6">
            <h3 className="text-primary text-lg font-medium mb-4">
                {t("history.title")}
            </h3>

            <div className="flex flex-col gap-2">
                {sorted.map((op) => (
                    <button
                        key={op.id}
                        type="button"
                        onClick={() => onSelectOperation(op)}
                        className="w-full bg-[#141414] border border-border-primary rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-primary font-medium">
                                {op.amountHuman} {op.token}
                            </span>
                            <span className="text-secondary text-sm">
                                {op.direction === "SOURCE_TO_GOLIATH"
                                    ? t("history.toGoliath")
                                    : t("history.toSource")}
                            </span>
                        </div>
                        <StatusBadge status={op.status} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BridgeHistoryPanel;
