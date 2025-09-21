"use client";

import { useTranslations } from "next-intl";
import { PointsStats, SharePoints } from "@/components/points";
import Divider from "../ui/common/Divider";
import useUserPoints from "@/hooks/points/useUserPoints";
import LoadingDots from "@/components/ui/common/LoadingDots";
import EnrollButton from "./EnrollButton";

const PointsStatsSection = () => {
    const t = useTranslations("points");

    const { data: pointsData, isLoading: isLoadingPoints } = useUserPoints();

    const rawPoints = pointsData?.points ?? 0;
    const points =
        typeof rawPoints === "string" ? parseFloat(rawPoints) : rawPoints;

    return (
        <>
            <div className="lg:hidden mb-[16px] p-4 rounded-[8px] border border-stroke-lines bg-box-primary">
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("myPoints")}
                    </span>
                    <div className="flex items-center">
                        <span className="text-text-primary text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {isLoadingPoints ? (
                                <LoadingDots size="md" variant="inline" />
                            ) : (
                                Number(points).toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex justify-center mt-4">
                    <EnrollButton />
                </div>
            </div>

            <div className="lg:hidden mt-4 mb-[24px]">
                <SharePoints />
            </div>

            <div className="lg:hidden w-full h-[1px] bg-stroke-lines mb-[24px]"></div>

            <div className="hidden lg:grid grid-cols-1 min-[1670px]:grid-cols-12 gap-6">
                <div className="min-[1670px]:col-span-8">
                    <PointsStats />
                </div>

                <div className="min-[1670px]:col-span-4">
                    <SharePoints />
                </div>
            </div>

            <Divider className="mt-[28px] hidden lg:block" />
        </>
    );
};

export default PointsStatsSection;
