"use client";

import { useBlockNumber, useChainId } from "wagmi";

export const useLatestBlockNumber = () => {
    const chainId = useChainId();
    const { data } = useBlockNumber({ watch: true, chainId });
    return { chainId, blockNumber: data ? Number(data) : undefined } as const;
};

export default useLatestBlockNumber;
