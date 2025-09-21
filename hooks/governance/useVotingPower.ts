"use client";

import { useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACTS, STAKING_CONSTANTS } from "@/contracts";

export type UseVotingPowerResult = {
    votesWei: bigint | null;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
};

export const useVotingPower = (): UseVotingPowerResult => {
    const { address, chainId } = useAccount();
    const publicClient = usePublicClient();

    const enabled = Boolean(
        address && publicClient && chainId === CONTRACTS.xcnStaking.chainId
    );

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["gov-voting-power", address],
        enabled,
        queryFn: async () => {
            if (!publicClient || !address) return null;
            try {
                const poolId = BigInt(STAKING_CONSTANTS.XCN_POOL_ID);
                const result = (await publicClient.readContract({
                    address: CONTRACTS.xcnStaking.address,
                    abi: CONTRACTS.xcnStaking.abi as never,
                    functionName: "getStakingAmount",
                    args: [poolId, address],
                })) as bigint;
                return result;
            } catch {
                return null;
            }
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    const votesWei = useMemo(() => (data ?? null) as bigint | null, [data]);

    return { votesWei, isLoading, isError, refetch };
};

export default useVotingPower;
