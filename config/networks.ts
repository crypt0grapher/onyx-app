import etcIcon from "@/assets/icons/etc.png";
import xcnIcon from "@/assets/icons/XCN.svg";
import goliathIcon from "@/assets/icons/goliath.svg";

export interface Network {
    id: string;
    name: string;
    network: string;
    icon: string;
    chainId: number;
    chainIdHex: string;
    rpcUrl: string;
    blockExplorerUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
}

export interface ChainConfig {
    chainId: string;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrls: string[];
}

const goliathChainId = Number(
    process.env.NEXT_PUBLIC_GOLIATH_CHAIN_ID || "327"
);

export const SUPPORTED_NETWORKS: Network[] = [
    {
        id: "ethereum",
        name: "Ethereum",
        network: "Ethereum Mainnet",
        icon: etcIcon,
        chainId: 1,
        chainIdHex: "0x1",
        rpcUrl: process.env.NEXT_PUBLIC_INFURA_API_KEY
            ? `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
            : "https://ethereum-rpc.publicnode.com",
        blockExplorerUrl: "https://etherscan.io",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
    },
    {
        id: "onyx",
        name: "Onyx",
        network: "Onyx Network",
        icon: xcnIcon,
        chainId: 80888,
        chainIdHex: "0x13bf8",
        rpcUrl: "https://80888.rpc.thirdweb.com/6518b486fd02052fb8a45dd0e8e6d3d1",
        blockExplorerUrl: "https://explorer.onyx.org",
        nativeCurrency: {
            name: "XCN",
            symbol: "XCN",
            decimals: 18,
        },
    },
    {
        id: "goliath",
        name: "Goliath",
        network: "Goliath Mainnet",
        icon: goliathIcon,
        chainId: goliathChainId,
        chainIdHex: "0x" + goliathChainId.toString(16),
        rpcUrl:
            process.env.NEXT_PUBLIC_GOLIATH_RPC_URL ||
            "https://rpc.goliath.net",
        blockExplorerUrl:
            process.env.NEXT_PUBLIC_GOLIATH_EXPLORER_URL ||
            "https://explorer.goliath.net",
        nativeCurrency: {
            name: "XCN",
            symbol: "XCN",
            decimals: 18,
        },
    },
];

export const getNetworkBySymbol = (symbol: string): Network | undefined => {
    return SUPPORTED_NETWORKS.find((network) => network.network === symbol);
};

export const getNetworkByChainId = (chainId: number): Network | undefined => {
    return SUPPORTED_NETWORKS.find((network) => network.chainId === chainId);
};

export const getNetworkByHexChainId = (
    hexChainId: string
): Network | undefined => {
    return SUPPORTED_NETWORKS.find(
        (network) => network.chainIdHex === hexChainId
    );
};

export const networkToChainConfig = (network: Network): ChainConfig => {
    return {
        chainId: network.chainIdHex,
        chainName: network.network,
        rpcUrls: [network.rpcUrl],
        nativeCurrency: network.nativeCurrency,
        blockExplorerUrls: [network.blockExplorerUrl],
    };
};

export const getOnyxNetwork = (): Network => {
    const onyxNetwork = SUPPORTED_NETWORKS.find(
        (network) => network.id === "onyx"
    );
    if (!onyxNetwork) {
        throw new Error("Onyx network configuration not found");
    }
    return onyxNetwork;
};

export const getGoliathNetwork = (): Network => {
    const goliathNetwork = SUPPORTED_NETWORKS.find(
        (network) => network.id === "goliath"
    );
    if (!goliathNetwork) {
        throw new Error("Goliath network configuration not found");
    }
    return goliathNetwork;
};

export const isGoliathChain = (chainId: number): boolean => {
    return chainId === goliathChainId;
};
