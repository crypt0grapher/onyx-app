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

    const rows = [
        { label: t("summary.staked"), value: snapshot.staked },
        { label: t("summary.rewards"), value: snapshot.rewards },
        { label: t("summary.wallet"), value: snapshot.walletXcn },
    ];

    return (
        <div className="bg-[#141414]/80 backdrop-blur-xl border border-[#ffffff08] rounded-2xl p-6">
            <div className="space-y-0">
                {rows.map((row, index) => (
                    <div key={index}>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-[13px] text-secondary uppercase tracking-wider">
                                {row.label}
                            </span>
                            <span className="text-primary text-[15px] font-medium font-[var(--font-geist-mono)]">
                                {formatAmount(row.value)}{" "}
                                <span className="text-secondary text-[13px]">
                                    XCN
                                </span>
                            </span>
                        </div>
                        {index < rows.length - 1 && (
                            <div className="h-px bg-[#ffffff06]" />
                        )}
                    </div>
                ))}

                {/* Divider before total */}
                <div className="h-px bg-[#ffffff10]" />

                {/* Total row */}
                <div className="flex items-center justify-between pt-4 pb-1">
                    <span className="text-[13px] text-secondary uppercase tracking-wider">
                        {t("summary.total")}
                    </span>
                    <span className="text-white text-[18px] font-semibold font-[var(--font-geist-mono)]">
                        {formatAmount(total)}{" "}
                        <span className="text-secondary text-[14px] font-medium">
                            XCN
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}
