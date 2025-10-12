"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { CONTRACTS } from "@/contracts";
import { Address } from "viem";

export type UsePriorVotesParams = {
    address?: Address | string;
    blockNumber?: bigint | number | string;
};

export const usePriorVotes = ({ address, blockNumber }: UsePriorVotesParams) => {
    const publicClient = usePublicClient();

    const addressKey = address || "";
    const blockKey = blockNumber ? String(blockNumber) : "";

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["gov-prior-votes", addressKey, blockKey],
        enabled: Boolean(
            publicClient && address && blockNumber !== undefined
        ),
        queryFn: async () => {
            const block =
                typeof blockNumber === "bigint"
                    ? blockNumber
                    : BigInt(String(blockNumber));

            const priorVotes = (await publicClient!.readContract({
                address: CONTRACTS.xcnStaking.address,
                abi: CONTRACTS.xcnStaking.abi as never,
                functionName: "getPriorVotes",
                args: [address as Address, block],
            })) as bigint;

            return priorVotes;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    return {
        priorVotes: (data ?? null) as bigint | null,
        isLoading,
        isError,
        refetch,
    };
};

export default usePriorVotes;
