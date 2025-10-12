import React from "react";
import { useTranslations } from "next-intl";
import Divider from "@/components/ui/common/Divider";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import StatusIcon from "@/components/ui/common/StatusIcon";
import ProgressBar from "@/components/ui/common/ProgressBar";
import VotingTable from "./VotingTable";
import MobileVoteCard from "./MobileVoteCard";
import voteIcon from "@/assets/icons/vote.svg";

interface VoteRow {
    address: string;
    votes: string;
    href?: string;
}

interface VoteCardProps {
    type: "for" | "against";
    title: string;
    percentage: string;
    totalVotes: string;
    rows: VoteRow[];
    disabled?: boolean;
    isLoading?: boolean;
    hasVoted?: boolean;
    votedFor?: boolean;
    onVote?: (support: boolean) => void;
}

const VoteCard: React.FC<VoteCardProps> = ({
    type,
    title,
    percentage,
    totalVotes,
    rows,
    disabled = false,
    isLoading = false,
    hasVoted = false,
    votedFor,
    onVote,
}) => {
    const t = useTranslations("governance.proposal");
    const variant = type === "for" ? "success" : "danger";

    let buttonLabel: string;
    if (isLoading) {
        buttonLabel = t("casting");
    } else if (hasVoted && votedFor !== undefined) {
        if (type === "for" && votedFor === true) {
            buttonLabel = t("votedFor");
        } else if (type === "against" && votedFor === false) {
            buttonLabel = t("votedAgainst");
        } else {
            buttonLabel = type === "for" ? t("voteFor") : t("voteAgainst");
        }
    } else {
        buttonLabel = type === "for" ? t("voteFor") : t("voteAgainst");
    }

    const handleVote = async () => {
        try {
            if (onVote) onVote(type === "for");
        } catch {}
    };

    return (
        <>
            <div className="hidden 2xl:flex h-[440px] p-4 flex-col items-start gap-4 shrink-0 rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                <div className="flex items-center w-full">
                    <StatusIcon variant={variant} />
                    <div className="flex flex-col ml-4">
                        <span className="text-primary text-[20px] leading-[28px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {title}
                        </span>
                        <span className="text-secondary text-[14px] leading-5 font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {percentage}
                        </span>
                    </div>
                    <div className="ml-auto text-primary text-[20px] leading-[28px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {totalVotes}
                    </div>
                </div>

                <ProgressBar
                    value={parseFloat(percentage) || 0}
                    variant={variant}
                />

                <Divider />

                <VotingTable
                    rows={rows}
                    rowBackgroundColor="#1B1B1B"
                    headerBackgroundColor="#1B1B1B"
                />

                <div className="mt-auto w-full">
                    <Divider />
                    <div className="pt-4">
                        <PrimaryButton
                            label={buttonLabel}
                            icon={voteIcon}
                            onClick={handleVote}
                            disabled={disabled || isLoading || hasVoted}
                        />
                    </div>
                </div>
            </div>

            <div className="block 2xl:hidden">
                <MobileVoteCard
                    type={type}
                    title={title}
                    percentage={percentage}
                    totalVotes={totalVotes}
                    rows={rows}
                    disabled={disabled}
                    isLoading={isLoading}
                    hasVoted={hasVoted}
                    votedFor={votedFor}
                    onVote={onVote}
                />
            </div>
        </>
    );
};

export default VoteCard;
