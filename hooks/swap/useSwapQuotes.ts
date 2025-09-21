"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { formatUnits } from "viem";
import { buildPath } from "@/utils/path";
import { toWei } from "@/utils/swap";
import { SWAP_TOKENS, type SwapTokenSymbol } from "@/config/swapTokens";
import { type Token } from "@/config/swap";
import useSwapQuote from "./useSwapQuote";
import useDebounce from "../common/useDebounce";

interface UseSwapQuotesProps {
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    toAmount: string;
    activeInput: "from" | "to";
}

export const useSwapQuotes = ({
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    activeInput,
}: UseSwapQuotesProps) => {
    const debouncedFromAmount = useDebounce(fromAmount, 150);
    const debouncedToAmount = useDebounce(toAmount, 150);

    const fromSwap = SWAP_TOKENS[fromToken.symbol as SwapTokenSymbol];
    const toSwap = SWAP_TOKENS[toToken.symbol as SwapTokenSymbol];
    const fromAddress =
        fromToken.symbol === "ETH"
            ? undefined
            : (fromSwap as { address?: `0x${string}` }).address;
    const toAddress = (toSwap as { address?: `0x${string}` }).address;

    const path = useMemo(
        () => buildPath(fromAddress, toAddress),
        [fromAddress, toAddress]
    );

    const shouldUseFromAmount =
        activeInput === "from" &&
        debouncedFromAmount &&
        parseFloat(debouncedFromAmount) > 0;

    const shouldUseToAmount =
        activeInput === "to" &&
        debouncedToAmount &&
        parseFloat(debouncedToAmount) > 0;

    const amountInWei = useMemo(() => {
        if (!shouldUseFromAmount) return undefined;
        return toWei(debouncedFromAmount, fromSwap.decimals);
    }, [shouldUseFromAmount, debouncedFromAmount, fromSwap.decimals]);

    const amountOutWei = useMemo(() => {
        if (!shouldUseToAmount) return undefined;
        return toWei(debouncedToAmount, toSwap.decimals);
    }, [shouldUseToAmount, debouncedToAmount, toSwap.decimals]);

    const { getOut } = useSwapQuote({ path, amountInWei });
    const { getIn } = useSwapQuote({ path, amountOutWei });

    const lastGoodOut = useRef<readonly bigint[] | undefined>(undefined);
    const lastGoodIn = useRef<readonly bigint[] | undefined>(undefined);

    useEffect(() => {
        if (getOut.data) {
            lastGoodOut.current = getOut.data as readonly bigint[];
        }
    }, [getOut.data]);

    useEffect(() => {
        if (getIn.data) {
            lastGoodIn.current = getIn.data as readonly bigint[];
        }
    }, [getIn.data]);

    const formatAmount = useCallback((value: number, maxDecimals = 6) => {
        if (!Number.isFinite(value) || value <= 0) return "";
        const factor = Math.pow(10, maxDecimals);
        const floored = Math.floor(value * factor) / factor;
        const fixed = floored.toFixed(maxDecimals);
        return fixed.replace(/\.0+$/, "").replace(/\.(\d*?)0+$/, ".$1");
    }, []);

    const expectedOutWei = useMemo(() => {
        if (activeInput !== "from" || !shouldUseFromAmount) return BigInt(0);
        const amounts =
            (getOut.data as readonly bigint[] | undefined) ||
            lastGoodOut.current;
        if (amounts && amounts.length > 0) {
            return amounts[amounts.length - 1];
        }
        return BigInt(0);
    }, [activeInput, getOut.data, shouldUseFromAmount]);

    const expectedInWei = useMemo(() => {
        if (activeInput !== "to" || !shouldUseToAmount) return BigInt(0);
        const amounts =
            (getIn.data as readonly bigint[] | undefined) || lastGoodIn.current;
        if (amounts && amounts.length > 0) {
            return amounts[0];
        }
        return BigInt(0);
    }, [activeInput, getIn.data, shouldUseToAmount]);

    const expectedOutAmount = useMemo(() => {
        if (!expectedOutWei || expectedOutWei === BigInt(0)) return "";
        const amount = Number(formatUnits(expectedOutWei, toSwap.decimals));
        return formatAmount(amount);
    }, [expectedOutWei, toSwap.decimals, formatAmount]);

    const expectedInAmount = useMemo(() => {
        if (!expectedInWei || expectedInWei === BigInt(0)) return "";
        const amount = Number(formatUnits(expectedInWei, fromSwap.decimals));
        return formatAmount(amount);
    }, [expectedInWei, fromSwap.decimals, formatAmount]);

    const isFetching = useMemo(() => {
        if (activeInput === "from") {
            return getOut.isLoading || getOut.isFetching;
        }
        return getIn.isLoading || getIn.isFetching;
    }, [
        activeInput,
        getOut.isLoading,
        getOut.isFetching,
        getIn.isLoading,
        getIn.isFetching,
    ]);

    return {
        path,
        expectedOutWei,
        expectedInWei,
        expectedOutAmount,
        expectedInAmount,
        isFetching,
        fromAddress,
        toAddress,
    };
};

export default useSwapQuotes;
