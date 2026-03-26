import { SUPPORTED_NETWORKS } from "@/config/networks";

type ExplorerKind = "tx" | "address" | "block";

const getExplorerBaseUrl = (chainId?: number): string => {
    if (chainId) {
        const net = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
        if (net?.blockExplorerUrl) return net.blockExplorerUrl;
    }
    return (
        SUPPORTED_NETWORKS.find((n) => n.id === "onyx")?.blockExplorerUrl ||
        "https://etherscan.io"
    );
};

export const buildExplorerUrl = (
    value: string | number,
    kind: ExplorerKind,
    chainId?: number
) => {
    const base = getExplorerBaseUrl(chainId);
    const val = typeof value === "number" ? String(value) : value;
    switch (kind) {
        case "tx":
            return `${base}/tx/${val}`;
        case "address":
            return `${base}/address/${val}`;
        case "block":
            return `${base}/block/${val}`;
        default:
            return base;
    }
};

// Force Etherscan for stake and history components
export const buildEtherscanUrl = (
    value: string | number,
    kind: ExplorerKind
) => {
    const base = "https://etherscan.io";
    const val = typeof value === "number" ? String(value) : value;
    switch (kind) {
        case "tx":
            return `${base}/tx/${val}`;
        case "address":
            return `${base}/address/${val}`;
        case "block":
            return `${base}/block/${val}`;
        default:
            return base;
    }
};

/**
 * Build an explorer URL for a bridge transaction using the operation direction
 * instead of chain ID lookup. This ensures correct URLs even when stored
 * chain IDs are stale.
 */
export const buildBridgeExplorerUrl = (
    txHash: string,
    chain: "origin" | "destination",
    direction: "SOURCE_TO_GOLIATH" | "GOLIATH_TO_SOURCE",
): string => {
    const isGoliath =
        (chain === "origin" && direction === "GOLIATH_TO_SOURCE") ||
        (chain === "destination" && direction === "SOURCE_TO_GOLIATH");
    const goliathNetwork = SUPPORTED_NETWORKS.find((n) => n.id === "goliath");
    const base = isGoliath
        ? (goliathNetwork?.blockExplorerUrl ?? "https://explorer.goliath.net")
        : "https://etherscan.io";
    return `${base}/tx/${txHash}`;
};

export type { ExplorerKind };
