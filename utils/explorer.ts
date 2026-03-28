import { SUPPORTED_NETWORKS } from "@/config/networks";

type ExplorerKind = "tx" | "address" | "block";

const GOLIATH_VALIDATOR_EXPLORER = "https://validators.goliath.net/mainnet";

/**
 * Detect Hedera-native transaction identifiers and return a validators
 * explorer URL.  Two formats are supported:
 *
 * 1. Hedera tx ID:          `0.0.1083@1774674719.778114029`  (legacy fallback)
 * 2. Consensus timestamp:   `1774674723.642351710`           (preferred)
 *
 * EVM hashes (`0x…`) return `null` so callers fall through to the
 * standard block-explorer logic.
 */
const tryBuildHederaTxUrl = (value: string): string | null => {
    // Consensus timestamp: "1774674723.642351710" — digits.digits, no letters
    if (/^\d+\.\d+$/.test(value)) {
        return `${GOLIATH_VALIDATOR_EXPLORER}/transaction/${value}`;
    }
    // Hedera tx ID: "0.0.1083@1774674719.778114029" — pass full ID to explorer
    if (value.includes("@")) {
        return `${GOLIATH_VALIDATOR_EXPLORER}/transaction/${value}`;
    }
    return null;
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

/** Returns true if the value is a Hedera tx ID or consensus timestamp (not an EVM hash) */
export const isHederaTxId = (value: string): boolean =>
    value.includes("@") || (/^\d+\.\d+$/.test(value) && !value.startsWith("0x"));

export type { ExplorerKind };
