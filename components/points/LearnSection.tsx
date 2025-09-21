"use client";

import { useTranslations } from "next-intl";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import ExternalLinkIcon from "@/assets/icons/open_explorer.svg";
import { type ImageLikeSrc } from "@/utils/image";
import { openPointsDocumentation } from "@/config/points";

const LearnSection = () => {
    const t = useTranslations("points");

    const handleLearnMoreClick = () => {
        openPointsDocumentation("overview");
    };

    return (
        <>
            <div className="lg:hidden mb-[16px]">
                <div className="flex flex-col">
                    <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                        {t("howToEarnTitle")}
                    </h2>
                    <p className="text-secondary text-[14px] leading-[20px] mb-[16px]">
                        {t("howToEarnDescription")}
                    </p>
                    <SecondaryButton
                        label={t("learnMore")}
                        icon={ExternalLinkIcon as ImageLikeSrc}
                        className="w-full"
                        onClick={handleLearnMoreClick}
                    />
                </div>
            </div>

            <div className="hidden lg:flex items-center justify-between mb-[24px] ">
                <div className="flex flex-col">
                    <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                        {t("howToEarnTitle")}
                    </h2>
                    <p className="text-secondary text-[14px] leading-[20px]">
                        {t("howToEarnDescription")}
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <SecondaryButton
                        label={t("learnMore")}
                        icon={ExternalLinkIcon as ImageLikeSrc}
                        onClick={handleLearnMoreClick}
                    />
                </div>
            </div>
        </>
    );
};

export default LearnSection;
