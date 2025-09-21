"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import Divider from "@/components/ui/common/Divider";
import {
    ProposalHeader,
    VoteCard,
    TimelineCard,
    ProposalDescription,
} from "@/components/governance";
import useProposal from "@/hooks/governance/useProposal";
import useProposalVotes from "@/hooks/governance/useProposalVotes";
import useProposalTimeline, {
    type TimelineEvent,
} from "@/hooks/governance/useProposalTimeline";
import { useProposalCountdown } from "@/hooks/governance/useProposalCountdown";
import ProposalDetailSkeleton from "@/components/governance/ProposalDetailSkeleton";
import { useCastVote } from "@/hooks/governance/useCastVote";
import { useProposalState } from "@/hooks/governance/useProposalState";

type VoteRow = { address: string; votes: string; href?: string };

export default function ProposalDetailPage() {
    const params = useParams();
    const idParam = (params?.id as string) || "";
    const t = useTranslations("governance.proposal");

    const { data: proposalData, isLoading: isProposalLoading } =
        useProposal(idParam);
    const { votes, isLoading: isVotesLoading } = useProposalVotes(idParam);
    const uiProposal = proposalData?.ui || null;
    const raw = proposalData?.raw || null;
    const { data: timelineEvents, isLoading: isTimelineLoading } =
        useProposalTimeline(raw);
    const { message: countdownLabel, countdown } = useProposalCountdown(raw);
    const { castVote } = useCastVote();
    const { state } = useProposalState(uiProposal?.proposalId);

    const txHash = raw?.createdTransactionHash || "";

    const forRows: VoteRow[] = votes?.forRows ?? [];
    const againstRows: VoteRow[] = votes?.againstRows ?? [];

    const timeline = useMemo(() => {
        const safe = (key: string, fallback: string) => {
            try {
                return t(`timeline.${key}` as never);
            } catch {
                return fallback;
            }
        };
        return (
            timelineEvents?.map((e: TimelineEvent) => ({
                label: safe(e.type, e.type),
                date: e.date.toLocaleString(),
                type: e.type,
                eventDate: e.date,
            })) || []
        );
    }, [timelineEvents, t]);

    const isLoading = isProposalLoading || isVotesLoading || isTimelineLoading;

    if (isLoading) return <ProposalDetailSkeleton />;

    return (
        <div className="lg:min-h-screen mb-[32px] lg:mb-0 h-full">
            <main className="lg:ml-[304px] h-full mb-[16px] lg:p-6">
                <div className="px-4 lg:px-0">
                    <ProposalHeader
                        title={uiProposal?.title || "--"}
                        txHash={txHash}
                    />

                    <Divider className="my-[24px]" />

                    <div className="grid grid-cols-1 2xl:grid-cols-[0.5fr_0.5fr_27%] gap-4">
                        <div className="2xl:order-3">
                            <TimelineCard
                                countdown={countdown}
                                countdownLabel={countdownLabel}
                                timeline={timeline}
                            />
                        </div>

                        <VoteCard
                            type="for"
                            title={t("voteFor")}
                            percentage={votes?.totals.forPercent || "--"}
                            totalVotes={votes?.totals.forVotes || "--"}
                            rows={forRows}
                            disabled={state !== null && state !== 1}
                            onVote={async (support: boolean) => {
                                if (uiProposal?.proposalId != null) {
                                    await castVote(
                                        uiProposal.proposalId,
                                        support
                                    );
                                }
                            }}
                        />

                        <VoteCard
                            type="against"
                            title={t("voteAgainst")}
                            percentage={votes?.totals.againstPercent || "--"}
                            totalVotes={votes?.totals.againstVotes || "--"}
                            rows={againstRows}
                            disabled={state !== null && state !== 1}
                            onVote={async (support: boolean) => {
                                if (uiProposal?.proposalId != null) {
                                    await castVote(
                                        uiProposal.proposalId,
                                        support
                                    );
                                }
                            }}
                        />
                    </div>

                    <Divider className="my-[24px]" />

                    <ProposalDescription
                        description={uiProposal?.description || ""}
                        raw={raw}
                    />
                </div>
            </main>
        </div>
    );
}
