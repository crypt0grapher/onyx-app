"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { goliathConfig } from "@/config/goliath";
import { uniswapV2PairAbi } from "@/contracts/abis/goliath";
import { computePairAddress, MIN_RESERVE } from "@/utils/goliathSwap";
import type { PairData } from "@/utils/goliathSwap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PairCandidate {
  address: Address;
  token0: Address;
  token1: Address;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches on-chain reserves for all potentially relevant Uniswap V2 pairs
 * between `tokenIn` and `tokenOut`, including 1-hop routes through base
 * tokens (WXCN, USDC, ETH).
 *
 * Pair addresses are computed deterministically via CREATE2 -- no factory
 * `getPair` calls are needed.
 */
export function useGoliathPairs(
  tokenIn: Address | null,
  tokenOut: Address | null,
) {
  const { dex, tokens } = goliathConfig;
  const baseTokens: Address[] = useMemo(
    () => [tokens.WXCN, tokens.USDC, tokens.ETH],
    [tokens.WXCN, tokens.USDC, tokens.ETH],
  );

  // Build the list of pair candidates whose reserves we need to fetch.
  const pairCandidates: PairCandidate[] = useMemo(() => {
    if (!tokenIn || !tokenOut) return [];

    const candidates: PairCandidate[] = [];
    const seen = new Set<string>();

    const addCandidate = (a: Address, b: Address) => {
      const [t0, t1] =
        a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
      const key = `${t0.toLowerCase()}-${t1.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);

      candidates.push({
        address: computePairAddress(
          dex.factoryAddress,
          t0,
          t1,
          dex.initCodeHash,
        ),
        token0: t0,
        token1: t1,
      });
    };

    // Direct pair
    addCandidate(tokenIn, tokenOut);

    // 1-hop through each base token
    for (const base of baseTokens) {
      if (
        base.toLowerCase() === tokenIn.toLowerCase() ||
        base.toLowerCase() === tokenOut.toLowerCase()
      ) {
        continue;
      }
      addCandidate(tokenIn, base);
      addCandidate(base, tokenOut);
    }

    return candidates;
  }, [tokenIn, tokenOut, dex.factoryAddress, dex.initCodeHash, baseTokens]);

  // Batch-read reserves for all candidate pairs.
  const contracts = useMemo(
    () =>
      pairCandidates.map((p) => ({
        address: p.address,
        abi: uniswapV2PairAbi,
        functionName: "getReserves" as const,
      })),
    [pairCandidates],
  );

  const { data: reserveResults, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: pairCandidates.length > 0,
      refetchInterval: 15_000,
    },
  });

  // Parse results into PairData, discarding empty / depleted pairs.
  const pairs: PairData[] = useMemo(() => {
    if (!reserveResults) return [];

    const result: PairData[] = [];
    for (let i = 0; i < reserveResults.length; i++) {
      const entry = reserveResults[i];
      if (entry.status !== "success" || !entry.result) continue;

      const [reserve0, reserve1] = entry.result as [bigint, bigint, number];
      if (reserve0 < MIN_RESERVE && reserve1 < MIN_RESERVE) continue;

      result.push({
        pairAddress: pairCandidates[i].address,
        token0: pairCandidates[i].token0,
        token1: pairCandidates[i].token1,
        reserve0,
        reserve1,
      });
    }
    return result;
  }, [reserveResults, pairCandidates]);

  return { pairs, baseTokens, isLoading };
}
