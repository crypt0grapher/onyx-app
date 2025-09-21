"use client";

import { useQuery } from "@tanstack/react-query";
import { SubgraphService } from "@/lib/api";

export const useProposalCount = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["gov-proposal-count"],
        queryFn: async () => {
            const service = new SubgraphService();
            const res = await service.getProposals(1, 0);
            const countStr = res.proposalCounts?.[0]?.count ?? "0";
            const count = parseInt(countStr, 10);
            const finalCount = Number.isFinite(count) ? count + 6 : 6;
            return finalCount;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    return { total: data ?? 0, isLoading, isError, refetch };
};

export default useProposalCount;
