"use client";

import { useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { applySlippageBps, toWei } from "@/utils/swap";
import { formatUnits } from "viem";
import { SWAP_TOKENS, type SwapTokenSymbol } from "@/config/swapTokens";
import useGasEstimate from "@/hooks/swap/useGasEstimate";
import useBalances from "@/hooks/swap/useBalances";
import useSwapExecution from "@/hooks/swap/useSwapExecution";
import useSwapState from "./useSwapState";
import useSwapQuotes from "./useSwapQuotes";
import { SUPPORTED_TOKENS } from "@/config/swap";
import useTokenPrice from "./useTokenPrice";
import { calculateUsdValue } from "@/utils/format";

export const useSwapController = () => {
    const { address: accountAddress } = useAccount();

    const {
        fromToken,
        toToken,
        fromAmount: stateFromAmount,
        toAmount: stateToAmount,
        activeInput,
        slippageBps,
        deadlineSec,
        handleFromAmountChange,
        handleToAmountChange,
        handleFromTokenSelect,
        handleToTokenSelect,
        setFromToken,
        setToToken,
        setFromAmount,
        setToAmount,
        setActiveInput,
    } = useSwapState();

    const quotes = useSwapQuotes({
        fromToken,
        toToken,
        fromAmount: stateFromAmount,
        toAmount: stateToAmount,
        activeInput,
    });

    const { priceUsd: fromPriceUsd, isLoading: isLoadingFromPrice } =
        useTokenPrice(fromToken);
    const { priceUsd: toPriceUsd, isLoading: isLoadingToPrice } =
        useTokenPrice(toToken);

    const fromAmount = useMemo(() => {
        if (activeInput === "from") {
            return stateFromAmount;
        }
        return quotes.expectedInAmount || "";
    }, [activeInput, stateFromAmount, quotes.expectedInAmount]);

    const toAmount = useMemo(() => {
        if (activeInput === "to") {
            return stateToAmount;
        }
        return quotes.expectedOutAmount || "";
    }, [activeInput, stateToAmount, quotes.expectedOutAmount]);

    const handleSwapCurrencies = useCallback(() => {
        setFromToken(toToken);
        setToToken(fromToken);

        if (activeInput === "from") {
            setActiveInput("to");
            setToAmount(stateFromAmount);
            setFromAmount("");
        } else {
            setActiveInput("from");
            setFromAmount(stateToAmount);
            setToAmount("");
        }
    }, [
        activeInput,
        stateFromAmount,
        stateToAmount,
        fromToken,
        toToken,
        setFromToken,
        setToToken,
        setActiveInput,
        setFromAmount,
        setToAmount,
    ]);

    const fromSwap = SWAP_TOKENS[fromToken.symbol as SwapTokenSymbol];
    const toSwap = SWAP_TOKENS[toToken.symbol as SwapTokenSymbol];

    const effectiveAmountInWei = useMemo(() => {
        return toWei(fromAmount || "0", fromSwap.decimals);
    }, [fromAmount, fromSwap.decimals]);

    const effectiveAmountOutWei = useMemo(() => {
        return toWei(toAmount || "0", toSwap.decimals);
    }, [toAmount, toSwap.decimals]);

    const minimumOutWei = useMemo(() => {
        if (activeInput === "from") {
            const expectedOut = quotes.expectedOutWei || BigInt(0);
            return applySlippageBps(expectedOut, slippageBps, "min");
        }
        return effectiveAmountOutWei;
    }, [
        effectiveAmountOutWei,
        slippageBps,
        activeInput,
        quotes.expectedOutWei,
    ]);

    const maximumInWei = useMemo(() => {
        if (activeInput === "to") {
            const expectedIn = quotes.expectedInWei || BigInt(0);
            return applySlippageBps(expectedIn, slippageBps, "max");
        }
        return undefined;
    }, [activeInput, quotes.expectedInWei, slippageBps]);

    const minReceivedTokens = useMemo(() => {
        if (!minimumOutWei || minimumOutWei === BigInt(0)) return 0;
        try {
            const formatted = formatUnits(minimumOutWei, toSwap.decimals);
            return parseFloat(formatted);
        } catch {
            return 0;
        }
    }, [minimumOutWei, toSwap.decimals]);

    const exchangeRate = useMemo(() => {
        const fromNum = parseFloat(fromAmount);
        const toNum = parseFloat(toAmount);
        if (!fromNum || fromNum <= 0 || !toNum || toNum <= 0) return 0;

        return toNum / fromNum;
    }, [fromAmount, toAmount]);

    const fromUsdValue = calculateUsdValue(fromAmount, fromPriceUsd);
    const toUsdValue = calculateUsdValue(toAmount, toPriceUsd);
    const minReceivedUsd = minReceivedTokens * toPriceUsd;

    const ethToken = SUPPORTED_TOKENS.find((t) => t.symbol === "ETH");
    const { priceUsd: ethPriceUsd } = useTokenPrice(ethToken!);
    const gasFeeUsd = useGasEstimate(
        activeInput === "from"
            ? effectiveAmountInWei > BigInt(0) && minimumOutWei > BigInt(0)
                ? {
                      direction: "exactIn" as const,
                      path: quotes.path as `0x${string}`[],
                      amountInWei: effectiveAmountInWei,
                      minimumAmountOutWei: minimumOutWei,
                      deadlineSec: deadlineSec,
                      fromAddress: quotes.fromAddress,
                      to: accountAddress as `0x${string}` | undefined,
                      ethUsdPrice: ethPriceUsd,
                  }
                : null
            : effectiveAmountOutWei > BigInt(0) &&
              (maximumInWei ?? BigInt(0)) > BigInt(0)
            ? {
                  direction: "exactOut" as const,
                  path: quotes.path as `0x${string}`[],
                  amountOutWei: effectiveAmountOutWei,
                  maximumAmountInWei: maximumInWei!,
                  deadlineSec: deadlineSec,
                  fromAddress: quotes.fromAddress,
                  to: accountAddress as `0x${string}` | undefined,
                  ethUsdPrice: ethPriceUsd,
              }
            : null
    );

    const { balances, refetchBalances } = useBalances([fromToken, toToken]);

    const { needApproval, executeSwap, isApprovePending, isSwapPending } =
        useSwapExecution({
            fromAddress: quotes.fromAddress,
            path: quotes.path as `0x${string}`[],
            amountInWei: effectiveAmountInWei,
            minimumOutWei,
            amountOutWei: effectiveAmountOutWei,
            maximumInWei: maximumInWei,
            activeInput,
            deadlineSec: deadlineSec,
            to: accountAddress as `0x${string}` | undefined,
            isEthIn: fromToken.symbol === "ETH",
            refetchBalances,
        });

    const hasInsufficientFunds = useMemo(() => {
        if (!accountAddress || !fromAmount || parseFloat(fromAmount) <= 0)
            return false;

        const userBalance = balances[fromToken.symbol];
        if (!userBalance) return true;

        const balanceNum = parseFloat(userBalance);
        const requestedNum = parseFloat(fromAmount);

        return balanceNum < requestedNum;
    }, [accountAddress, fromAmount, fromToken.symbol, balances]);

    const isSwapDisabled = useMemo(() => {
        if (!accountAddress) return true;

        const nFrom = parseFloat(fromAmount);
        if (!Number.isFinite(nFrom) || nFrom <= 0) return true;

        const nTo = parseFloat(toAmount);
        if (!Number.isFinite(nTo) || nTo <= 0) return true;

        if (hasInsufficientFunds) return true;

        return false;
    }, [accountAddress, fromAmount, toAmount, hasInsufficientFunds]);

    return {
        fromToken: fromToken,
        toToken: toToken,
        fromAmount,
        toAmount,
        slippageBps: slippageBps,
        deadlineSec: deadlineSec,
        fromUsdValue,
        toUsdValue,
        balances,
        needApproval,
        isApprovePending,
        isSwapPending,
        isSwapDisabled,
        hasInsufficientFunds,
        exchangeRate,
        minReceivedTokens,
        minReceivedUsd,
        gasFeeUsd,
        isFetching: quotes.isFetching || isLoadingFromPrice || isLoadingToPrice,
        handleFromAmountChange: handleFromAmountChange,
        handleToAmountChange: handleToAmountChange,
        handleFromTokenSelect: handleFromTokenSelect,
        handleToTokenSelect: handleToTokenSelect,
        handleSwapCurrencies,
        executeSwap,
    };
};

export default useSwapController;
