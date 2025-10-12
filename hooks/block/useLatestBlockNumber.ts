"use client";

import { useBlockNumber, useChainId } from "wagmi";

const TEN_MINUTES_MS = 600_000;

export const useLatestBlockNumber = () => {
    const chainId = useChainId();
    const { data } = useBlockNumber({
        chainId,
        watch: false,
        query: {
            refetchInterval: TEN_MINUTES_MS,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
            staleTime: TEN_MINUTES_MS,
        },
    });

    return { chainId, blockNumber: data ? Number(data) : undefined } as const;
};

export default useLatestBlockNumber;
