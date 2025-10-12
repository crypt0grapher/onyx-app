import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import StatusBadge from "@/components/ui/pills/StatusBadge";
import {
  Proposal,
  proposalStatusConfig,
  userVoteStatusConfig,
} from "@/config/governance";
import { formatLargeNumber } from "@/utils/format";

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

  const forVotesNum = Number(proposal.forVotes || 0) / 1e18;
  const againstVotesNum = Number(proposal.againstVotes || 0) / 1e18;
  const totalVotes = forVotesNum + againstVotesNum;
  const forPercent = totalVotes > 0 ? (forVotesNum / totalVotes) * 100 : 0;
  const againstPercent =
    totalVotes > 0 ? (againstVotesNum / totalVotes) * 100 : 0;
  const forVotesFormatted = formatLargeNumber(forVotesNum, 2);
  const againstVotesFormatted = formatLargeNumber(againstVotesNum, 2);

  return (
    <div
      onClick={handleClick}
      className="flex p-4 flex-col items-start gap-2 rounded-[8px] border border-[#1F1F1F] bg-[#141414] cursor-pointer transition-all duration-200 ease-out hover:border-[#2F2F2F] hover:bg-[#1A1A1A] hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20 active:scale-[0.99]"
    >
      <div className="hidden md:flex flex-col w-full gap-2">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col items-start gap-2 flex-1">
            <div className="flex items-center gap-[8px]">
              <StatusBadge variant="normal">#{proposal.proposalId}</StatusBadge>
              <StatusBadge 
                variant={statusConfig.variant}
                customBgColor={statusConfig.customBgColor}
                customTextColor={statusConfig.customTextColor}
              >
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
            <StatusBadge variant="normal">{proposal.created}</StatusBadge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex h-[4px] rounded-full bg-[#292929] w-full mt-1">
          <div
            className="bg-[#0CCD32] rounded-l-full"
            style={{ width: `${forPercent}%` }}
          />
          <div
            className="bg-[#CD360C] rounded-r-full"
            style={{ width: `${againstPercent}%` }}
          />
        </div>

        {/* Vote Counts */}
        <div className="flex justify-between items-center w-full mt-3">
          <div className="overflow-hidden text-ellipsis font-sans text-xs font-medium leading-4 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
            <span className="text-secondary">For: </span>
            <span className="text-primary">{forVotesFormatted} XCN</span>
          </div>
          <div className="overflow-hidden text-ellipsis font-sans text-xs font-medium leading-4 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
            <span className="text-secondary">Against: </span>
            <span className="text-primary">{againstVotesFormatted} XCN</span>
          </div>
        </div>
      </div>

      <div className="flex md:hidden flex-col items-start gap-2 w-full">
        <div className="flex items-center gap-[8px]">
          <StatusBadge variant="normal">#{proposal.proposalId}</StatusBadge>
          <StatusBadge 
            variant={statusConfig.variant}
            customBgColor={statusConfig.customBgColor}
            customTextColor={statusConfig.customTextColor}
          >
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

        {/* Progress Bar */}
        <div className="flex h-[4px] rounded-full bg-[#292929] self-stretch mt-3">
          <div
            className="bg-[#0CCD32] rounded-l-full"
            style={{ width: `${forPercent}%` }}
          />
          <div
            className="bg-[#CD360C] rounded-r-full"
            style={{ width: `${againstPercent}%` }}
          />
        </div>

        {/* Vote Counts */}
        <div className="flex justify-between items-center self-stretch mt-3">
          <div className="overflow-hidden text-ellipsis font-sans text-xs font-medium leading-4 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
            <span className="text-secondary">For: </span>
            <span className="text-primary">{forVotesFormatted} XCN</span>
          </div>
          <div className="overflow-hidden text-ellipsis font-sans text-xs font-medium leading-4 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
            <span className="text-secondary">Against: </span>
            <span className="text-primary">{againstVotesFormatted} XCN</span>
          </div>
        </div>

        <div className="mt-3">
          <StatusBadge variant="normal">{proposal.created}</StatusBadge>
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;
