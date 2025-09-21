"use client";

import React from "react";
import StakingDataBox from "@/components/stake/StakingDataBox";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import Divider from "@/components/ui/common/Divider";
import Image from "next/image";
import { type ImageLikeSrc } from "@/utils/image";

export interface DataBox {
    icon: ImageLikeSrc;
    value: string | React.ReactElement;
    description: string;
    showBadge?: boolean;
    hasBorderBottom?: boolean;
}

export interface MobileRow {
    icon: ImageLikeSrc;
    label: string;
    value: string | React.ReactElement;
}

export interface StatsDisplayProps {
    dataBoxes: DataBox[];
    graph?: React.ReactNode;
    onClaim: () => void;
    claimButtonLabel: string;
    isClaimDisabled: boolean;
    claimIcon: ImageLikeSrc;
    mobileRows: MobileRow[];
    shouldShowClaimButton?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
    dataBoxes,
    graph,
    onClaim,
    claimButtonLabel,
    isClaimDisabled,
    claimIcon,
    mobileRows,
    shouldShowClaimButton = true,
}) => {
    return (
        <div className="flex w-full h-full flex-col items-start rounded-[8px] border border-border-primary bg-[#141414]">
            <div className="hidden md:flex w-full h-full">
                <div className="flex flex-col w-[40%] border-r border-stroke-lines">
                    {dataBoxes.map((box, index) => (
                        <StakingDataBox
                            key={index}
                            icon={box.icon}
                            value={box.value}
                            description={box.description}
                            showBadge={box.showBadge}
                            hasBorderBottom={box.hasBorderBottom}
                        />
                    ))}
                </div>

                <div className="flex flex-col w-[60%] p-4 justify-between">
                    <div
                        className={`flex-1 ${
                            shouldShowClaimButton ? "mb-4" : ""
                        }`}
                    >
                        {graph}
                    </div>

                    {shouldShowClaimButton && (
                        <PrimaryButton
                            label={claimButtonLabel}
                            icon={claimIcon}
                            onClick={onClaim}
                            disabled={isClaimDisabled}
                        />
                    )}
                </div>
            </div>

            <div className="flex md:hidden w-full flex-col">
                <div className="flex flex-col px-4 py-4">
                    {mobileRows.map((row, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between ${
                                index < mobileRows.length - 1 ? "mb-4" : ""
                            }`}
                        >
                            <div className="flex items-center">
                                <Image
                                    src={
                                        typeof row.icon === "string"
                                            ? row.icon
                                            : row.icon.src
                                    }
                                    alt={row.label}
                                    width={20}
                                    height={20}
                                />
                                <span className="ml-2 text-[14px] font-normal leading-5 [color:#808080] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                    {row.label}
                                </span>
                            </div>
                            <span className="text-[16px] font-medium leading-6 [color:#E6E6E6] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>

                <Divider />

                {shouldShowClaimButton && (
                    <div className="px-4 py-4">
                        <PrimaryButton
                            label={claimButtonLabel}
                            icon={claimIcon}
                            onClick={onClaim}
                            disabled={isClaimDisabled}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsDisplay;
