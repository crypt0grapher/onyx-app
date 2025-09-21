import { useTranslations } from "next-intl";
import Image from "next/image";
import stakeIcon from "@/assets/icons/stake.svg";
import dashboardIcon from "@/assets/icons/dsahboard.svg";
import { useVotingPower } from "@/hooks/governance/useVotingPower";
import { formatXcnAmountFromWei } from "@/utils/amount";
import { useProposalCount } from "@/hooks/governance/useProposalCount";
import LoadingDots from "@/components/ui/common/LoadingDots";

interface StakedTokensCardProps {
    showMobileTotalProposals?: boolean;
}

const StakedTokensCard = ({
    showMobileTotalProposals = false,
}: StakedTokensCardProps) => {
    const t = useTranslations("governance");
    const { votesWei, isLoading: loadingVotes } = useVotingPower();
    const { total, isLoading: loadingCount } = useProposalCount();

    return (
        <div className="p-4 w-full flex flex-col justify-end items-start rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
            <div className="lg:hidden w-full space-y-[12px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                        <Image
                            src={stakeIcon}
                            alt="Staked Tokens"
                            width={20}
                            height={20}
                            className="opacity-60"
                        />
                        <span className="text-secondary text-[14px] font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {t("cards.stakedTokens.title")}
                        </span>
                    </div>
                    <span className="text-primary text-[16px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {loadingVotes ? (
                            <LoadingDots size="sm" variant="inline" />
                        ) : (
                            formatXcnAmountFromWei(
                                votesWei !== null ? votesWei.toString() : "0",
                                18,
                                0
                            )
                        )}
                    </span>
                </div>

                {showMobileTotalProposals && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[8px]">
                            <Image
                                src={dashboardIcon}
                                alt="Total Proposals"
                                width={20}
                                height={20}
                                className="opacity-80"
                            />
                            <span className="text-secondary text-[14px] font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                {t("cards.totalProposals.title")}
                            </span>
                        </div>
                        <span className="text-primary text-[16px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {loadingCount ? (
                                <LoadingDots size="sm" variant="inline" />
                            ) : (
                                total
                            )}
                        </span>
                    </div>
                )}
            </div>

            <div className="hidden lg:block">
                <div className="flex items-center mb-2">
                    <Image
                        src={stakeIcon}
                        alt="Staked Tokens"
                        width={20}
                        height={20}
                        className="opacity-60"
                    />
                </div>
                <div className="text-primary text-[20px] font-medium leading-[28px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {loadingVotes ? (
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
                    {t("cards.stakedTokens.title")}
                </div>
            </div>
        </div>
    );
};

export default StakedTokensCard;
