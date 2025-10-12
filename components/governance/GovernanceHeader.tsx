"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ProposalButton from "./ProposalButton";
import CreateProposalModal from "./CreateProposalModal";
import plusIcon from "@/assets/icons/plus_white.svg";
import infoIcon from "@/assets/icons/info.svg";
import { useProposalThreshold } from "@/hooks/governance/useProposalThreshold";
import { useVotingPower } from "@/hooks/governance/useVotingPower";
import { useLatestProposalIdByProposer } from "@/hooks/governance/useLatestProposalIdByProposer";
import { useProposalState } from "@/hooks/governance/useProposalState";
import { useToast } from "@/hooks";

const GovernanceHeader = () => {
    const t = useTranslations("governance");
    const tToast = useTranslations("toast.governance");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { thresholdWei } = useProposalThreshold();
    const { votesWei } = useVotingPower();
    const { latestProposalId } = useLatestProposalIdByProposer();
    const { state: latestProposalState } = useProposalState(
        latestProposalId ?? undefined
    );
    const { showDangerToast } = useToast();

    const hasEnoughVotes = (() => {
        if (thresholdWei === null || votesWei === null) return false;
        try {
            return votesWei >= thresholdWei;
        } catch {
            return false;
        }
    })();

    const hasActiveProposal =
        latestProposalState !== null &&
        (latestProposalState === 0 || latestProposalState === 1);

    const canCreate = hasEnoughVotes && !hasActiveProposal;

    const handleCreateProposal = () => {
        if (!hasEnoughVotes) {
            return;
        }

        if (hasActiveProposal) {
            showDangerToast(
                tToast("alreadyHasActiveProposal"),
                tToast("alreadyHasActiveProposalSubtext")
            );
            return;
        }

        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center justify-between mb-[16px] md:mb-6">
                <div>
                    <h1 className="text-primary mb-[4px] text-[24px] font-medium leading-8 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("title")}
                    </h1>
                    <p className="text-secondary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("description")}
                    </p>
                </div>

                <div className="flex flex-col items-end">
                    <ProposalButton
                        label={t("createProposal")}
                        icon={plusIcon}
                        secondIcon={infoIcon}
                        onClick={handleCreateProposal}
                        backgroundColor="#141414"
                        disabled={!canCreate}
                        showTooltip={true}
                    />
                </div>
            </div>

            <CreateProposalModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </>
    );
};

export default GovernanceHeader;
