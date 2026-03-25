"use client";

import { useState, useCallback } from "react";
import { switchChain as wagmiSwitchChain } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";
import { getNetworkByChainId, networkToChainConfig } from "@/config/networks";

interface EthereumProvider {
    request: (params: {
        method: string;
        params?: unknown[];
    }) => Promise<unknown>;
}

interface WalletError {
    code: number;
    message: string;
}

/**
 * Custom hook for switching networks.
 *
 * Primary path: wagmi's switchChain (updates wagmi state + waits for
 * chainChanged event).
 *
 * Fallback: direct wallet_addEthereumChain — handles the case where
 * the chain already exists in the wallet with different parameters
 * (e.g. user added it via a block explorer). Per EIP-3085,
 * wallet_addEthereumChain both registers and switches to the chain
 * in a single call, so no extra wallet_switchEthereumChain is needed.
 */
export function useSwitchNetwork() {
    const [isPending, setIsPending] = useState(false);

    const switchNetwork = useCallback(
        async ({ chainId }: { chainId: number }) => {
            setIsPending(true);
            try {
                // Primary: wagmi handles provider selection + state update
                await wagmiSwitchChain(wagmiConfig, { chainId });
            } catch {
                // Wagmi failed — typically means wallet_switchEthereumChain
                // got 4902, then wallet_addEthereumChain didn't actually
                // switch (MetaMask quirk with pre-existing custom chains).
                //
                // Fallback: call wallet_addEthereumChain directly and let
                // EIP-3085 handle the switch. Do NOT call
                // wallet_switchEthereumChain afterwards — the redundant call
                // can race with MetaMask's internal chain-change and prevent
                // the switch from completing.
                const ethereum = (
                    window as { ethereum?: EthereumProvider }
                ).ethereum;
                if (!ethereum) return;

                const network = getNetworkByChainId(chainId);
                if (!network) return;

                const chainConfig = networkToChainConfig(network);

                try {
                    await ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: chainConfig.chainId,
                                chainName: chainConfig.chainName,
                                rpcUrls: chainConfig.rpcUrls,
                                nativeCurrency: chainConfig.nativeCurrency,
                                blockExplorerUrls:
                                    chainConfig.blockExplorerUrls,
                            },
                        ],
                    });
                    // EIP-3085: successful add = chain is now active.
                    // wagmi will pick up the chainChanged event automatically.
                } catch (addError: unknown) {
                    const walletError = addError as WalletError;
                    if (walletError?.code === 4001) return; // user rejected

                    // Last resort: plain switch (chain may already exist)
                    try {
                        await ethereum.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: chainConfig.chainId }],
                        });
                    } catch {
                        // Nothing more we can do programmatically
                    }
                }
            } finally {
                setIsPending(false);
            }
        },
        []
    );

    return { switchNetwork, isPending };
}
