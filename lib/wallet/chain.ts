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
 * Switches to a specific network, adding it first if necessary
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

    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainConfig.chainId }],
        });

        const switchSuccessMessage = t
            ? t("networkSwitchedSuccess", { chainName: chainConfig.chainName })
            : `Successfully switched to ${chainConfig.chainName}!`;

        callbacks?.onSuccess?.(
            t?.("networkSwitched") || "Network Switched",
            switchSuccessMessage
        );
        return { success: true };
    } catch (switchError: unknown) {
        console.error("Error switching network:", switchError);
        const walletError = switchError as WalletError;

        if (walletError.code === 4902) {
            callbacks?.onInfo?.(
                t?.("addingNetwork") || "Adding Network",
                t?.("addingNetworkDescription") ||
                    `Adding ${chainConfig.chainName} to your wallet...`
            );

            try {
                const addResult = await addNetwork(chainConfig, callbacks, t);
                if (!addResult) {
                    // addNetwork failed — the chain may already exist with different
                    // params (e.g. added via a block explorer). Retry the plain switch.
                    try {
                        await ethereum.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: chainConfig.chainId }],
                        });

                        const switchSuccessMsg = t
                            ? t("networkSwitchedSuccess", {
                                  chainName: chainConfig.chainName,
                              })
                            : `Successfully switched to ${chainConfig.chainName}!`;

                        callbacks?.onSuccess?.(
                            t?.("networkSwitched") || "Network Switched",
                            switchSuccessMsg
                        );
                        return { success: true };
                    } catch {
                        return {
                            success: false,
                            error:
                                t?.("failedToAddNetwork") ||
                                "Failed to add network",
                            needsAddition: true,
                        };
                    }
                }

                await ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: chainConfig.chainId }],
                });

                const addAndSwitchMessage = t
                    ? t("networkAddedAndSwitchedSuccess", {
                          chainName: chainConfig.chainName,
                      })
                    : `Successfully added and switched to ${chainConfig.chainName}!`;

                callbacks?.onSuccess?.(
                    t?.("networkAddedAndSwitched") ||
                        "Network Added & Switched",
                    addAndSwitchMessage
                );
                return { success: true };
            } catch (addError: unknown) {
                console.error(
                    "Error adding network after switch failure:",
                    addError
                );

                // The chain may already exist in the wallet with different
                // parameters (e.g. user added it manually via a block explorer).
                // Retry a plain switch — it should succeed if the chain is there.
                try {
                    await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: chainConfig.chainId }],
                    });

                    const retrySwitchMsg = t
                        ? t("networkSwitchedSuccess", {
                              chainName: chainConfig.chainName,
                          })
                        : `Successfully switched to ${chainConfig.chainName}!`;

                    callbacks?.onSuccess?.(
                        t?.("networkSwitched") || "Network Switched",
                        retrySwitchMsg
                    );
                    return { success: true };
                } catch (retrySwitchError: unknown) {
                    console.error(
                        "Retry switch also failed:",
                        retrySwitchError
                    );
                    const error = `Failed to switch to ${chainConfig.chainName}. Please switch manually in your wallet.`;
                    callbacks?.onError?.(
                        t?.("networkSwitchFailed") ||
                            "Failed to Switch Network",
                        error
                    );
                    return { success: false, error, needsAddition: true };
                }
            }
        } else if (walletError.code === 4001) {
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
        } else {
            const error = `Failed to switch to ${chainConfig.chainName}`;
            callbacks?.onError?.(
                t?.("networkSwitchFailed") || "Network Switch Failed",
                error
            );
            return { success: false, error };
        }
    }
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
