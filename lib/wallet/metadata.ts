import onyxWallet from "@/assets/wallet-providers/onyx.png";
import trustWallet from "@/assets/wallet-providers/trust_wallet.png";
import metamask from "@/assets/wallet-providers/metamask.png";
import walletConnect from "@/assets/wallet-providers/wallet_connect.png";
import coinbaseWallet from "@/assets/wallet-providers/coinbase_wallet.png";
import browserWallet from "@/assets/wallet-providers/browser_wallet.svg";
import { type ImageLikeSrc } from "@/utils/image";
import { WalletId } from "@/types/wallet";

export type WalletIcon = ImageLikeSrc;

export interface WalletMetadata {
    id: WalletId;
    name: string;
    icon: WalletIcon;
    description?: string;
}

export const WALLET_METADATA: Record<WalletId, WalletMetadata> = {
    onyx: {
        id: "onyx",
        name: "Onyx Wallet",
        icon: onyxWallet,
        description: "Native Onyx Protocol wallet",
    },
    trust: {
        id: "trust",
        name: "Trust Wallet",
        icon: trustWallet,
        description: "Secure mobile wallet",
    },
    metamask: {
        id: "metamask",
        name: "MetaMask",
        icon: metamask,
        description: "Popular browser extension wallet",
    },
    walletconnect: {
        id: "walletconnect",
        name: "WalletConnect",
        icon: walletConnect,
        description: "Connect any wallet via QR code",
    },
    coinbase: {
        id: "coinbase",
        name: "Coinbase Wallet",
        icon: coinbaseWallet,
        description: "Coinbase's self-custody wallet",
    },
    browser: {
        id: "browser",
        name: "Browser Wallet",
        icon: browserWallet,
        description: "Browser's built-in wallet",
    },
};

export const getWalletMetadata = (walletId: WalletId): WalletMetadata => {
    return WALLET_METADATA[walletId];
};

export const getWalletIcon = (walletId: WalletId): WalletIcon => {
    return WALLET_METADATA[walletId]?.icon || WALLET_METADATA.metamask.icon;
};

export const getWalletName = (walletId: WalletId): string => {
    return WALLET_METADATA[walletId]?.name || "Unknown Wallet";
};

export const getAllWalletMetadata = (): WalletMetadata[] => {
    return Object.values(WALLET_METADATA);
};

export const getSupportedWalletIds = (): WalletId[] => {
    return Object.keys(WALLET_METADATA).filter(
        (id) => id !== "onyx"
    ) as WalletId[];
};
