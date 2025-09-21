import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import StatusBadge from "@/components/ui/pills/StatusBadge";
import {
    Proposal,
    proposalStatusConfig,
    userVoteStatusConfig,
} from "@/config/governance";

interface ProposalCardProps {
    proposal: Proposal;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
    const router = useRouter();
    const t = useTranslations();
    const statusConfig = proposalStatusConfig[proposal.status];
    const voteConfig = userVoteStatusConfig[proposal.userVoteStatus];

    const handleClick = () => {
        router.push(`/governance/${proposal.proposalId}`);
    };

    return (
        <div
            onClick={handleClick}
            className="flex p-4 flex-col items-start gap-2 rounded-[8px] border border-[#1F1F1F] bg-[#141414] cursor-pointer transition-all duration-200 ease-out hover:border-[#2F2F2F] hover:bg-[#1A1A1A] hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20 active:scale-[0.99]"
        >
            <div className="hidden md:flex justify-between items-start w-full">
                <div className="flex flex-col items-start gap-2 flex-1">
                    <div className="flex items-center gap-[8px]">
                        <StatusBadge variant="normal">
                            #{proposal.proposalId}
                        </StatusBadge>
                        <StatusBadge variant={statusConfig.variant}>
                            {t(statusConfig.labelKey)}
                        </StatusBadge>
                        <StatusBadge variant={voteConfig.variant}>
                            {t(voteConfig.labelKey)}
                        </StatusBadge>
                    </div>

                    <h3 className="self-stretch overflow-hidden text-primary text-ellipsis font-sans text-xl font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
                        {proposal.title}
                    </h3>

                    <p className="self-stretch overflow-hidden text-secondary text-ellipsis mt-1 font-sans text-sm font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
                        {proposal.description}
                    </p>
                </div>

                <div className="flex-shrink-0 ml-4">
                    <StatusBadge variant="normal">
                        {proposal.created}
                    </StatusBadge>
                </div>
            </div>

            <div className="flex md:hidden flex-col items-start gap-2 w-full">
                <div className="flex items-center gap-[8px]">
                    <StatusBadge variant="normal">
                        #{proposal.proposalId}
                    </StatusBadge>
                    <StatusBadge variant={statusConfig.variant}>
                        {t(statusConfig.labelKey)}
                    </StatusBadge>
                    <StatusBadge variant={voteConfig.variant}>
                        {t(voteConfig.labelKey)}
                    </StatusBadge>
                </div>

                <h3 className="self-stretch overflow-hidden text-primary font-sans text-xl font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
                    {proposal.title}
                </h3>

                <p className="self-stretch overflow-hidden text-secondary text-ellipsis font-sans text-sm font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
                    {proposal.description}
                </p>

                <div className="mt-3">
                    <StatusBadge variant="normal">
                        {proposal.created}
                    </StatusBadge>
                </div>
            </div>
        </div>
    );
};

export default ProposalCard;
