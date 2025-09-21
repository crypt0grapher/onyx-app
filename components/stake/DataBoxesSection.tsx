"use client";

import React from "react";
import { useTranslations } from "next-intl";
import DataBox from "./DataBox";
import LoadingDots from "@/components/ui/common/LoadingDots";
import { useStakingData } from "@/hooks/staking/useStakingData";
import { usePointsAPR } from "@/hooks/points/usePointsAPR";
import { formatToReadablePercentage } from "@/utils/format";

const DataBoxesSection: React.FC = () => {
    const t = useTranslations("staking.dataBoxes");
    const {
        stakingAPR,
        dailyEmission,
        totalStaked,
        totalTreasury,
        isLoading,
        isError,
    } = useStakingData();
    const {
        data: pointsApr,
        isLoading: isLoadingAPR,
        error: pointsAprError,
    } = usePointsAPR();

    const renderValue = (
        value: string,
        isLoading: boolean,
        isError: boolean
    ): string | React.ReactNode => {
        if (isError) return "N/A";
        if (isLoading)
            return <LoadingDots className="justify-start min-w-[60px]" />;
        return value;
    };

    const displayData = {
        stakingAPR: renderValue(stakingAPR, isLoading, isError),
        dailyEmission: renderValue(dailyEmission, isLoading, isError),
        totalStaked: renderValue(totalStaked, isLoading, isError),
        totalTreasury: renderValue(totalTreasury, isLoading, isError),
        pointsAPR: pointsAprError ? (
            "N/A"
        ) : isLoadingAPR || !pointsApr ? (
            <LoadingDots className="justify-start min-w-[60px]" />
        ) : (
            formatToReadablePercentage(pointsApr.toNumber())
        ),
    };

    return (
        <div className="flex gap-[15px] overflow-x-auto overflow-y-hidden scrollbar-hide md:grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 md:overflow-visible">
            <DataBox
                type="staking"
                value={displayData.stakingAPR}
                label={t("stakingAPR")}
                className="ml-4 md:ml-0"
            />
            <DataBox
                type="emission"
                value={displayData.dailyEmission}
                label={t("dailyEmission")}
            />
            <DataBox
                type="staked"
                value={displayData.totalStaked}
                label={t("totalStaked")}
            />
            <DataBox
                type="treasury"
                value={displayData.totalTreasury}
                label={t("totalTreasury")}
            />
            <DataBox
                type="points"
                value={displayData.pointsAPR}
                label={t("pointsAPR")}
                className="mr-4 md:mr-0"
            />
        </div>
    );
};

export default DataBoxesSection;
