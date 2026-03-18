"use client";

import type { Address } from "viem";
import { useGoliathTrade } from "./useGoliathTrade";
import { applySlippageMinimum } from "@/utils/goliathSwap";
import type { TradeRoute } from "@/utils/goliathSwap";
import { useDebounce } from "@/hooks/common/useDebounce";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * High-level swap quote hook.
 *
 * Wraps {@link useGoliathTrade} with:
 *   - Input debouncing (300 ms) to avoid excessive on-chain reads while the
 *     user is still typing.
 *   - Slippage-adjusted `minimumReceived` calculation.
 *
 * @param tokenIn     - Address of the token being sold (or `null`).
 * @param tokenOut    - Address of the token being bought (or `null`).
 * @param amountIn    - Raw input amount in the token's smallest unit (or `null`).
 * @param slippageBps - Slippage tolerance in basis points (default 50 = 0.5 %).
 */
export function useGoliathSwapQuote(
  tokenIn: Address | null,
  tokenOut: Address | null,
  amountIn: bigint | null,
  slippageBps: number = 50,
): {
  trade: TradeRoute | null;
  minimumReceived: bigint | null;
  priceImpactBps: bigint;
  isHighImpact: boolean;
  isBlocked: boolean;
  isLoading: boolean;
} {
  const debouncedAmount = useDebounce(amountIn, 300);

  const { trade, priceImpactBps, isHighImpact, isBlocked, isLoading } =
    useGoliathTrade(tokenIn, tokenOut, debouncedAmount);

  const minimumReceived = trade
    ? applySlippageMinimum(trade.outputAmount, slippageBps)
    : null;

  return {
    trade,
    minimumReceived,
    priceImpactBps,
    isHighImpact,
    isBlocked,
    isLoading,
  };
}
