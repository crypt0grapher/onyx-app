"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { useGoliathPairs } from "./useGoliathPairs";
import {
  findBestRoute,
  MAX_PRICE_IMPACT_BPS,
  WARN_PRICE_IMPACT_BPS,
} from "@/utils/goliathSwap";
import type { TradeRoute } from "@/utils/goliathSwap";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Given an input token, output token, and input amount, find the best
 * Uniswap V2 trade route and evaluate its price impact.
 *
 * Returns:
 *   - `trade`         -- the best route (or `null` if none found)
 *   - `priceImpactBps`-- cumulative price impact in basis points
 *   - `isHighImpact`  -- true when impact exceeds the warning threshold (5 %)
 *   - `isBlocked`     -- true when impact exceeds the maximum threshold (15 %)
 *   - `isLoading`     -- true while on-chain reserves are being fetched
 */
export function useGoliathTrade(
  tokenIn: Address | null,
  tokenOut: Address | null,
  amountIn: bigint | null,
): {
  trade: TradeRoute | null;
  priceImpactBps: bigint;
  isHighImpact: boolean;
  isBlocked: boolean;
  isLoading: boolean;
} {
  const { pairs, baseTokens, isLoading: pairsLoading } = useGoliathPairs(
    tokenIn,
    tokenOut,
  );

  const trade = useMemo(() => {
    if (
      !tokenIn ||
      !tokenOut ||
      !amountIn ||
      amountIn === 0n ||
      pairs.length === 0
    ) {
      return null;
    }
    return findBestRoute(pairs, tokenIn, tokenOut, amountIn, baseTokens);
  }, [pairs, tokenIn, tokenOut, amountIn, baseTokens]);

  const priceImpactBps = trade?.priceImpactBps ?? 0n;

  return {
    trade,
    priceImpactBps,
    isHighImpact: priceImpactBps > WARN_PRICE_IMPACT_BPS,
    isBlocked: priceImpactBps > MAX_PRICE_IMPACT_BPS,
    isLoading: pairsLoading,
  };
}
