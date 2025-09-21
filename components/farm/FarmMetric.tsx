"use client";

import React from "react";
import Image from "next/image";
import { type ImageLikeSrc, toSrc } from "@/utils/image";

type FarmMetricProps = {
    label: string;
    value: string;
    icon?: ImageLikeSrc;
    showIcon?: boolean;
    className?: string;
};

const FarmMetric: React.FC<FarmMetricProps> = ({
    label,
    value,
    icon,
    showIcon = false,
    className = "",
}) => {
    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex items-center gap-1">
                <span className="text-[#E6E6E6] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis">
                    {value}
                </span>
                {showIcon && icon && (
                    <Image
                        src={toSrc(icon)}
                        alt="Metric icon"
                        width={20}
                        height={20}
                    />
                )}
            </div>
            <span className="text-[#808080] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis mt-1">
                {label}
            </span>
        </div>
    );
};

export default FarmMetric;
