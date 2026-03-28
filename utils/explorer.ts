import { SUPPORTED_NETWORKS } from "@/config/networks";

type ExplorerKind = "tx" | "address" | "block";

/** Hedera transaction IDs look like `0.0.1083@1774674719.778114029` */
const HEDERA_TX_ID_RE = /^[\d.]+@(\d+\.\d+)$/;

const GOLIATH_VALIDATOR_EXPLORER = "https://validators.goliath.net/mainnet";

/**
 * If `value` is a Hedera transaction ID (contains `@`), return the
 * validators explorer URL.  Otherwise return `null` so callers can
 * fall through to standard EVM explorer logic.
 */
const tryBuildHederaTxUrl = (value: string): string | null => {
    const m = value.match(HEDERA_TX_ID_RE);
    if (!m) return null;
    return `${GOLIATH_VALIDATOR_EXPLORER}/transaction/${m[1]}`;
};

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
    const val = typeof value === "number" ? String(value) : value;

    // Hedera transaction IDs get routed to the validators explorer
    if (kind === "tx") {
        const hederaUrl = tryBuildHederaTxUrl(val);
        if (hederaUrl) return hederaUrl;
    }

    const base = getExplorerBaseUrl(chainId);
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
    // Hedera transaction IDs (e.g. 0.0.1083@1774674719.778114029) get a
    // dedicated validators explorer URL regardless of chain/direction.
    const hederaUrl = tryBuildHederaTxUrl(txHash);
    if (hederaUrl) return hederaUrl;

    const isGoliath =
        (chain === "origin" && direction === "GOLIATH_TO_SOURCE") ||
        (chain === "destination" && direction === "SOURCE_TO_GOLIATH");
    const goliathNetwork = SUPPORTED_NETWORKS.find((n) => n.id === "goliath");
    const base = isGoliath
        ? (goliathNetwork?.blockExplorerUrl ?? "https://explorer.goliath.net")
        : "https://etherscan.io";
    return `${base}/tx/${txHash}`;
};

/** Returns true if the value looks like a Hedera transaction ID (`account@ts`) */
export const isHederaTxId = (value: string): boolean => HEDERA_TX_ID_RE.test(value);

export type { ExplorerKind };
