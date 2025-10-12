"use client";

import React, { useMemo } from "react";
import { useAccount } from "wagmi";
import { useTranslations } from "next-intl";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import { RawProposal } from "@/lib/governance/format";
import { useProposalState } from "@/hooks/governance/useProposalState";
import { useProposalEta } from "@/hooks/governance/useProposalEta";
import { usePriorVotes } from "@/hooks/governance/usePriorVotes";
import { useProposalThreshold } from "@/hooks/governance/useProposalThreshold";
import { useCancelProposal } from "@/hooks/governance/useCancelProposal";
import { useQueueProposal } from "@/hooks/governance/useQueueProposal";
import { useExecuteProposal } from "@/hooks/governance/useExecuteProposal";
import { useVotingPower } from "@/hooks/governance/useVotingPower";
import { useToast } from "@/hooks";

interface ProposalActionsProps {
  proposalId: string | number;
  raw?: RawProposal | null;
}

const ProposalActions: React.FC<ProposalActionsProps> = ({
  proposalId,
  raw,
}) => {
  const { address } = useAccount();
  const t = useTranslations("governance.proposal.actions");
  const tToast = useTranslations("toast.governance");
  const { showDangerToast } = useToast();

  const { state } = useProposalState(proposalId);
  const { eta } = useProposalEta(proposalId);
  const { thresholdWei } = useProposalThreshold();
  const { votesWei } = useVotingPower();
  const { priorVotes } = usePriorVotes({
    address,
    blockNumber: raw?.startBlock,
  });

  const { cancelProposal, isLoading: isCancelling } = useCancelProposal();
  const { queueProposal, isLoading: isQueueing } = useQueueProposal();
  const { executeProposal, isLoading: isExecuting } = useExecuteProposal();

  const hasSufficientPower = useMemo(() => {
    if (!votesWei || !thresholdWei) return false;
    return votesWei >= thresholdWei;
  }, [votesWei, thresholdWei]);

  const canCancel = useMemo(() => {
    if (!priorVotes || !thresholdWei) return false;
    return priorVotes >= thresholdWei;
  }, [priorVotes, thresholdWei]);

  const canExecute = useMemo(() => {
    if (!eta) return false;
    return Date.now() >= eta.getTime();
  }, [eta]);

  const timeUntilExecution = useMemo(() => {
    if (!eta) return null;
    const diff = eta.getTime() - Date.now();
    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [eta]);

  const handleCancel = async () => {
    if (!canCancel) {
      showDangerToast(
        tToast("insufficientVotingPower") || "Insufficient Voting Power",
        tToast("insufficientVotingPowerSubtext") ||
          "You need enough votes to cancel this proposal"
      );
      return;
    }
    await cancelProposal(proposalId);
  };

  const handleQueue = async () => {
    await queueProposal(proposalId);
  };

  const handleExecute = async () => {
    await executeProposal(proposalId);
  };

  if (state === 1 && address && hasSufficientPower) {
    return (
      <div className="flex items-center gap-4 mt-6">
        <SecondaryButton
          label={
            isCancelling
              ? t("cancelling") || "Cancelling..."
              : t("cancel") || "Cancel Proposal"
          }
          onClick={handleCancel}
          disabled={!canCancel || isCancelling}
          className={
            isCancelling
              ? "opacity-60 cursor-wait"
              : !canCancel
              ? "opacity-50 cursor-not-allowed"
              : ""
          }
        />
        {!canCancel && (
          <span className="text-secondary text-sm">
            {t("cannotCancel") ||
              "You don't have enough voting power to cancel this proposal"}
          </span>
        )}
      </div>
    );
  }

  if (state === 4 && hasSufficientPower) {
    return (
      <div className="flex items-center gap-4 mt-6">
        <PrimaryButton
          label={
            isQueueing
              ? t("queueing") || "Queueing..."
              : t("queue") || "Queue Proposal"
          }
          onClick={handleQueue}
          disabled={isQueueing}
          className={`!w-auto ${isQueueing ? "opacity-60 cursor-wait" : ""}`}
        />
      </div>
    );
  }

  if (state === 5 && hasSufficientPower) {
    if (canExecute) {
      return (
        <div className="flex items-center gap-4 mt-6">
          <PrimaryButton
            label={
              isExecuting
                ? t("executing") || "Executing..."
                : t("execute") || "Execute Proposal"
            }
            onClick={handleExecute}
            disabled={isExecuting}
            className={`!w-auto ${
              isExecuting
                ? "opacity-60 cursor-wait"
                : "bg-green-600 hover:bg-green-700"
            }`}
          />
        </div>
      );
    }

    if (timeUntilExecution) {
      return (
        <div className="flex items-center gap-4 mt-6">
          <PrimaryButton
            label={
              t("timeUntilExecutable", {
                time: timeUntilExecution,
              }) || `Executable in ${timeUntilExecution}`
            }
            disabled={true}
            className="!w-auto bg-green-600/50"
          />
        </div>
      );
    }
  }

  return null;
};

export default ProposalActions;
