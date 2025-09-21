import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SubgraphService } from "@/lib/api";
import { formatLargeNumber } from "@/utils/format";
import { truncateAddress } from "@/utils/address";

export type VoteRow = { address: string; votes: string; href?: string };

export type ProposalVotes = {
    forRows: VoteRow[];
    againstRows: VoteRow[];
    totals: {
        forVotes: string;
        againstVotes: string;
        forPercent: string;
        againstPercent: string;
    };
};

export const useProposalVotes = (id?: string) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["gov-proposal-votes", id],
        enabled: Boolean(id),
        queryFn: async () => {
            const service = new SubgraphService();
            const { proposalVotes } = await service.getProposalVotes({ id });
            return proposalVotes;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    const result: ProposalVotes | undefined = useMemo(() => {
        if (!data) return undefined;
        const forVotes = data.filter((v) => String(v.support) === "true");
        const againstVotes = data.filter((v) => String(v.support) === "false");

        const sum = (arr: typeof data) =>
            arr.reduce((acc, v) => acc + Number(v.votes || 0), 0);

        const forSum = sum(forVotes);
        const againstSum = sum(againstVotes);
        const total = forSum + againstSum;

        const toRow = (v: (typeof data)[number]): VoteRow => ({
            address: truncateAddress(v.address),
            votes: formatLargeNumber(Number(v.votes) / 1e18, 2),
            href: `https://etherscan.io/address/${v.address}`,
        });

        return {
            forRows: forVotes.map(toRow),
            againstRows: againstVotes.map(toRow),
            totals: {
                forVotes: `${formatLargeNumber(forSum / 1e18, 2)}`,
                againstVotes: `${formatLargeNumber(againstSum / 1e18, 2)}`,
                forPercent:
                    total > 0
                        ? `${((forSum / total) * 100).toFixed(0)}% Votes`
                        : `0% Votes`,
                againstPercent:
                    total > 0
                        ? `${((againstSum / total) * 100).toFixed(0)}% Votes`
                        : `0% Votes`,
            },
        };
    }, [data]);

    return { votes: result, isLoading, isError, refetch };
};

export default useProposalVotes;
