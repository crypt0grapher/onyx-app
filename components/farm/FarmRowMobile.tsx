"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ImageLikeSrc, toSrc } from "@/utils/image";
import { parseStakedValue } from "@/utils/farm";
import Divider from "@/components/ui/common/Divider";

type FarmRowMobileProps = {
    stakingAPR: string;
    dailyEmission: string;
    totalStaked: string;
    hasXCNIcon?: boolean;
    xcnIcon?: ImageLikeSrc;
};

const FarmRowMobile: React.FC<FarmRowMobileProps> = ({
    stakingAPR,
    dailyEmission,
    totalStaked,
    hasXCNIcon = false,
    xcnIcon,
}) => {
    const t = useTranslations("farms.farmRow");

    const stakedData = parseStakedValue(totalStaked);

    return (
        <div className="2xl:hidden">
            <Divider className="mt-[16px] mb-[17px]" />

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[#808080] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis">
                        {t("stakingAPR")}
                    </span>
                    <span className="text-[#E6E6E6] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis text-right">
                        {stakingAPR}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[#808080] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis">
                        {t("dailyEmission")}
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="text-[#E6E6E6] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis text-right">
                            {dailyEmission}
                        </span>
                        {hasXCNIcon && xcnIcon && (
                            <Image
                                src={toSrc(xcnIcon)}
                                alt="XCN"
                                width={20}
                                height={20}
                            />
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[#808080] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis">
                        {t("totalStaked")}
                    </span>
                    <div className="flex items-center gap-1 text-right">
                        <span className="text-[#E6E6E6] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis">
                            {stakedData.main}
                        </span>
                        {stakedData.secondary && (
                            <span className="text-[#808080] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:1] text-ellipsis">
                                {stakedData.secondary}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmRowMobile;
