"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useGoliathYieldData } from "@/hooks/goliath-yield";
import { isGoliathChain } from "@/config/networks";
import LoadingDots from "@/components/ui/common/LoadingDots";

import stakeIcon from "@/assets/icons/stake.svg";
import claimIcon from "@/assets/icons/claim.svg";
import tradeIcon from "@/assets/icons/trade.svg";

interface StatItemProps {
    icon: typeof stakeIcon;
    label: string;
    value: string | React.ReactElement;
    hasBorderBottom?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({
    icon,
    label,
    value,
    hasBorderBottom = false,
}) => (
    <div
        className={`flex justify-between items-center px-4 py-4 ${
            hasBorderBottom ? "border-b border-stroke-lines" : ""
        }`}
    >
        <div className="flex items-center gap-2">
            <Image
                src={typeof icon === "string" ? icon : icon.src}
                alt={label}
                width={20}
                height={20}
            />
            <span className="text-[#808080] text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                {label}
            </span>
        </div>
        <span className="text-[#E6E6E6] text-[16px] font-medium leading-[24px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] inline-flex items-center">
            {value}
        </span>
    </div>
);

const GoliathUserStats: React.FC = () => {
    const t = useTranslations("goliathYield");
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const onGoliath = isGoliathChain(chainId);
    const { userData, apr, isLoading } = useGoliathYieldData();

    const renderValue = (
        value: string,
        loading: boolean,
        requiresConnection: boolean = true,
        disconnectedFallback: string = "--",
    ): string | React.ReactElement => {
        if (loading)
            return (
                <LoadingDots
                    size="md"
                    variant="inline"
                    className="text-primary"
                />
            );
        if (!onGoliath) return "--";
        if (requiresConnection && !isConnected) return disconnectedFallback;
        return value;
    };

    const stXcnDisplay = userData
        ? `${parseFloat(formatEther(userData.stXcnBalance)).toFixed(4)} stXCN`
        : "0.0000 stXCN";

    const underlyingDisplay = userData
        ? `${parseFloat(formatEther(userData.underlyingXcn)).toFixed(4)} XCN`
        : "0.0000 XCN";

    const aprDisplay = `${apr.toFixed(2)}%`;

    return (
        <div className="flex w-full h-full flex-col rounded-[8px] border border-border-primary bg-[#141414]">
            <div className="px-4 py-4 border-b border-stroke-lines">
                <h3 className="text-[#E6E6E6] text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("userStatsTitle")}
                </h3>
            </div>

            <StatItem
                icon={stakeIcon}
                label={t("yourStXcnBalance")}
                value={renderValue(stXcnDisplay, isLoading, true, "--")}
                hasBorderBottom
            />

            <StatItem
                icon={claimIcon}
                label={t("yourUnderlyingXcn")}
                value={renderValue(underlyingDisplay, isLoading, true, "--")}
                hasBorderBottom
            />

            <StatItem
                icon={tradeIcon}
                label={t("currentApr")}
                value={renderValue(aprDisplay, isLoading, false)}
            />
        </div>
    );
};

export default GoliathUserStats;
