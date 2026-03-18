"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { formatEther } from "viem";
import DataBox from "@/components/stake/DataBox";
import LoadingDots from "@/components/ui/common/LoadingDots";
import { useGoliathYieldData } from "@/hooks/goliath-yield/useGoliathYieldData";

function formatLargeNumber(value: bigint): string {
    const num = parseFloat(formatEther(value));
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
}

const GoliathDataBoxes: React.FC = () => {
    const t = useTranslations("goliathYield.dataBoxes");
    const { apr, protocolData, isLoading } = useGoliathYieldData();

    const renderValue = (
        value: string,
        loading: boolean
    ): string | React.ReactNode => {
        if (loading)
            return <LoadingDots className="justify-start min-w-[60px]" />;
        return value;
    };

    const stakingAPR = renderValue(`${apr.toFixed(2)}%`, isLoading);
    const protocolFee = renderValue(
        protocolData
            ? `${(protocolData.feePercentBps / 100).toFixed(2)}%`
            : "0.00%",
        isLoading
    );
    const totalSupply = renderValue(
        protocolData ? formatLargeNumber(protocolData.totalSupply) : "0.00",
        isLoading
    );
    const contractBalance = renderValue(
        protocolData
            ? formatLargeNumber(protocolData.contractBalance)
            : "0.00",
        isLoading
    );

    return (
        <div className="flex gap-[15px] overflow-x-auto overflow-y-hidden scrollbar-hide md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-visible">
            <DataBox
                type="staking"
                value={stakingAPR}
                label={t("stakingAPR")}
                className="ml-4 md:ml-0"
            />
            <DataBox
                type="points"
                value={protocolFee}
                label={t("protocolFee")}
            />
            <DataBox
                type="staked"
                value={totalSupply}
                label={t("totalSupply")}
            />
            <DataBox
                type="treasury"
                value={contractBalance}
                label={t("contractBalance")}
                className="mr-4 md:mr-0"
            />
        </div>
    );
};

export default GoliathDataBoxes;
