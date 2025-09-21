"use client";

import { useTranslations } from "next-intl";
import FarmRow from "@/components/farm/FarmRow";
import Divider from "@/components/ui/common/Divider";
import FarmActionPanel from "@/components/farm/FarmActionPanel";
import FarmStats from "@/components/farm/FarmStats";

import SecondaryButton from "@/components/ui/buttons/SecondaryButton";

import wethIcon from "@/assets/farms/WETH.png";
import xcnIcon from "@/assets/icons/XCN.svg";
import { useFarmsData } from "@/hooks/farm/useFarmsData";
import { useAddLiquidity } from "@/hooks/farm/useAddLiquidity";
import FARMS from "@/config/farms";

export default function Farm() {
    const t = useTranslations("farms");
    const { farms, isLoading } = useFarmsData();
    const { addLiquidity } = useAddLiquidity();
    const farm = farms[0];
    return (
        <div className="min-h-screen h-full">
            <main className="lg:ml-[304px] h-full mb-[16px] lg:p-6">
                <div className="px-4 lg:px-0">
                    <h1 className="text-[#E6E6E6] mb-[4px] text-[24px] font-medium leading-8 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("title")}
                    </h1>
                    <p className="text-[#808080] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("description")}
                    </p>

                    <div className="mt-6 flex w-full flex-col items-start border border-border-primary bg-[#141414] rounded-[8px]">
                        <FarmRow
                            firstTokenIcon={wethIcon}
                            secondTokenIcon={xcnIcon}
                            title={farm?.title || "XCN / WETH"}
                            subtitle={farm?.subtitle || "Onyx / Wrapped ETH"}
                            stakingAPR={
                                farm?.stakingAPR || (isLoading ? "--" : "0.00%")
                            }
                            dailyEmission={
                                farm?.dailyEmission ||
                                (isLoading ? "--" : "0.00")
                            }
                            totalStaked={
                                farm?.totalStaked ||
                                (isLoading ? "--" : "0.00 ($0.00)")
                            }
                            hasXCNIcon={true}
                        />

                        <Divider className="mt-[20px] mb-[17px]" />

                        <div className="flex flex-col 2xl:flex-row gap-4 w-full px-4">
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1">
                                    <FarmActionPanel />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <div className="flex-1">
                                    <FarmStats />
                                </div>
                            </div>
                        </div>

                        <Divider className="mt-[16px] mb-[17px]" />

                        <div className="px-4 pb-4 w-full">
                            <SecondaryButton
                                label={t("addLiquidity")}
                                onClick={() => addLiquidity(0)}
                                className="w-full lg:w-auto"
                                aria-label={`${t("addLiquidity")} for ${
                                    FARMS[0].token.symbol
                                }/${FARMS[0].quoteToken.symbol} pair`}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
