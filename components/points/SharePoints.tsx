"use client";

import { useTranslations } from "next-intl";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import BridgeIcon from "@/assets/points/bridge.svg";
import { type ImageLikeSrc } from "@/utils/image";

const SharePoints = () => {
    const t = useTranslations("points");

    const handleBridgeClick = () => {
        window.open(
            "https://bridge.onyx.org/",
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <div className="rounded-[8px] border border-stroke-lines bg-box-primary">
            <div className="flex justify-between items-center py-[18px] px-4">
                <div className="flex flex-col">
                    <span className="text-text-primary text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("bridge.bridgeXcn")}
                    </span>
                    <span className="text-text-secondary text-[14px] font-normal leading-[20px] mt-1 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("bridge.bridgeDescription")}
                    </span>
                </div>
                <SecondaryButton
                    label={t("bridge.bridge")}
                    icon={BridgeIcon as ImageLikeSrc}
                    onClick={handleBridgeClick}
                />
            </div>
        </div>
    );
};

export default SharePoints;
