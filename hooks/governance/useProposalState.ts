"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { CONTRACTS } from "@/contracts";

export type GovernorState = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const useProposalState = (proposalId?: string | number | bigint) => {
    const publicClient = usePublicClient();
    const idKey = proposalId ? String(proposalId) : "";

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["gov-proposal-state", idKey],
        enabled: Boolean(publicClient && proposalId !== undefined),
        queryFn: async () => {
            const id =
                typeof proposalId === "bigint"
                    ? proposalId
                    : BigInt(String(proposalId));
            const s = (await publicClient!.readContract({
                address: CONTRACTS.governorBravoDelegator.address,
                abi: CONTRACTS.governorBravoDelegator.abi as never,
                functionName: "state",
                args: [id],
            })) as number;
            return s as GovernorState;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    return {
        state: (data ?? null) as GovernorState | null,
        isLoading,
        isError,
        refetch,
    };
};

export default useProposalState;
