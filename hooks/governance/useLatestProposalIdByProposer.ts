"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { CONTRACTS } from "@/contracts";

export const useLatestProposalIdByProposer = () => {
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["gov-latest-proposal-id", address],
        enabled: Boolean(publicClient && address),
        queryFn: async () => {
            const id = (await publicClient!.readContract({
                address: CONTRACTS.governorBravoDelegator.address,
                abi: CONTRACTS.governorBravoDelegator.abi as never,
                functionName: "latestProposalIds",
                args: [address!],
            })) as bigint;
            return id;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    return {
        latestProposalId: (data ?? null) as bigint | null,
        isLoading,
        isError,
    };
};

export default useLatestProposalIdByProposer;
