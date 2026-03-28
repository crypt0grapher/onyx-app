"use client";

import { useTranslations } from "next-intl";
import { useAccount } from "wagmi";
import { useWallet } from "@/context/WalletProvider";
import { useSwitchNetwork } from "@/hooks/wallet/useSwitchNetwork";
import DataBoxesSection from "@/components/stake/DataBoxesSection";
import Divider from "@/components/ui/common/Divider";
import StakeActionPanel from "@/components/stake/StakeActionPanel";
import StakeStats from "@/components/stake/StakeStats";
import StakingHistoryTable from "@/components/stake/StakingHistoryTable";

const ETHEREUM_CHAIN_ID = 1;

export default function EthereumStakingPage() {
    const t = useTranslations("staking");
    const { isConnected } = useWallet();
    const { chainId } = useAccount();
    const { switchNetwork, isPending } = useSwitchNetwork();
    const isOnEthereum = chainId === ETHEREUM_CHAIN_ID;
    const needsSwitch = isConnected && !isOnEthereum;

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] h-screen lg:p-6">
                <div className="px-0 md:px-4 lg:px-0 pt-[48px] lg:pt-[40px]">
                    <DataBoxesSection />
                </div>

                {/* Connect to Ethereum banner */}
                {needsSwitch && (
                    <div className="mx-4 lg:mx-0 mt-4 mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#1F1F1F] bg-[#141414] px-5 py-4">
                        <p className="text-secondary text-sm">
                            {t("wrongNetwork")}
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                switchNetwork({ chainId: ETHEREUM_CHAIN_ID })
                            }
                            disabled={isPending}
                            className="flex-shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isPending
                                ? t("switchingNetwork")
                                : t("connectToEthereum")}
                        </button>
                    </div>
                )}

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
