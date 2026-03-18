"use client";

import { useTranslations } from "next-intl";
import { formatEther } from "viem";
import type { StakingSnapshot } from "@/hooks/migration/types";

interface MigrationSummaryProps {
    snapshot: StakingSnapshot;
}

export default function MigrationSummary({ snapshot }: MigrationSummaryProps) {
    const t = useTranslations("migrate");

    const formatAmount = (value: bigint) => {
        const formatted = formatEther(value);
        return parseFloat(formatted).toLocaleString(undefined, {
            maximumFractionDigits: 4,
        });
    };

    const total = snapshot.staked + snapshot.rewards + snapshot.walletXcn;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#141414] border border-border-primary rounded-xl p-6">
                <p className="text-secondary text-sm mb-2">
                    {t("summary.staked")}
                </p>
                <p className="text-primary text-xl font-medium">
                    {formatAmount(snapshot.staked)} XCN
                </p>
            </div>
            <div className="bg-[#141414] border border-border-primary rounded-xl p-6">
                <p className="text-secondary text-sm mb-2">
                    {t("summary.rewards")}
                </p>
                <p className="text-primary text-xl font-medium">
                    {formatAmount(snapshot.rewards)} XCN
                </p>
            </div>
            <div className="bg-[#141414] border border-border-primary rounded-xl p-6">
                <p className="text-secondary text-sm mb-2">
                    {t("summary.wallet")}
                </p>
                <p className="text-primary text-xl font-medium">
                    {formatAmount(snapshot.walletXcn)} XCN
                </p>
            </div>
            <div className="md:col-span-3 bg-[#1a1a2e] border border-border-primary rounded-xl p-6">
                <p className="text-secondary text-sm mb-2">
                    {t("summary.total")}
                </p>
                <p className="text-primary text-2xl font-semibold">
                    {formatAmount(total)} XCN
                </p>
            </div>
        </div>
    );
}
