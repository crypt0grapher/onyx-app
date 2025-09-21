import React from "react";
import Image from "next/image";
import StatusBadge from "@/components/ui/pills/StatusBadge";

import { type ImageLikeSrc, toSrc } from "@/utils/image";

interface StakingDataBoxProps {
    icon: ImageLikeSrc;
    value: string | React.ReactElement;
    description: string;
    showBadge?: boolean;
    badgeText?: string;
    hasBorderBottom?: boolean;
}

const StakingDataBox: React.FC<StakingDataBoxProps> = ({
    icon,
    value,
    description,
    showBadge = false,
    badgeText,
    hasBorderBottom = false,
}) => {
    return (
        <div
            className={`
                flex 
                flex-1
                flex-col 
                justify-center
                items-start 
                gap-2 
                p-4
                ${hasBorderBottom ? "border-b border-stroke-lines" : ""}
            `}
        >
            <div className="flex justify-between items-center gap-2 w-full">
                <Image
                    src={toSrc(icon)}
                    alt=""
                    width={20}
                    height={20}
                    className="flex-shrink-0 opacity-60"
                />
                {showBadge && badgeText && (
                    <StatusBadge variant="success">{badgeText}</StatusBadge>
                )}
            </div>
            <div className="flex flex-col items-start gap-0">
                <span className="text-text-primary text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                    {value}
                </span>
                <span className="text-text-secondary text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                    {description}
                </span>
            </div>
        </div>
    );
};

export default StakingDataBox;
