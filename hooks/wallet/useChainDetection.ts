"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { getCurrentChainId, isCurrentChainOnyx, isCurrentChainGoliath } from "@/lib/wallet/chain";
import { SUPPORTED_NETWORKS } from "@/config/networks";

export interface ChainDetectionState {
    currentChainId: string | null;
    currentNetworkId: "ethereum" | "onyx" | "goliath" | null;
    isOnOnyxChain: boolean;
    isOnGoliathChain: boolean;
    isWalletConnected: boolean;
    shouldShowAddNetworkCard: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

export const useChainDetection = (): ChainDetectionState => {
    const { isConnected } = useAccount();
    const wagmiChainId = useChainId();

    const [currentChainId, setCurrentChainId] = useState<string | null>(null);
    const [isOnOnyxChain, setIsOnOnyxChain] = useState(false);
    const [isOnGoliathChain, setIsOnGoliathChain] = useState(false);
    const [currentNetworkId, setCurrentNetworkId] = useState<"ethereum" | "onyx" | "goliath" | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const detectChain = useCallback(async () => {
        setIsLoading(true);

        try {
            const chainId = await getCurrentChainId();
            setCurrentChainId(chainId);

            const isOnyx = await isCurrentChainOnyx();
            setIsOnOnyxChain(isOnyx);

            const isGoliath = await isCurrentChainGoliath();
            setIsOnGoliathChain(isGoliath);

            // Determine which supported network the user is on
            if (chainId) {
                const matched = SUPPORTED_NETWORKS.find(
                    (n) => n.chainIdHex === chainId
                );
                setCurrentNetworkId(
                    matched ? (matched.id as "ethereum" | "onyx" | "goliath") : null
                );
            } else {
                setCurrentNetworkId(null);
            }
        } catch (error) {
            console.error("Error detecting chain:", error);
            setCurrentChainId(null);
            setIsOnOnyxChain(false);
            setIsOnGoliathChain(false);
            setCurrentNetworkId(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        detectChain();
    }, [detectChain, wagmiChainId]);

    useEffect(() => {
        const ethereum = (
            window as {
                ethereum?: {
                    on?: (event: string, handler: () => void) => void;
                };
            }
        ).ethereum;

        if (ethereum?.on) {
            const handleChainChanged = () => {
                detectChain();
            };

            ethereum.on("chainChanged", handleChainChanged);
        }
    }, [detectChain]);

    const isOnSupportedChain = useMemo(() => {
        return currentNetworkId !== null;
    }, [currentNetworkId]);

    const shouldShowAddNetworkCard = useMemo(() => {
        if (isLoading) return false;

        if (isConnected && !isOnSupportedChain) return true;

        return false;
    }, [isConnected, isOnSupportedChain, isLoading]);

    return {
        currentChainId,
        currentNetworkId,
        isOnOnyxChain,
        isOnGoliathChain,
        isWalletConnected: isConnected,
        shouldShowAddNetworkCard,
        isLoading,
        refresh: detectChain,
    };
};

export default useChainDetection;
