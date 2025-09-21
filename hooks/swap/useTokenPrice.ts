"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { buildPath } from "@/utils/path";
import { toWei } from "@/utils/swap";
import { SWAP_TOKENS, type SwapTokenSymbol } from "@/config/swapTokens";
import { type Token } from "@/config/swap";
import useSwapQuote from "./useSwapQuote";

export const useTokenPrice = (token: Token) => {
    const tokenInfo = SWAP_TOKENS[token.symbol as SwapTokenSymbol];
    const tokenAddress = (tokenInfo as { address?: `0x${string}` }).address;
    const usdcAddress = SWAP_TOKENS.USDC.address;

    const oneTokenInWei = useMemo(
        () => toWei("1", tokenInfo.decimals),
        [tokenInfo.decimals]
    );

    const tokenToUsdcPath = useMemo(() => {
        if (token.symbol === "USDC") return null;
        return buildPath(tokenAddress, usdcAddress);
    }, [tokenAddress, usdcAddress, token.symbol]);

    const { getOut: tokenToUsdcOut } = useSwapQuote({
        path: (tokenToUsdcPath || []) as `0x${string}`[],
        amountInWei: tokenToUsdcPath ? oneTokenInWei : undefined,
    });

    const priceUsd = useMemo(() => {
        if (token.symbol === "USDC") return 1;
        const amounts = tokenToUsdcOut.data as unknown as
            | readonly bigint[]
            | undefined;
        if (amounts && amounts.length > 0) {
            const usdcOut = amounts[amounts.length - 1];
            return Number(formatUnits(usdcOut, SWAP_TOKENS.USDC.decimals));
        }
        return 0;
    }, [tokenToUsdcOut.data, token.symbol]);

    const isLoading = tokenToUsdcOut.isLoading || tokenToUsdcOut.isFetching;

    return { priceUsd, isLoading };
};

export default useTokenPrice;
