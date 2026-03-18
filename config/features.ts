"use client";

import { useChainId } from "wagmi";
import { getGoliathNetwork } from "./networks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NetworkFeature =
    | "swap"
    | "yield"
    | "stake"
    | "bridge"
    | "migrate"
    | "governance"
    | "farm"
    | "points"
    | "history";

export type SwapVariant = "uniswap-ethereum" | "coolswap-goliath";
export type StakeVariant = "xcn-masterchef" | "stxcn-goliath";

export interface ChainFeatureConfig {
    chainId: number;
    networkId: string;
    features: Record<NetworkFeature, boolean>;
    swapVariant?: SwapVariant;
    stakeVariant?: StakeVariant;
}

// ---------------------------------------------------------------------------
// Default config (all features disabled)
// ---------------------------------------------------------------------------

const ALL_FEATURES_DISABLED: Record<NetworkFeature, boolean> = {
    swap: false,
    yield: false,
    stake: false,
    bridge: false,
    migrate: false,
    governance: false,
    farm: false,
    points: false,
    history: false,
};

const DEFAULT_CONFIG: ChainFeatureConfig = {
    chainId: 0,
    networkId: "unknown",
    features: { ...ALL_FEATURES_DISABLED },
};

// ---------------------------------------------------------------------------
// Feature map
// ---------------------------------------------------------------------------

const goliathNetwork = getGoliathNetwork();

const FEATURE_MAP: Record<number, ChainFeatureConfig> = {
    // Ethereum Mainnet
    1: {
        chainId: 1,
        networkId: "ethereum",
        features: {
            swap: true,
            yield: false,
            stake: true,
            bridge: false,
            migrate: false,
            governance: true,
            farm: true,
            points: true,
            history: true,
        },
        swapVariant: "uniswap-ethereum",
        stakeVariant: "xcn-masterchef",
    },

    // Onyx Network
    80888: {
        chainId: 80888,
        networkId: "onyx",
        features: {
            swap: false,
            yield: false,
            stake: false,
            bridge: false,
            migrate: false,
            governance: false,
            farm: false,
            points: false,
            history: true,
        },
    },

    // Goliath Network
    [goliathNetwork.chainId]: {
        chainId: goliathNetwork.chainId,
        networkId: "goliath",
        features: {
            swap: true,
            yield: true,
            stake: false,
            bridge: true,
            migrate: true,
            governance: false,
            farm: false,
            points: false,
            history: true,
        },
        swapVariant: "coolswap-goliath",
        stakeVariant: "stxcn-goliath",
    },
};

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/**
 * Returns the feature configuration for the given chain ID.
 * Falls back to a default config with all features disabled for unknown chains.
 */
export function getChainFeatures(chainId: number): ChainFeatureConfig {
    return FEATURE_MAP[chainId] ?? { ...DEFAULT_CONFIG, chainId };
}

/**
 * Returns whether the given chain supports a specific feature.
 */
export function hasFeature(chainId: number, feature: NetworkFeature): boolean {
    const config = FEATURE_MAP[chainId];
    return config?.features[feature] ?? false;
}

/**
 * Returns the swap variant for the given chain, or null if swap is not supported.
 */
export function getSwapVariant(chainId: number): SwapVariant | null {
    const config = FEATURE_MAP[chainId];
    return config?.swapVariant ?? null;
}

/**
 * Returns the stake variant for the given chain, or null if staking is not configured.
 */
export function getStakeVariant(chainId: number): StakeVariant | null {
    const config = FEATURE_MAP[chainId];
    return config?.stakeVariant ?? null;
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

/**
 * Returns the full feature configuration for the connected chain (or a
 * specific chain ID when provided).
 */
export function useNetworkFeatures(chainId?: number): ChainFeatureConfig {
    const connectedChainId = useChainId();
    return getChainFeatures(chainId ?? connectedChainId);
}

/**
 * Returns whether the connected chain supports a specific feature.
 */
export function useHasFeature(feature: NetworkFeature): boolean {
    const chainId = useChainId();
    return hasFeature(chainId, feature);
}

/**
 * Returns the swap variant for the connected chain, or null.
 */
export function useSwapVariant(): SwapVariant | null {
    const chainId = useChainId();
    return getSwapVariant(chainId);
}

/**
 * Returns the stake variant for the connected chain, or null.
 */
export function useStakeVariant(): StakeVariant | null {
    const chainId = useChainId();
    return getStakeVariant(chainId);
}
