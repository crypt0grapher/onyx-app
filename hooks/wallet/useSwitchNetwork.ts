"use client";

import { useState, useCallback } from "react";
import { switchChain as wagmiSwitchChain } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";
import { getNetworkByChainId } from "@/config/networks";

interface EthereumProvider {
    request: (params: {
        method: string;
        params?: unknown[];
    }) => Promise<unknown>;
}

/**
 * Custom hook for switching networks.
 *
 * Uses wagmi's switchChain as the sole switch/add mechanism. Wagmi
 * internally calls wallet_switchEthereumChain and, on 4902, follows
 * up with wallet_addEthereumChain — so we must never issue a second
 * wallet_addEthereumChain in the fallback path.
 *
 * If wagmi throws (e.g. the chain was added but the wallet did not
 * auto-select it), the fallback only retries wallet_switchEthereumChain
 * — never a duplicate add.
 */
export function useSwitchNetwork() {
    const [isPending, setIsPending] = useState(false);

    const switchNetwork = useCallback(
        async ({ chainId }: { chainId: number }) => {
            setIsPending(true);
            try {
                await wagmiSwitchChain(wagmiConfig, { chainId });
            } catch {
                // Wagmi already attempted wallet_addEthereumChain internally.
                // Do NOT call wallet_addEthereumChain again — that causes the
                // double-add prompt the user sees.
                //
                // Instead, try a plain wallet_switchEthereumChain: the chain
                // may now be registered after wagmi's add attempt, and this
                // will complete the switch without a second add prompt.
                const ethereum = (
                    window as { ethereum?: EthereumProvider }
                ).ethereum;
                if (!ethereum) return;

                const network = getNetworkByChainId(chainId);
                if (!network) return;

                try {
                    await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: network.chainIdHex }],
                    });
                } catch {
                    // Nothing more we can do programmatically.
                }
            } finally {
                setIsPending(false);
            }
        },
        []
    );

    return { switchNetwork, isPending };
}
