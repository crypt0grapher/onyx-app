"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useGoliathYieldData } from "@/hooks/goliath-yield";
import LoadingDots from "@/components/ui/common/LoadingDots";

interface StatItemProps {
    label: string;
    value: string | React.ReactElement;
    hasBorderBottom?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({
    label,
    value,
    hasBorderBottom = false,
}) => (
    <div
        className={`flex justify-between items-center px-4 py-4 ${
            hasBorderBottom ? "border-b border-stroke-lines" : ""
        }`}
    >
        <span className="text-[#808080] text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
            {label}
        </span>
        <span className="text-[#E6E6E6] text-[16px] font-medium leading-[24px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] inline-flex items-center">
            {value}
        </span>
    </div>
);

function formatLargeNumber(value: bigint): string {
    const num = parseFloat(formatEther(value));
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toFixed(2);
}

const GoliathProtocolStats: React.FC = () => {
    const t = useTranslations("goliathYield");
    const { isConnected } = useAccount();
    const { protocolData, userData, apr, isLoading } = useGoliathYieldData();

    const renderValue = (
        value: string,
        loading: boolean,
    ): string | React.ReactElement => {
        if (loading)
            return (
                <LoadingDots
                    size="md"
                    variant="inline"
                    className="text-primary"
                />
            );
        return value;
    };

    const renderUserValue = (
        value: string,
        loading: boolean,
    ): string | React.ReactElement => {
        if (loading)
            return (
                <LoadingDots
                    size="md"
                    variant="inline"
                    className="text-primary"
                />
            );
        if (!isConnected) return "0.00 XCN";
        return value;
    };

    return (
        <div className="flex w-full h-full flex-col rounded-[8px] border border-border-primary bg-[#141414]">
            <div className="px-4 py-4 border-b border-stroke-lines">
                <h3 className="text-[#E6E6E6] text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("protocolStats")}
                </h3>
            </div>

            <StatItem
                label={t("totalSupply")}
                value={renderValue(
                    protocolData
                        ? `${formatLargeNumber(protocolData.totalSupply)} stXCN`
                        : "0.00 stXCN",
                    isLoading,
                )}
                hasBorderBottom
            />

            <StatItem
                label={t("apr")}
                value={renderValue(
                    `${apr.toFixed(2)}%`,
                    isLoading,
                )}
                hasBorderBottom
            />

            <StatItem
                label={t("fee")}
                value={renderValue(
                    protocolData
                        ? `${(protocolData.feePercentBps / 100).toFixed(2)}%`
                        : "0.00%",
                    isLoading,
                )}
                hasBorderBottom
            />

            <StatItem
                label={t("contractBalance")}
                value={renderValue(
                    protocolData
                        ? `${formatLargeNumber(protocolData.contractBalance)} XCN`
                        : "0.00 XCN",
                    isLoading,
                )}
                hasBorderBottom
            />

            <StatItem
                label={t("balance")}
                value={renderUserValue(
                    userData
                        ? `${parseFloat(formatEther(userData.stXcnBalance)).toFixed(4)} stXCN`
                        : "0.00 stXCN",
                    isLoading,
                )}
                hasBorderBottom
            />

            <StatItem
                label={t("underlyingValue")}
                value={renderUserValue(
                    userData
                        ? `${parseFloat(formatEther(userData.underlyingXcn)).toFixed(4)} XCN`
                        : "0.00 XCN",
                    isLoading,
                )}
            />
        </div>
    );
};

export default GoliathProtocolStats;
