"use client";

import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Chain } from "wagmi/chains";
import {
    coinbaseWallet,
    metaMask,
    walletConnect,
    injected,
} from "wagmi/connectors";
import { getOnyxNetwork, getGoliathNetwork, SUPPORTED_NETWORKS } from "./networks";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const baseConnectors = [
    injected({ shimDisconnect: true }),
    injected({ target: "trustWallet", shimDisconnect: true }),
    injected({ shimDisconnect: true }),
    metaMask({ dappMetadata: { name: "Onyx App" } }),
    coinbaseWallet({ appName: "Onyx App" }),
] as const;

const wcConnector = WC_PROJECT_ID
    ? [walletConnect({ projectId: WC_PROJECT_ID, showQrModal: true })]
    : [];

const ethereumNetwork = SUPPORTED_NETWORKS.find((n) => n.id === "ethereum")!;
const onyxNetwork = getOnyxNetwork();
const goliathNetwork = getGoliathNetwork();

const onyxChain: Chain = {
    id: onyxNetwork.chainId,
    name: onyxNetwork.name,
    nativeCurrency: onyxNetwork.nativeCurrency,
    rpcUrls: {
        default: {
            http: [onyxNetwork.rpcUrl],
        },
    },
    blockExplorers: {
        default: { name: "Onyx Explorer", url: onyxNetwork.blockExplorerUrl },
    },
    contracts: {},
};

export const goliathChain: Chain = {
    id: goliathNetwork.chainId,
    name: goliathNetwork.name,
    nativeCurrency: goliathNetwork.nativeCurrency,
    rpcUrls: {
        default: {
            http: [goliathNetwork.rpcUrl],
        },
    },
    blockExplorers: {
        default: { name: "Goliath Explorer", url: goliathNetwork.blockExplorerUrl },
    },
    contracts: {},
};

const chains = [mainnet, onyxChain, goliathChain] as const;

export const wagmiConfig = createConfig({
    chains,
    transports: {
        [mainnet.id]: http(ethereumNetwork.rpcUrl),
        [onyxChain.id]: http(onyxNetwork.rpcUrl),
        [goliathChain.id]: http(goliathNetwork.rpcUrl),
    },
    connectors: [...baseConnectors, ...wcConnector],
    ssr: true,
});
