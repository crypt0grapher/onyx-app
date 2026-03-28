"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { goliathConfig } from "@/config/goliath";
import BridgeForm from "@/components/bridge/BridgeForm";
import BridgeHistoryPanel from "@/components/bridge/BridgeHistoryPanel";
import BridgeStatusModal from "@/components/bridge/BridgeStatusModal";
import type { BridgeOperation } from "@/hooks/bridge/types";
import { useBridgeOperations } from "@/hooks/bridge/useBridgeOperations";

export default function Bridge() {
    const t = useTranslations("bridge");
    const [selectedOp, setSelectedOp] = useState<BridgeOperation | null>(null);
    const { updateOperation } = useBridgeOperations();

    if (!goliathConfig.bridge.bridgeEnabled) {
        return (
            <div className="min-h-screen">
                <main className="lg:ml-[304px] lg:p-6">
                    <div className="px-4 lg:px-0 flex items-center justify-center h-[60vh]">
                        <p className="text-secondary text-lg">
                            {t("validation.bridgeDisabled")}
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] lg:p-6">
                <div className="px-4 lg:px-0 flex flex-col items-center">
                    <div className="w-full max-w-[530px]">
                        <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                            {t("title")}
                        </h2>
                        <p className="text-secondary text-[14px] leading-[20px] mb-[24px]">
                            {t("subtitle")}
                        </p>
                    </div>
                    <BridgeForm />
                    <BridgeHistoryPanel
                        onSelectOperation={(op) => setSelectedOp(op)}
                    />
                </div>
            </main>

            {/* Status modal for viewing history operations */}
            <BridgeStatusModal
                operation={selectedOp}
                isOpen={!!selectedOp}
                onClose={() => setSelectedOp(null)}
                onStatusChange={updateOperation}
            />
        </div>
    );
}
