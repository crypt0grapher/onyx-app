"use client";

import { useState, useCallback } from "react";
import { switchToChain } from "@/lib/wallet/chain";
import { networkToChainConfig, getNetworkByChainId } from "@/config/networks";

/**
 * Custom hook for switching networks via wallet RPC methods.
 * Unlike wagmi's useSwitchChain, this handles the case where
 * a chain already exists in the wallet with different parameters
 * (e.g. added manually via a block explorer) by retrying
 * wallet_switchEthereumChain after a failed wallet_addEthereumChain.
 */
export function useSwitchNetwork() {
    const [isPending, setIsPending] = useState(false);

    const switchNetwork = useCallback(
        async ({ chainId }: { chainId: number }) => {
            const network = getNetworkByChainId(chainId);
            if (!network) return;

            setIsPending(true);
            try {
                const chainConfig = networkToChainConfig(network);
                await switchToChain(chainConfig);
            } finally {
                setIsPending(false);
            }
        },
        []
    );

    return { switchNetwork, isPending };
}
