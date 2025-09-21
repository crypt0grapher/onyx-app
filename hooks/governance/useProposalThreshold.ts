"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { CONTRACTS } from "@/contracts";

export const useProposalThreshold = () => {
    const publicClient = usePublicClient();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["gov-threshold"],
        enabled: Boolean(publicClient),
        queryFn: async () => {
            const value = (await publicClient!.readContract({
                address: CONTRACTS.governorBravoDelegator.address,
                abi: CONTRACTS.governorBravoDelegator.abi as never,
                functionName: "proposalThreshold",
            })) as bigint;
            return value;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    return {
        thresholdWei: (data ?? null) as bigint | null,
        isLoading,
        isError,
        refetch,
    };
};

export default useProposalThreshold;
