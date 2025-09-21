import { Connector } from "wagmi";
import { WalletId } from "@/types/wallet";
import {
    findConnectorForWallet,
    validateWalletConnection,
} from "@/lib/wagmi/connectors";

const isUserRejectedConnection = (error: unknown): boolean => {
    if (!error) return false;
    const message = (error as Error).message?.toLowerCase?.() || "";
    const name = (error as Error).name?.toLowerCase?.() || "";
    return (
        name.includes("userrejected") ||
        name.includes("user rejected") ||
        name.includes("user denied") ||
        message.includes("user rejected") ||
        message.includes("user denied") ||
        message.includes("denied connection") ||
        message.includes("request rejected") ||
        message.includes("connection rejected") ||
        message.includes("user cancelled") ||
        message.includes("user canceled")
    );
};

const isProviderNotAvailable = (error: unknown): boolean => {
    if (!error) return false;
    const message = (error as Error).message?.toLowerCase?.() || "";
    const name = (error as Error).name?.toLowerCase?.() || "";
    return (
        message.includes("provider not found") ||
        message.includes("provider not available") ||
        message.includes("no provider") ||
        message.includes("wallet not found") ||
        message.includes("wallet not installed") ||
        message.includes("wallet not available") ||
        message.includes("metamask not found") ||
        message.includes("coinbase not found") ||
        message.includes("walletconnect not found") ||
        name.includes("providernotfound") ||
        name.includes("providererror")
    );
};

const isAlreadyProcessing = (error: unknown): boolean => {
    if (!error) return false;
    const message = (error as Error).message?.toLowerCase?.() || "";
    return (
        message.includes("already processing") ||
        message.includes("already pending") ||
        message.includes("already processing eth_requestaccounts") ||
        message.includes("processing request") ||
        message.includes("request in progress")
    );
};

const getWalletConnectionErrorMessage = (
    error: unknown,
    t?: (key: string) => string
): string => {
    if (isUserRejectedConnection(error)) {
        return t?.("connectionRejected") || "Connection request was rejected";
    }

    if (isProviderNotAvailable(error)) {
        return (
            t?.("providerNotAvailable") ||
            "Wallet provider not available. Please install or enable your wallet extension."
        );
    }

    if (isAlreadyProcessing(error)) {
        return (
            t?.("connectionInProgress") ||
            "Connection already in progress. Please check your wallet."
        );
    }

    const message = (error as Error)?.message || "";

    if (message.includes("chain")) {
        return (
            t?.("networkError") ||
            "Network error. Please ensure your wallet is on the correct network."
        );
    }

    if (message.includes("disconnected")) {
        return (
            t?.("walletDisconnected") ||
            "Wallet disconnected. Please reconnect your wallet."
        );
    }

    if (message.includes("timeout")) {
        return (
            t?.("connectionTimeout") || "Connection timeout. Please try again."
        );
    }

    return (
        t?.("connectionFailed") || "Failed to connect wallet. Please try again."
    );
};

export interface ConnectionResult {
    success: boolean;
    error?: string;
}

export interface WalletConnectionService {
    connect: (
        walletId: WalletId,
        connectors: readonly Connector[],
        t?: (key: string) => string
    ) => Promise<ConnectionResult>;
    disconnect: (t?: (key: string) => string) => Promise<ConnectionResult>;
}

export class WalletConnectionServiceImpl implements WalletConnectionService {
    private connectAsync: (params: {
        connector: Connector;
    }) => Promise<unknown>;
    private disconnectAsync: () => Promise<unknown>;

    constructor(
        connectAsync: (params: { connector: Connector }) => Promise<unknown>,
        disconnectAsync: () => Promise<unknown>
    ) {
        this.connectAsync = connectAsync;
        this.disconnectAsync = disconnectAsync;
    }

    async connect(
        walletId: WalletId,
        connectors: readonly Connector[],
        t?: (key: string) => string
    ): Promise<ConnectionResult> {
        try {
            const validationError = validateWalletConnection(walletId);
            if (validationError) {
                return { success: false, error: validationError };
            }

            const connector = findConnectorForWallet(connectors, walletId);
            if (!connector) {
                return {
                    success: false,
                    error: getWalletConnectionErrorMessage(
                        new Error("Wallet provider not available"),
                        t
                    ),
                };
            }

            await this.connectAsync({ connector });

            return { success: true };
        } catch (error) {
            console.error("Wallet connect error:", error);
            const message = getWalletConnectionErrorMessage(error, t);
            return { success: false, error: message };
        }
    }

    async disconnect(t?: (key: string) => string): Promise<ConnectionResult> {
        try {
            await this.disconnectAsync();
            return { success: true };
        } catch (error) {
            console.error("Wallet disconnect error:", error);
            const message =
                error instanceof Error
                    ? error.message
                    : t?.("disconnectionFailed") ||
                      "Failed to disconnect wallet.";
            return { success: false, error: message };
        }
    }
}

export const createWalletConnectionService = (
    connectAsync: (params: { connector: Connector }) => Promise<unknown>,
    disconnectAsync: () => Promise<unknown>
): WalletConnectionService => {
    return new WalletConnectionServiceImpl(connectAsync, disconnectAsync);
};
