import { Address } from "viem";
import tokenAddresses from "@/contracts/addresses/tokens.json";
import mainAddresses from "@/contracts/addresses/main.json";

export type FarmToken = {
    symbol: "XCN" | "WETH" | "USDC";
    address: Address;
    decimals: number;
};

export type FarmConfig = {
    pid: number;
    lpAddress: Address;
    token: FarmToken;
    quoteToken: FarmToken;
};

export const FARMS: FarmConfig[] = [
    {
        pid: 0,
        lpAddress: "0x859f7092f56c43BB48bb46dE7119d9c799716CDF" as Address,
        token: {
            symbol: "XCN",
            address: tokenAddresses.xcn["1"] as Address,
            decimals: 18,
        },
        quoteToken: {
            symbol: "WETH",
            address: mainAddresses.uniSwapRouter["1"]
                ? ("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address)
                : ("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address),
            decimals: 18,
        },
    },
];

export default FARMS;
