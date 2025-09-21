import { Address, getAddress } from "viem";
import { UNISWAP } from "@/contracts";

export const addressOrWeth = (addr?: Address) =>
    addr ? getAddress(addr) : UNISWAP.weth;

export const buildPath = (from?: Address, to?: Address): Address[] => {
    const a = addressOrWeth(from);
    const b = addressOrWeth(to);
    if (a === b) throw new Error("Invalid path: identical tokens");
    const weth = UNISWAP.weth;

    if (a === weth || b === weth) {
        return [a, b];
    }

    return [a, weth, b];
};

/**
 * Generates Uniswap V2 add liquidity URL for a token pair
 * @param tokenAAddress - Address of token A
 * @param tokenBAddress - Address of token B (or 'NATIVE' for ETH)
 * @param chain - Chain name (default: 'ethereum')
 * @param feeTier - Fee tier (default: 3000 for 0.3%)
 * @returns Complete Uniswap URL
 * @throws Error if token addresses are invalid
 */
export function generateUniswapAddLiquidityUrl(
    tokenAAddress: Address,
    tokenBAddress: Address | "NATIVE" = "NATIVE",
    chain: string = "ethereum",
    feeTier: number = 3000
): string {
    if (!tokenAAddress || typeof tokenAAddress !== "string") {
        throw new Error("Invalid token A address");
    }

    if (
        tokenBAddress !== "NATIVE" &&
        (!tokenBAddress || typeof tokenBAddress !== "string")
    ) {
        throw new Error("Invalid token B address");
    }

    const validChains = ["ethereum", "polygon", "optimism", "arbitrum"];
    if (!validChains.includes(chain)) {
        console.warn(`Unsupported chain: ${chain}, defaulting to ethereum`);
        chain = "ethereum";
    }

    const validFeeTiers = [500, 3000, 10000];
    if (!validFeeTiers.includes(feeTier)) {
        console.warn(`Unsupported fee tier: ${feeTier}, defaulting to 3000`);
        feeTier = 3000;
    }

    const currencyA = tokenAAddress;
    const currencyB = tokenBAddress === "NATIVE" ? "NATIVE" : tokenBAddress;

    const url = `https://app.uniswap.org/positions/create/v2?currencyA=${currencyA}&currencyB=${currencyB}&chain=${chain}&feeTier=${feeTier}`;

    try {
        new URL(url);
        return url;
    } catch {
        throw new Error("Generated URL is invalid");
    }
}
