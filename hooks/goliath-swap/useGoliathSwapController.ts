"use client";

import { useState, useMemo, useCallback } from "react";
import {
    useAccount,
    useBalance,
    useReadContract,
    useWriteContract,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi, maxUint256 } from "viem";
import type { Address } from "viem";
import { goliathConfig } from "@/config/goliath";
import { useGoliathSwapQuote } from "./useGoliathSwapQuote";
import { useGoliathSwapExecution } from "./useGoliathSwapExecution";
import type { Token } from "@/config/swap";
import xcnIcon from "@/assets/icons/XCN.svg";
import usdcIcon from "@/assets/icons/usdc.svg";
import ethIcon from "@/assets/icons/eth.svg";

// ---------------------------------------------------------------------------
// Goliath Token type (extends the shared Token interface with native flag)
// ---------------------------------------------------------------------------

export interface GoliathToken extends Token {
    /** true for the chain's native currency (XCN on Goliath). */
    isNative: boolean;
}

// ---------------------------------------------------------------------------
// Token list
// ---------------------------------------------------------------------------

const GOLIATH_TOKENS: GoliathToken[] = [
    {
        id: "xcn-native",
        name: "XCN",
        symbol: "XCN",
        icon: xcnIcon,
        decimals: 18,
        isNative: true,
    },
    {
        id: "usdc",
        name: "USD Coin",
        symbol: "USDC",
        icon: usdcIcon,
        decimals: 6,
        address: goliathConfig.tokens.USDC,
        isNative: false,
    },
    {
        id: "eth",
        name: "Ethereum",
        symbol: "ETH",
        icon: ethIcon,
        decimals: 18,
        address: goliathConfig.tokens.ETH,
        isNative: false,
    },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Main orchestrator hook for the Goliath swap page.
 *
 * Manages token selection, amount input, balance queries, ERC-20 approval,
 * quote fetching (via {@link useGoliathSwapQuote}), and swap execution (via
 * {@link useGoliathSwapExecution}).
 *
 * The return shape intentionally mirrors `useSwapController` so the swap page
 * can render a similar UI for both Ethereum and Goliath variants.
 */
export function useGoliathSwapController() {
    const { address } = useAccount();

    // -- Token & amount state ------------------------------------------------
    const [fromToken, setFromTokenState] = useState<GoliathToken>(
        GOLIATH_TOKENS[0],
    ); // XCN
    const [toToken, setToTokenState] = useState<GoliathToken>(
        GOLIATH_TOKENS[1],
    ); // USDC
    const [fromAmount, setFromAmountState] = useState("");
    const [slippageBps] = useState(50); // 0.5 %

    // -- Parsed amount -------------------------------------------------------
    const amountIn = useMemo(() => {
        if (!fromAmount || parseFloat(fromAmount) <= 0) return null;
        try {
            return parseUnits(fromAmount, fromToken.decimals);
        } catch {
            return null;
        }
    }, [fromAmount, fromToken.decimals]);

    // -- Resolve router-compatible addresses ---------------------------------
    // Native XCN uses the WXCN address on the swap path.
    const tokenInAddress: Address | null = fromToken.isNative
        ? goliathConfig.tokens.WXCN
        : (fromToken.address as Address) ?? null;
    const tokenOutAddress: Address | null = toToken.isNative
        ? goliathConfig.tokens.WXCN
        : (toToken.address as Address) ?? null;

    // -- Quote ---------------------------------------------------------------
    const {
        trade,
        minimumReceived,
        priceImpactBps,
        isHighImpact,
        isBlocked,
        isLoading: quoteLoading,
    } = useGoliathSwapQuote(tokenInAddress, tokenOutAddress, amountIn, slippageBps);

    const toAmount = trade
        ? formatUnits(trade.outputAmount, toToken.decimals)
        : "";

    // -- Exchange rate -------------------------------------------------------
    const exchangeRate = useMemo(() => {
        const fromNum = parseFloat(fromAmount);
        const toNum = parseFloat(toAmount);
        if (!fromNum || fromNum <= 0 || !toNum || toNum <= 0) return 0;
        return toNum / fromNum;
    }, [fromAmount, toAmount]);

    // -- Minimum received (human-readable) -----------------------------------
    const minReceivedTokens = useMemo(() => {
        if (!minimumReceived || minimumReceived === 0n) return 0;
        try {
            return parseFloat(formatUnits(minimumReceived, toToken.decimals));
        } catch {
            return 0;
        }
    }, [minimumReceived, toToken.decimals]);

    // -- Balance -------------------------------------------------------------
    const { data: fromBalance } = useBalance({
        address,
        token: fromToken.isNative
            ? undefined
            : (fromToken.address as Address),
        query: { enabled: !!address },
    });

    const { data: toBalance } = useBalance({
        address,
        token: toToken.isNative
            ? undefined
            : (toToken.address as Address),
        query: { enabled: !!address },
    });

    const balances: Record<string, string> = useMemo(
        () => ({
            [fromToken.symbol]: fromBalance?.formatted ?? "0",
            [toToken.symbol]: toBalance?.formatted ?? "0",
        }),
        [fromToken.symbol, toToken.symbol, fromBalance, toBalance],
    );

    // -- ERC-20 Approval -----------------------------------------------------
    const routerAddress = goliathConfig.dex.routerAddress;

    const { data: allowance } = useReadContract({
        address: (fromToken.address ?? "0x0") as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address ?? "0x0", routerAddress],
        query: { enabled: !!address && !fromToken.isNative && !!fromToken.address },
    });

    const needApproval =
        !fromToken.isNative &&
        amountIn !== null &&
        (allowance ?? 0n) < amountIn;

    const { writeContractAsync: approveAsync, isPending: isApproving } =
        useWriteContract();

    const approve = useCallback(async () => {
        if (!fromToken.address) return;
        await approveAsync({
            address: fromToken.address as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [routerAddress, maxUint256],
        });
    }, [fromToken.address, approveAsync, routerAddress]);

    // -- Swap execution ------------------------------------------------------
    const {
        execute: executeSwapTx,
        isPending: isSwapping,
        isSuccess,
        txHash,
        error,
        reset,
    } = useGoliathSwapExecution();

    const handleSwap = useCallback(async () => {
        if (!trade || !minimumReceived) return;
        await executeSwapTx({
            path: trade.path,
            amountIn: trade.inputAmount,
            amountOutMin: minimumReceived,
            isNativeIn: fromToken.isNative,
            isNativeOut: toToken.isNative,
        });
    }, [trade, minimumReceived, fromToken.isNative, toToken.isNative, executeSwapTx]);

    // -- Swap direction toggle -----------------------------------------------
    const handleSwapTokens = useCallback(() => {
        const prevFrom = fromToken;
        const prevTo = toToken;
        setFromTokenState(prevTo);
        setToTokenState(prevFrom);
        setFromAmountState("");
    }, [fromToken, toToken]);

    // -- Insufficient balance ------------------------------------------------
    const hasInsufficientFunds = useMemo(() => {
        if (!address || !fromAmount || parseFloat(fromAmount) <= 0) return false;
        if (!fromBalance) return true;
        return amountIn !== null && amountIn > fromBalance.value;
    }, [address, fromAmount, amountIn, fromBalance]);

    // -- Disabled state ------------------------------------------------------
    const isSwapDisabled = useMemo(() => {
        if (!address) return true;
        if (!trade) return true;
        if (isBlocked) return true;
        if (hasInsufficientFunds) return true;
        return false;
    }, [address, trade, isBlocked, hasInsufficientFunds]);

    // -- Setters with amount reset -------------------------------------------
    const setFromToken = useCallback(
        (t: Token) => {
            const goliathToken = GOLIATH_TOKENS.find(
                (gt) => gt.symbol === t.symbol,
            );
            if (goliathToken) {
                setFromTokenState(goliathToken);
                setFromAmountState("");
            }
        },
        [],
    );

    const setToToken = useCallback(
        (t: Token) => {
            const goliathToken = GOLIATH_TOKENS.find(
                (gt) => gt.symbol === t.symbol,
            );
            if (goliathToken) {
                setToTokenState(goliathToken);
                setFromAmountState("");
            }
        },
        [],
    );

    const setFromAmount = useCallback((a: string) => {
        setFromAmountState(a);
    }, []);

    return {
        // Token state
        fromToken: fromToken as Token,
        toToken: toToken as Token,
        fromAmount,
        toAmount,

        // Balances
        balances,

        // Quote data
        exchangeRate,
        minReceivedTokens,
        priceImpactBps,
        isHighImpact,
        isBlocked,
        quoteLoading,
        slippageBps,

        // Approval
        needApproval,
        isApproving,

        // Execution
        isSwapping,
        isSwapDisabled,
        hasInsufficientFunds,
        isSuccess,
        txHash,
        error,

        // Token list for UI
        tokenList: GOLIATH_TOKENS as Token[],

        // Handlers
        handleFromTokenSelect: setFromToken,
        handleToTokenSelect: setToToken,
        handleFromAmountChange: setFromAmount,
        handleSwapCurrencies: handleSwapTokens,

        // Actions
        approve,
        executeSwap: handleSwap,
        reset,
    };
}
