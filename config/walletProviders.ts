import onyxWallet from "@/assets/wallet-providers/onyx.png";
import trustWallet from "@/assets/wallet-providers/trust_wallet.png";
import metamask from "@/assets/wallet-providers/metamask.png";
import walletConnect from "@/assets/wallet-providers/wallet_connect.png";
import coinbaseWallet from "@/assets/wallet-providers/coinbase_wallet.png";
import browserWallet from "@/assets/wallet-providers/browser_wallet.svg";

export interface WalletProvider {
    id: string;
    name: string;
    icon: string | { src: string };
    disabled?: boolean;
}

export const getWalletDisplayName = (
    walletId: string,
    t: (key: string) => string
): string => {
    return t(`wallets.${walletId}`);
};

export const walletProviders: WalletProvider[] = [
    {
        id: "onyx",
        name: "Onyx Wallet",
        icon: onyxWallet,
    },
    {
        id: "trust",
        name: "Trust Wallet",
        icon: trustWallet,
    },
    {
        id: "metamask",
        name: "MetaMask",
        icon: metamask,
    },
    {
        id: "walletconnect",
        name: "WalletConnect",
        icon: walletConnect,
        disabled: !process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    },
    {
        id: "coinbase",
        name: "Coinbase Wallet",
        icon: coinbaseWallet,
    },
    {
        id: "browser",
        name: "Browser Wallet",
        icon: browserWallet,
    },
];
