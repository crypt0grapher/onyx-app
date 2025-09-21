"use client";

import React from "react";
import { type ImageLikeSrc } from "@/utils/image";
import xcnIcon from "@/assets/icons/XCN.svg";
import TokenPairIcons from "./TokenPairIcons";
import FarmInfo from "./FarmInfo";
import FarmMetrics from "./FarmMetrics";
import FarmRowMobile from "./FarmRowMobile";

type FarmRowProps = {
    firstTokenIcon: ImageLikeSrc;
    secondTokenIcon: ImageLikeSrc;
    title: string;
    subtitle: string;
    stakingAPR: string;
    dailyEmission: string;
    totalStaked: string;
    hasXCNIcon?: boolean;
};

const FarmRow: React.FC<FarmRowProps> = ({
    firstTokenIcon,
    secondTokenIcon,
    title,
    subtitle,
    stakingAPR,
    dailyEmission,
    totalStaked,
    hasXCNIcon = false,
}) => {
    return (
        <div className="flex w-full pt-[20px] flex-col px-4">
            <div className="flex flex-col gap-4 2xl:gap-0 2xl:flex-row 2xl:items-center">
                <div className="flex items-center flex-1">
                    <TokenPairIcons
                        firstTokenIcon={firstTokenIcon}
                        secondTokenIcon={secondTokenIcon}
                    />
                    <FarmInfo title={title} subtitle={subtitle} />
                </div>

                <FarmMetrics
                    stakingAPR={stakingAPR}
                    dailyEmission={dailyEmission}
                    totalStaked={totalStaked}
                    hasXCNIcon={hasXCNIcon}
                    xcnIcon={xcnIcon}
                />
            </div>

            <FarmRowMobile
                stakingAPR={stakingAPR}
                dailyEmission={dailyEmission}
                totalStaked={totalStaked}
                hasXCNIcon={hasXCNIcon}
                xcnIcon={xcnIcon}
            />
        </div>
    );
};

export default FarmRow;
