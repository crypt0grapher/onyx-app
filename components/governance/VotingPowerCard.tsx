"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import plusIcon from "@/assets/icons/plus_white.svg";
import dashboardIcon from "@/assets/icons/dsahboard.svg";
import governanceBg from "@/assets/governance/onyx_bg_governance.svg";
import { useVotingPower } from "@/hooks/governance/useVotingPower";
import { formatXcnAmountFromWei } from "@/utils/amount";
import LoadingDots from "@/components/ui/common/LoadingDots";
import { useRouter } from "next/navigation";

const VotingPowerCard = () => {
    const t = useTranslations("governance");
    const { votesWei, isLoading } = useVotingPower();
    const router = useRouter();

    return (
        <div className="relative lg:h-[128px] lg:col-span-2 2xl:col-span-1 p-4 flex items-end justify-between rounded-[8px] border border-[#1F1F1F] bg-[#141414] overflow-hidden">
            <Image
                src={governanceBg}
                alt=""
                width={243}
                height={128}
                className="absolute top-0 right-[-50px] md:right-0"
            />

            <div className="relative z-10">
                <div className="flex items-center mb-2">
                    <Image
                        src={dashboardIcon}
                        alt="Voting Power"
                        width={20}
                        height={20}
                        className="opacity-80"
                    />
                </div>
                <div className="text-primary text-[20px] font-medium leading-[28px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {isLoading ? (
                        <LoadingDots size="md" variant="inline" />
                    ) : (
                        formatXcnAmountFromWei(
                            votesWei !== null ? votesWei.toString() : "0",
                            18,
                            0
                        )
                    )}
                </div>
                <div className="text-secondary text-[14px] font-normal leading-[20px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("cards.votingPower.title")}
                </div>
            </div>

            <div className="relative z-10 self-start md:self-center">
                <PrimaryButton
                    label={t("cards.addVotingPower")}
                    icon={plusIcon}
                    onClick={() => {
                        router.push("/");
                    }}
                    iconOnly={true}
                />
            </div>
        </div>
    );
};

export default VotingPowerCard;
