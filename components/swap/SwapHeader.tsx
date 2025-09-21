"use client";

import { useTranslations } from "next-intl";

const SwapHeader = () => {
    const t = useTranslations("swap");

    return (
        <div className="flex justify-between items-center w-full mb-4">
            <div>
                <h1 className="text-text-primary text-2xl font-medium leading-8 mb-1 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("title")}
                </h1>
                <p className="text-text-secondary text-sm font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("description")}
                </p>
            </div>
        </div>
    );
};

export default SwapHeader;
