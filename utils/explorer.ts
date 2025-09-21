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

export type { ExplorerKind };
