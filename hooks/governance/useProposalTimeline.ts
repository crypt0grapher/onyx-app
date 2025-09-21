import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { CONTRACTS } from "@/contracts";
import type { RawProposal } from "@/lib/governance/format";

export type TimelineEventType =
    | "created"
    | "active"
    | "succeed"
    | "queued"
    | "execute"
    | "canceled";

export type TimelineEvent = { type: TimelineEventType; date: Date };

export const useProposalTimeline = (raw?: RawProposal | null) => {
    const publicClient = usePublicClient();

    return useQuery({
        queryKey: ["gov-proposal-timeline", raw?.id],
        enabled: Boolean(raw && publicClient),
        queryFn: async () => {
            if (!raw || !publicClient) return [] as TimelineEvent[];

            const events: TimelineEvent[] = [];

            const num = (s?: string | null) => (s ? Number(s) : 0);
            const bn = (s?: string | null) => {
                try {
                    return s ? BigInt(s) : BigInt(0);
                } catch {
                    return BigInt(0);
                }
            };

            if (raw.createdBlockTimestamp) {
                events.push({
                    type: "created",
                    date: new Date(num(raw.createdBlockTimestamp) * 1000),
                });
            }

            try {
                const startBlock = bn(raw.startBlock);
                if (startBlock > BigInt(0)) {
                    const start = await publicClient.getBlock({
                        blockNumber: startBlock,
                    });
                    if (start?.timestamp) {
                        events.push({
                            type: "active",
                            date: new Date(Number(start.timestamp) * 1000),
                        });
                    }
                }
            } catch {}

            let endTimestampMs: number | undefined;
            try {
                const endBlock = bn(raw.endBlock);
                if (endBlock > BigInt(0)) {
                    const end = await publicClient.getBlock({
                        blockNumber: endBlock,
                    });
                    if (end?.timestamp) {
                        endTimestampMs = Number(end.timestamp) * 1000;
                    }
                }
            } catch {}

            try {
                const governor = CONTRACTS.governorBravoDelegator;
                const quorumVotes = (await publicClient.readContract({
                    address: governor.address,
                    abi: governor.abi as never,
                    functionName: "quorumVotes",
                })) as bigint;

                const forVotes = bn(raw.forVotes);
                const againstVotes = bn(raw.againstVotes);

                const hasSucceeded =
                    forVotes >= againstVotes && forVotes >= quorumVotes;
                if (hasSucceeded && endTimestampMs) {
                    events.push({
                        type: "succeed",
                        date: new Date(endTimestampMs),
                    });
                }
            } catch {}

            if (raw.queuedBlockTimestamp) {
                events.push({
                    type: "queued",
                    date: new Date(num(raw.queuedBlockTimestamp) * 1000),
                });
            }

            if (raw.executedBlockTimestamp) {
                events.push({
                    type: "execute",
                    date: new Date(num(raw.executedBlockTimestamp) * 1000),
                });
            }

            if (raw.canceledBlockTimestamp) {
                events.push({
                    type: "canceled",
                    date: new Date(num(raw.canceledBlockTimestamp) * 1000),
                });
            }

            events.sort((a, b) => a.date.getTime() - b.date.getTime());
            return events;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });
};

export default useProposalTimeline;
