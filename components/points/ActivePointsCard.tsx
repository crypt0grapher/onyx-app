"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import StatusBadge from "@/components/ui/pills/StatusBadge";
import StakeIcon from "@/assets/icons/stake.svg";
import onyxLogoBackground from "@/assets/points/onyx-logo-points.svg";
import { type ImageLikeSrc } from "@/utils/image";

const ActivePointsCard = () => {
    const t = useTranslations("points");
    const handleExploreAppsClick = () => {
        window.open("https://app.onyx.org/en", "_blank");
    };

    return (
        <div className="flex h-[240px] p-4 flex-col justify-end items-start flex-shrink-0 rounded-[8px] border border-stroke-lines bg-box-primary relative overflow-hidden">
            <div className="absolute right-0 top-0">
                <Image
                    src={onyxLogoBackground}
                    alt="Onyx Logo Background"
                    width={288}
                    height={138}
                    className="object-contain"
                    priority
                />
            </div>

            <div className="flex flex-col z-10 relative w-full">
                <div className="mb-3">
                    <StatusBadge variant="success">
                        {t("status.active")}
                    </StatusBadge>
                </div>

                <h3 className="text-text-primary text-[20px] font-medium leading-[28px] mb-1 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("cards.activePoints.title")}
                </h3>

                <p className="text-text-secondary text-[14px] font-normal leading-[20px] max-w-[230px] lg:max-w-full mb-3 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("cards.activePoints.description")}
                </p>

                <div className="w-fit">
                    <SecondaryButton
                        label={t("cards.activePoints.exploreApps")}
                        icon={StakeIcon as ImageLikeSrc}
                        onClick={handleExploreAppsClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default ActivePointsCard;
