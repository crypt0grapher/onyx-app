"use client";

import { useTranslations } from "next-intl";
import PlaceSmall from "@/components/ui/pills/PlaceSmall";
import ExternalLink from "@/components/ui/common/ExternalLink";
import LoadingDots from "@/components/ui/common/LoadingDots";
import { buildExplorerUrl } from "@/utils/explorer";
import { truncateAddress } from "@/utils/address";
import { useLeaderboard } from "@/hooks/points/useLeaderboard";
import Divider from "../ui/common/Divider";

const TopWinners = () => {
    const t = useTranslations("points");

    const { data, isLoading } = useLeaderboard({ page: 1, limit: 3 });
    const topThree = data?.results || [];

    return (
        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-2 md:gap-6">
            {isLoading &&
                [0, 1, 2].map((idx) => (
                    <div
                        key={`skeleton-${idx}`}
                        className="flex flex-col p-4 bg-box-primary border border-stroke-lines rounded-[8px]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <PlaceSmall>#{idx + 1}</PlaceSmall>
                            <div className="flex items-center gap-2">
                                <LoadingDots size="md" variant="inline" />
                            </div>
                        </div>
                        <Divider className="mb-5" />
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-secondary text-[14px] font-normal leading-[32px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                    {t("points")}
                                </h3>
                            </div>
                            <div className="text-right">
                                <LoadingDots size="md" variant="inline" />
                            </div>
                        </div>
                    </div>
                ))}
            {!isLoading &&
                topThree.map((winner, index) => (
                    <div
                        key={winner.id}
                        className="flex flex-col p-4 bg-box-primary border border-stroke-lines rounded-[8px]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <PlaceSmall>#{index + 1}</PlaceSmall>
                            <div className="flex items-center gap-2">
                                <ExternalLink
                                    href={buildExplorerUrl(
                                        winner.address,
                                        "address"
                                    )}
                                >
                                    <span className="text-text-secondary group-hover:text-primary text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                        {truncateAddress(winner.address)}
                                    </span>
                                </ExternalLink>
                            </div>
                        </div>

                        <Divider className="mb-5" />

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-secondary text-[14px] font-normal leading-[32px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                    {t("points")}
                                </h3>
                            </div>
                            <div className="text-right">
                                <p className="text-text-primary text-[20px] font-medium leading-[32px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                    {Number(winner.points).toLocaleString(
                                        "en-US",
                                        {
                                            maximumFractionDigits: 2,
                                        }
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
};

export default TopWinners;
