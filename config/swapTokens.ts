import { Address } from "viem";
import tokenAddresses from "@/contracts/addresses/tokens.json";

export const SWAP_TOKENS = {
    ETH: {
        symbol: "ETH",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address,
        decimals: 18,
    },
    XCN: {
        symbol: "XCN",
        address: tokenAddresses.xcn["1"] as Address,
        decimals: 18,
    },
    USDC: {
        symbol: "USDC",
        address: tokenAddresses.usdc["1"] as Address,
        decimals: 6,
    },
    USDT: {
        symbol: "USDT",
        address: tokenAddresses.usdt["1"] as Address,
        decimals: 6,
    },
    DAI: {
        symbol: "DAI",
        address: tokenAddresses.dai["1"] as Address,
        decimals: 18,
    },
    WBTC: {
        symbol: "WBTC",
        address: tokenAddresses.wbtc["1"] as Address,
        decimals: 8,
    },
} as const;

export type SwapTokenSymbol = keyof typeof SWAP_TOKENS;
