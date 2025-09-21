"use client";

import { useChainId, useChains } from "wagmi";

const ETHEREUM_CHAIN_ID = 1;

export const useNetworkCheck = () => {
    const chainId = useChainId();
    const chains = useChains();

    const currentChain = chains.find((chain) => chain.id === chainId);

    return {
        isOnEthereum: chainId === ETHEREUM_CHAIN_ID,
        currentChainId: chainId,
        currentChainName: currentChain?.name,
    };
};

export default useNetworkCheck;
