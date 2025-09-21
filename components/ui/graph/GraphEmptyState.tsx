"use client";

import React from "react";
import Image from "next/image";
import ConnectWalletButton from "../../sidebar/ConnectWalletButton";
import { useTranslations } from "next-intl";
import onyxLogoShadow from "@/assets/onyx_logo_shadow.svg";

interface GraphEmptyStateProps {
    title: string;
    description: string | React.ReactNode;
    showConnectButton?: boolean;
    className?: string;
}

const GraphEmptyState: React.FC<GraphEmptyStateProps> = ({
    title,
    description,
    showConnectButton = true,
    className = "",
}) => {
    const tSidebarWallet = useTranslations("sidebar.wallet");
    return (
        <div
            className={`flex flex-col pt-4 items-center justify-between h-full ${className}`}
        >
            <Image
                src={onyxLogoShadow}
                alt="Onyx Logo Shadow"
                width={136}
                height={140}
                priority={false}
            />
            <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-0">
                    <h3 className="text-primary text-[20px] font-medium leading-[28px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] text-center">
                        {title}
                    </h3>
                    <div className="text-secondary text-[14px] font-normal leading-[20px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] text-center">
                        {description}
                    </div>
                </div>
            </div>
            {showConnectButton && (
                <ConnectWalletButton
                    label={tSidebarWallet("connect")}
                    usePrimaryButton={true}
                />
            )}
        </div>
    );
};

export default GraphEmptyState;
