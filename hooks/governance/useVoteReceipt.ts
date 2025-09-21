"use client";

import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACTS } from "@/contracts";

export const useVoteReceipt = (proposalId?: string | number) => {
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["gov-vote-receipt", address, String(proposalId ?? "")],
        enabled: Boolean(publicClient && address && proposalId !== undefined),
        queryFn: async () => {
            const id = BigInt(String(proposalId));
            const receipt = (await publicClient!.readContract({
                address: CONTRACTS.governorBravoDelegator.address,
                abi: CONTRACTS.governorBravoDelegator.abi as never,
                functionName: "getReceipt",
                args: [id, address!],
            })) as { hasVoted?: boolean; support?: boolean; votes?: bigint };
            return {
                hasVoted: Boolean((receipt as any)?.hasVoted),
                support: (receipt as any)?.support as boolean | undefined,
                votes: (receipt as any)?.votes as bigint | undefined,
            };
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    return { receipt: data, isLoading, isError, refetch };
};

export default useVoteReceipt;
