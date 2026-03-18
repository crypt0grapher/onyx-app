"use client";

import { useTranslations } from "next-intl";
import { useAccount, useSwitchChain } from "wagmi";
import { useWallet } from "@/context/WalletProvider";
import { getGoliathNetwork } from "@/config/networks";
import GoliathYieldPanel from "@/components/goliath-yield/GoliathYieldPanel";
import GoliathDataBoxes from "@/components/goliath-yield/GoliathDataBoxes";
import GoliathUserStats from "@/components/goliath-yield/GoliathUserStats";
import GoliathStakingHistory from "@/components/goliath-yield/GoliathStakingHistory";
import GoliathBackground from "@/components/ui/common/GoliathBackground";
import Divider from "@/components/ui/common/Divider";

export default function Home() {
    return <GoliathStakePage />;
}

function GoliathStakePage() {
    const t = useTranslations("goliathYield");
    const { isConnected } = useWallet();
    const { chainId } = useAccount();
    const { switchChain, isPending } = useSwitchChain();
    const goliathNetwork = getGoliathNetwork();
    const isOnGoliath = chainId === goliathNetwork.chainId;
    const needsSwitch = isConnected && !isOnGoliath;

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] h-screen lg:p-6">
                {/* Protocol Data Boxes */}
                <div className="px-0 md:px-4 lg:px-0 pt-[48px] lg:pt-[40px]">
                    <GoliathDataBoxes />
                </div>
                <Divider className="mt-[24px] mb-[25px] hidden md:block" />

                {/* Connect to Goliath banner */}
                {needsSwitch && (
                    <div className="mx-4 lg:mx-0 mt-4 mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#1F1F1F] bg-[#141414] px-5 py-4">
                        <p className="text-secondary text-sm">
                            {t("wrongNetwork")}
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                switchChain({
                                    chainId: goliathNetwork.chainId,
                                })
                            }
                            disabled={isPending}
                            className="flex-shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isPending
                                ? t("switchingNetwork")
                                : t("connectToGoliath")}
                        </button>
                    </div>
                )}

                {/* Main Content: Staking Panel + User Stats */}
                <div className="flex flex-col 2xl:flex-row gap-[24px] lg:gap-4 px-4 lg:px-0">
                    <Divider className="mt-[24px] mb-[25px] block md:hidden" />

                    {/* Left Column: Staking Panel with GoliathBackground */}
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
                                <GoliathBackground
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
