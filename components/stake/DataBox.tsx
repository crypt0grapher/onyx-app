import React from "react";
import StatusBadge from "@/components/ui/pills/StatusBadge";
import Image from "next/image";

import tradeIcon from "@/assets/icons/trade.svg";
import dailyEmissionIcon from "@/assets/icons/daily_emission.svg";
import stakeIcon from "@/assets/icons/stake.svg";
import bankIcon from "@/assets/icons/bank.svg";
import pointsIcon from "@/assets/icons/points.svg";

type DataBoxType = "staking" | "emission" | "staked" | "treasury" | "points";
type BadgeVariant = "success" | "normal" | "danger";

interface DataBoxProps {
    type: DataBoxType;
    badgeText?: string;
    badgeVariant?: BadgeVariant;
    value: string | React.ReactNode;
    label: string;
    className?: string;
}

const DataBox: React.FC<DataBoxProps> = ({
    type,
    badgeText,
    badgeVariant,
    value,
    label,
    className,
}) => {
    const getIcon = (type: DataBoxType) => {
        const iconMap = {
            staking: tradeIcon,
            emission: dailyEmissionIcon,
            staked: stakeIcon,
            treasury: bankIcon,
            points: pointsIcon,
        };
        return iconMap[type];
    };

    return (
        <div
            className={`flex w-[280px] md:w-full min-w-[120px] h-[128px] p-[16px] flex-col justify-end items-start rounded-[8px] border border-[#1F1F1F] bg-[#141414] shrink-0 md:shrink ${className}`}
        >
            {badgeText ? (
                <div className="flex items-start justify-end w-full">
                    <StatusBadge variant={badgeVariant ?? "normal"}>
                        {badgeText}
                    </StatusBadge>
                </div>
            ) : null}

            <div className="flex items-center mb-2">
                <Image
                    src={getIcon(type)}
                    alt={label}
                    width={20}
                    height={20}
                    className={`${
                        getIcon(type) === stakeIcon ? "opacity-60" : ""
                    }`}
                />
            </div>

            <div className="text-[#E6E6E6] text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                {value}
            </div>

            <div className="text-[#808080] text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                {label}
            </div>
        </div>
    );
};

export default DataBox;
