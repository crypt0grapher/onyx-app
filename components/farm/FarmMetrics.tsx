"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { type ImageLikeSrc } from "@/utils/image";
import { parseStakedValue } from "@/utils/farm";
import FarmMetric from "./FarmMetric";

type FarmMetricsProps = {
    stakingAPR: string;
    dailyEmission: string;
    totalStaked: string;
    hasXCNIcon?: boolean;
    xcnIcon?: ImageLikeSrc;
};

const FarmMetrics: React.FC<FarmMetricsProps> = ({
    stakingAPR,
    dailyEmission,
    totalStaked,
    hasXCNIcon = false,
    xcnIcon,
}) => {
    const t = useTranslations("farms.farmRow");

    const stakedData = parseStakedValue(totalStaked);

    return (
        <div className="hidden 2xl:flex items-center">
            <FarmMetric label={t("stakingAPR")} value={stakingAPR} />

            <div className="w-px h-[52px] bg-[#1F1F1F] mx-6" />

            <FarmMetric
                label={t("dailyEmission")}
                value={dailyEmission}
                icon={xcnIcon}
                showIcon={hasXCNIcon}
            />

            <div className="w-px h-[52px] bg-[#1F1F1F] mx-6" />

            <div className="flex flex-col min-w-[228px]">
                <div className="flex items-center gap-1">
                    <span className="text-[#E6E6E6] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis">
                        {stakedData.main}
                    </span>
                    {stakedData.secondary && (
                        <span className="text-[#808080] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:1] text-ellipsis">
                            {stakedData.secondary}
                        </span>
                    )}
                </div>
                <span className="text-[#808080] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis mt-1">
                    {t("totalStaked")}
                </span>
            </div>
        </div>
    );
};

export default FarmMetrics;
