"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { getCurrentChainId, isCurrentChainOnyx } from "@/lib/wallet/chain";

export interface ChainDetectionState {
    currentChainId: string | null;
    isOnOnyxChain: boolean;
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
    const [isLoading, setIsLoading] = useState(true);

    const detectChain = useCallback(async () => {
        setIsLoading(true);

        try {
            const chainId = await getCurrentChainId();
            setCurrentChainId(chainId);

            const isOnyx = await isCurrentChainOnyx();
            setIsOnOnyxChain(isOnyx);
        } catch (error) {
            console.error("Error detecting chain:", error);
            setCurrentChainId(null);
            setIsOnOnyxChain(false);
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

    const shouldShowAddNetworkCard = useMemo(() => {
        if (isLoading) return false;

        if (isConnected && !isOnOnyxChain) return true;

        return false;
    }, [isConnected, isOnOnyxChain, isLoading]);

    return {
        currentChainId,
        isOnOnyxChain,
        isWalletConnected: isConnected,
        shouldShowAddNetworkCard,
        isLoading,
        refresh: detectChain,
    };
};

export default useChainDetection;
