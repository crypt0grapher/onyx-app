"use client";

import { useTranslations } from "next-intl";
import { useStakeVariant } from "@/config/features";
import DataBoxesSection from "@/components/stake/DataBoxesSection";
import Divider from "@/components/ui/common/Divider";
import StakeActionPanel from "@/components/stake/StakeActionPanel";
import StakeStats from "@/components/stake/StakeStats";
import StakingHistoryTable from "@/components/stake/StakingHistoryTable";
import GoliathYieldPanel from "@/components/goliath-yield/GoliathYieldPanel";
import GoliathDataBoxes from "@/components/goliath-yield/GoliathDataBoxes";
import GoliathUserStats from "@/components/goliath-yield/GoliathUserStats";
import GoliathStakingHistory from "@/components/goliath-yield/GoliathStakingHistory";
import OnyxBackground from "@/components/ui/common/OnyxBackground";

export default function Home() {
    const stakeVariant = useStakeVariant();

    if (stakeVariant === "stxcn-goliath") {
        return <GoliathStakePage />;
    }

    return <EthereumStakePage />;
}

function GoliathStakePage() {
    const t = useTranslations("goliathYield");

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] h-screen lg:p-6">
                {/* Protocol Data Boxes */}
                <div className="px-0 md:px-4 lg:px-0">
                    <GoliathDataBoxes />
                </div>
                <Divider className="mt-[24px] mb-[25px] hidden md:block" />

                {/* Main Content: Staking Panel + User Stats */}
                <div className="flex flex-col 2xl:flex-row gap-[24px] lg:gap-4 px-4 lg:px-0">
                    <Divider className="mt-[24px] mb-[25px] block md:hidden" />

                    {/* Left Column: Staking Panel with OnyxBackground */}
                    <div className="flex-1 flex flex-col">
                        <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                            {t("title")}
                        </h2>
                        <p className="text-secondary text-[14px] leading-[20px] mb-[16px] md:mb-[24px]">
                            {t("description")}
                        </p>
                        <div className="flex-1 relative">
                            <div className="relative z-10">
                                <GoliathYieldPanel />
                            </div>
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 -z-0 opacity-30 pointer-events-none">
                                <OnyxBackground
                                    marginTop="mt-0"
                                    visibility="hidden md:block"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: User Position Stats */}
                    <div className="flex-1 flex flex-col">
                        <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                            {t("userStatsTitle")}
                        </h2>
                        <p className="text-secondary text-[14px] leading-[20px] mb-[16px] md:mb-[24px]">
                            {t("userStatsDescription")}
                        </p>
                        <div className="flex-1">
                            <GoliathUserStats />
                        </div>
                    </div>
                </div>

                {/* Staking History */}
                <Divider className="mt-[24px] mb-[25px]" />
                <div className="px-4 lg:px-0 pb-[46px]">
                    <h2 className="text-primary text-[24px] leading-[32px] mb-[4px]">
                        {t("historyTitle")}
                    </h2>
                    <p className="text-secondary text-[14px] leading-[20px] mb-[16px] md:mb-[24px]">
                        {t("historyDescription")}
                    </p>
                    <GoliathStakingHistory />
                </div>
            </main>
        </div>
    );
}

function EthereumStakePage() {
    const t = useTranslations("staking");

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] h-screen lg:p-6">
                <div className="px-0 md:px-4 lg:px-0">
                    <DataBoxesSection />
                </div>
                <Divider className="mt-[24px] mb-[25px] hidden md:block" />

                <div className="flex flex-col 2xl:flex-row gap-[24px] lg:gap-4 px-4 lg:px-0">
                    <Divider className="mt-[24px] mb-[25px] block md:hidden" />
                    <div className="flex-1 flex flex-col">
                        <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                            {t("title")}
                        </h2>
                        <p className="text-secondary text-[14px] leading-[20px] mb-[16px] md:mb-[24px]">
                            {t("description")}
                        </p>
                        <div className="flex-1">
                            <StakeActionPanel />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                            {t("stakedTokensTitle")}
                        </h2>
                        <p className="text-secondary text-[14px] leading-[20px] mb-[16px] md:mb-[24px]">
                            {t("stakedTokensDescription")}
                        </p>
                        <div className="flex-1">
                            <StakeStats />
                        </div>
                    </div>
                </div>

                <Divider className="mt-[24px] mb-[25px]" />
                <div className="px-4 lg:px-0 pb-[46px]">
                    <h2 className="text-primary text-[24px] leading-[32px] mb-[4px]">
                        {t("historyTitle")}
                    </h2>
                    <p className="text-secondary text-[14px] leading-[20px] mb-[16px] md:mb-[24px]">
                        {t("historyDescription")}
                    </p>
                    <StakingHistoryTable />
                </div>
            </main>
        </div>
    );
}
