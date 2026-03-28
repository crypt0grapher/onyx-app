"use client";

import {
    ChainConfig,
    getOnyxNetwork,
    getGoliathNetwork,
    networkToChainConfig,
} from "@/config/networks";

interface EthereumProvider {
    request: (params: {
        method: string;
        params?: unknown[];
    }) => Promise<unknown>;
    isMetaMask?: boolean;
}

interface WalletError {
    code: number;
    message: string;
}

export type ChainSwitchResult = {
    success: boolean;
    error?: string;
    needsAddition?: boolean;
};

export type ToastFunction = (title: string, message: string) => void;

export interface ChainOperationCallbacks {
    onSuccess?: ToastFunction;
    onError?: ToastFunction;
    onInfo?: ToastFunction;
}

/**
 * Adds a custom network to the user's wallet
 */
export const addNetwork = async (
    chainConfig: ChainConfig,
    callbacks?: ChainOperationCallbacks,
    t?: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<boolean> => {
    const ethereum = (window as { ethereum?: EthereumProvider }).ethereum;

    if (!ethereum) {
        callbacks?.onError?.(
            t?.("notFound") || "Wallet Not Found",
            t?.("notFoundDescription") ||
                "No Ethereum wallet detected. Please install MetaMask or another Web3 wallet."
        );
        return false;
    }

    try {
        await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [chainConfig],
        });

        const successMessage = t
            ? t("networkAddedSuccess", { chainName: chainConfig.chainName })
            : `Successfully added ${chainConfig.chainName} to your wallet!`;

        callbacks?.onSuccess?.(
            t?.("networkAdded") || "Network Added",
            successMessage
        );
        return true;
    } catch (error: unknown) {
        console.error("Error adding network:", error);
        const walletError = error as WalletError;

        if (walletError.code === 4001) {
            callbacks?.onInfo?.(
                t?.("networkAdditionCancelled") || "Network Addition Cancelled",
                t?.("networkAdditionCancelledDescription") ||
                    "You cancelled adding the network to your wallet."
            );
        } else {
            callbacks?.onError?.(
                t?.("failedToAddNetwork") || "Failed to Add Network",
                `Could not add ${chainConfig.chainName}. Please try again or add it manually.`
            );
        }
        return false;
    }
};

/**
 * Switches to a specific network, adding it first if necessary.
 *
 * Flow:
 *   1. wallet_switchEthereumChain  — works when the wallet already knows the chain
 *   2. wallet_addEthereumChain     — adds AND switches per EIP-3085
 *   3. Verify with eth_chainId     — never call switch again after a successful add,
 *      because MetaMask may not have updated its switch-registry yet and the extra
 *      call can interfere with the in-progress chain change.
 */
export const switchToChain = async (
    chainConfig: ChainConfig,
    callbacks?: ChainOperationCallbacks,
    t?: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<ChainSwitchResult> => {
    const ethereum = (window as { ethereum?: EthereumProvider }).ethereum;

    if (!ethereum) {
        const error =
            t?.("notFoundDescription") ||
            "No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.";
        callbacks?.onError?.(t?.("notFound") || "Wallet Not Found", error);
        return { success: false, error };
    }

    const successMsg = () =>
        t
            ? t("networkSwitchedSuccess", { chainName: chainConfig.chainName })
            : `Successfully switched to ${chainConfig.chainName}!`;

    // ── Step 1: try a plain switch (fast path) ──────────────────────────
    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainConfig.chainId }],
        });
        callbacks?.onSuccess?.(
            t?.("networkSwitched") || "Network Switched",
            successMsg()
        );
        return { success: true };
    } catch (switchError: unknown) {
        const walletError = switchError as WalletError;

        if (walletError.code === 4001) {
            callbacks?.onInfo?.(
                t?.("networkSwitchCancelled") || "Network Switch Cancelled",
                t?.("networkSwitchCancelledDescription") ||
                    "You cancelled switching networks."
            );
            return {
                success: false,
                error:
                    t?.("userCancelledNetworkSwitch") ||
                    "User cancelled network switch",
            };
        }

        // 4902 or any other error → fall through to add
    }

    // ── Step 2: add the chain (EIP-3085 — this also switches) ───────────
    try {
        await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [chainConfig],
        });
    } catch (addError: unknown) {
        const walletError = addError as WalletError;

        if (walletError.code === 4001) {
            callbacks?.onInfo?.(
                t?.("networkAdditionCancelled") ||
                    "Network Addition Cancelled",
                t?.("networkAdditionCancelledDescription") ||
                    "You cancelled adding the network to your wallet."
            );
            return {
                success: false,
                error:
                    t?.("userCancelledNetworkSwitch") ||
                    "User cancelled network switch",
            };
        }

        // Add failed for a non-user reason — report and bail
        const error = `Failed to add ${chainConfig.chainName}. Please switch manually in your wallet.`;
        callbacks?.onError?.(
            t?.("networkSwitchFailed") || "Failed to Switch Network",
            error
        );
        return { success: false, error, needsAddition: true };
    }

    // ── Step 3: verify the chain actually switched ──────────────────────
    try {
        const currentChainId = await ethereum.request({
            method: "eth_chainId",
        });
        if (currentChainId === chainConfig.chainId) {
            callbacks?.onSuccess?.(
                t?.("networkSwitched") || "Network Switched",
                successMsg()
            );
            return { success: true };
        }
    } catch {
        // verification failed — fall through
    }

    // ── Step 4: add resolved but wallet didn't switch ───────────────────
    // EIP-3085 does not guarantee that a successful add also selects the
    // chain.  Retry with a plain wallet_switchEthereumChain — the chain
    // should now be registered after the add, so switch-by-ID can work.
    // Do NOT call wallet_addEthereumChain again (that would show a second
    // add prompt).
    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainConfig.chainId }],
        });
        callbacks?.onSuccess?.(
            t?.("networkSwitched") || "Network Switched",
            successMsg()
        );
        return { success: true };
    } catch {
        // switch still failed — nothing more we can do
    }

    const error = `Could not switch to ${chainConfig.chainName} automatically. Please switch manually in your wallet.`;
    callbacks?.onError?.(
        t?.("networkSwitchFailed") || "Network Switch Failed",
        error
    );
    return { success: false, error };
};

/**
 * Adds the Onyx network to the user's wallet
 */
export const addOnyxNetwork = async (
    callbacks?: ChainOperationCallbacks,
    t?: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<boolean> => {
    const onyxNetwork = getOnyxNetwork();
    const chainConfig = networkToChainConfig(onyxNetwork);
    return addNetwork(chainConfig, callbacks, t);
};

/**
 * Switches to the Onyx network, adding it first if necessary
 */
export const switchToOnyxNetwork = async (
    callbacks?: ChainOperationCallbacks,
    t?: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<ChainSwitchResult> => {
    const onyxNetwork = getOnyxNetwork();
    const chainConfig = networkToChainConfig(onyxNetwork);
    return switchToChain(chainConfig, callbacks, t);
};

/**
 * Gets the current chain ID from the wallet
 */
export const getCurrentChainId = async (): Promise<string | null> => {
    const ethereum = (window as { ethereum?: EthereumProvider }).ethereum;

    if (!ethereum) {
        return null;
    }

    try {
        const chainId = await ethereum.request({
            method: "eth_chainId",
        });
        return chainId as string;
    } catch (error) {
        console.error("Error getting current chain ID:", error);
        return null;
    }
};

/**
 * Checks if the current chain is the Onyx network
 */
export const isCurrentChainOnyx = async (): Promise<boolean> => {
    const currentChainId = await getCurrentChainId();
    const onyxNetwork = getOnyxNetwork();
    return currentChainId === onyxNetwork.chainIdHex;
};

/**
 * Adds the Goliath network to the user's wallet
 */
export const addGoliathNetwork = async (
    callbacks?: ChainOperationCallbacks,
    t?: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<boolean> => {
    const goliathNetwork = getGoliathNetwork();
    const chainConfig = networkToChainConfig(goliathNetwork);
    return addNetwork(chainConfig, callbacks, t);
};

/**
 * Switches to the Goliath network, adding it first if necessary
 */
export const switchToGoliathNetwork = async (
    callbacks?: ChainOperationCallbacks,
    t?: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<ChainSwitchResult> => {
    const goliathNetwork = getGoliathNetwork();
    const chainConfig = networkToChainConfig(goliathNetwork);
    return switchToChain(chainConfig, callbacks, t);
};

/**
 * Checks if the current chain is the Goliath network
 */
export const isCurrentChainGoliath = async (): Promise<boolean> => {
    const currentChainId = await getCurrentChainId();
    const goliathNetwork = getGoliathNetwork();
    return currentChainId === goliathNetwork.chainIdHex;
};
