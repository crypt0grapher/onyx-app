import { Connector } from "wagmi";
import { WalletId } from "@/types/wallet";

export interface ConnectorInfo {
    id: string;
    name: string;
    walletId: WalletId;
}

export const getWalletIdFromConnector = (
    connectorName: string,
    connectorId: string
): WalletId => {
    const name = connectorName.toLowerCase();
    const id = connectorId.toLowerCase();

    if (id === "metamask" || name.includes("metamask")) {
        return "metamask";
    }

    if (id === "coinbasewallet" || name.includes("coinbase")) {
        return "coinbase";
    }

    if (id === "walletconnect" || name.includes("walletconnect")) {
        return "walletconnect";
    }

    if (id === "trustwallet" || name.includes("trust")) {
        return "trust";
    }

    if (id.includes("onyx") || name.includes("onyx")) {
        return "onyx";
    }

    return "browser";
};

export const getConnectorNameForWallet = (walletId: WalletId): string => {
    switch (walletId) {
        case "metamask":
            return "MetaMask";
        case "coinbase":
            return "Coinbase Wallet";
        case "walletconnect":
            return "WalletConnect";
        case "trust":
            return "Trust Wallet";
        case "browser":
            return "Injected";
        case "onyx":
            return "Onyx Wallet";
        default:
            return "Unknown";
    }
};

export const findConnectorForWallet = (
    connectors: readonly Connector[],
    walletId: WalletId
): Connector | null => {
    const targetName = getConnectorNameForWallet(walletId);

    return (
        connectors.find((connector) => {
            const connectorName = connector.name.toLowerCase();
            const connectorId = connector.id.toLowerCase();

            if (walletId === "metamask") {
                return (
                    connectorId === "metamask" ||
                    connectorName.includes("metamask")
                );
            }

            if (walletId === "browser") {
                return (
                    connectorId === "injected" ||
                    connectorName.includes("injected")
                );
            }

            if (walletId === "onyx") {
                return (
                    connectorId.includes("onyx") ||
                    connectorName.includes("onyx") ||
                    (connectorId === "injected" &&
                        connectorName.includes("injected"))
                );
            }

            return connectorName.includes(targetName.toLowerCase());
        }) || null
    );
};

export const validateWalletConnection = (walletId: WalletId): string | null => {
    switch (walletId) {
        case "walletconnect":
            if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
                return "WalletConnect requires NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to be set.";
            }
            break;
        default:
            break;
    }
    return null;
};
