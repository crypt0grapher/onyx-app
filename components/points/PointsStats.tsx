"use client";

import { useTranslations } from "next-intl";
import useUserPoints from "@/hooks/points/useUserPoints";
import usePointsAPR from "@/hooks/points/usePointsAPR";
import LoadingDots from "@/components/ui/common/LoadingDots";
import EnrollButton from "./EnrollButton";
import { formatToReadablePercentage } from "@/utils/format";

const PointsStats = () => {
    const t = useTranslations("points");
    const { data, isLoading: isLoadingPoints } = useUserPoints();
    const { data: pointsApr, isLoading: isLoadingAPR } = usePointsAPR();

    const rawPoints = data?.points ?? 0;
    const points =
        typeof rawPoints === "string" ? parseFloat(rawPoints) : rawPoints;

    return (
        <div className="flex flex-col p-4 gap-2 rounded-[8px] border border-stroke-lines bg-box-primary">
            <div className="flex items-center gap-8">
                <div className="flex flex-col">
                    <span className="text-text-primary text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {isLoadingPoints ? (
                            <LoadingDots size="md" variant="inline" />
                        ) : (
                            Number(points).toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                            })
                        )}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-text-secondary text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {t("myPoints")}
                        </span>
                    </div>
                </div>

                <EnrollButton />

                <div className="w-[1px] h-[55px] bg-stroke-lines" />

                <div className="flex flex-col">
                    <span className="text-text-primary text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {isLoadingAPR ? (
                            <LoadingDots size="md" variant="inline" />
                        ) : (
                            formatToReadablePercentage(
                                pointsApr?.toNumber() || 0
                            )
                        )}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-text-secondary text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {t("pointsApr")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PointsStats;
