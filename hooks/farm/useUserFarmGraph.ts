import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { convertWeiToTokens } from "@/utils/format";
import { STAKING_CONSTANTS, CONTRACTS } from "@/contracts/config";
import { useFarmUser } from "@/hooks/farm/useFarmUser";
import { estimateFromBlockForDays, getFarmLogs } from "@/lib/farm/getFarmLogs";

export type FarmGraphDatum = {
  date: string;
  staked: number;
  earnings: number;
};

export const useUserFarmGraph = (days: number = 7) => {
  const { address } = useAccount();
  const user = useFarmUser(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-farm-graph", address?.toLowerCase(), days],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      try {
        const approxBlocksPerDay = STAKING_CONSTANTS.BLOCKS_PER_DAY;
        const fromBlock = await estimateFromBlockForDays(
          days,
          approxBlocksPerDay
        );

        const { getPublicClient } = await import("wagmi/actions");
        const { wagmiConfig } = await import("@/config/wagmi");
        const client = getPublicClient(wagmiConfig, {
          chainId: CONTRACTS.masterChef.chainId,
        });

        if (!client) {
          throw new Error("Public client unavailable");
        }

        const toBlock = await client.getBlockNumber();

        const result = await getFarmLogs({
          pid: 0,
          user: address as `0x${string}`,
          fromBlock,
          toBlock,
        });

        return result;
      } catch (err) {
        console.error("useUserFarmGraph: Error fetching data:", err);
        throw err;
      }
    },
    enabled: !!address,
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  const graphData = useMemo((): FarmGraphDatum[] => {
    const empty: FarmGraphDatum[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      empty.push({
        date: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
        }),
        staked: 0,
        earnings: 0,
      });
    }

    if (!data) {
      const stakedNow = parseFloat(
        convertWeiToTokens(
          user.stakedWei?.toString?.() || "0",
          user.lpDecimals || 18,
          2,
          false
        )
      );
      return empty.map((row) => ({ ...row, staked: stakedNow }));
    }

    const dailyMap = new Map<string, { staked: number; earnings: number }>();
    const processed = new Set<string>();
    for (const row of empty) dailyMap.set(row.date, { staked: 0, earnings: 0 });

    const sortedDeposits = [...data.deposits].sort((a, b) =>
      Number(a.blockNumber - b.blockNumber)
    );
    const sortedWithdraws = [...data.withdraws].sort((a, b) =>
      Number(a.blockNumber - b.blockNumber)
    );
    const sortedTransfers = [...data.transfers].sort((a, b) =>
      Number(a.blockNumber - b.blockNumber)
    );

    const changes: Array<{
      blockNumber: bigint;
      timestamp?: number;
      amountLp: number;
    }> = [
      ...sortedDeposits.map((tx) => ({
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
        amountLp: parseFloat(
          convertWeiToTokens(
            tx.amount.toString(),
            user.lpDecimals || 18,
            2,
            false
          )
        ),
      })),
      ...sortedWithdraws.map((tx) => ({
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
        amountLp: -parseFloat(
          convertWeiToTokens(
            tx.amount.toString(),
            user.lpDecimals || 18,
            2,
            false
          )
        ),
      })),
    ].sort((a, b) => {
      const ta = a.timestamp ?? 0;
      const tb = b.timestamp ?? 0;
      if (ta !== tb) return ta - tb;
      return Number(a.blockNumber - b.blockNumber);
    });

    let runningLpStaked = 0;

    for (const ch of changes) {
      const ts = new Date(ch.timestamp || 0);
      const dateKey = ts.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
      const daysDiff = Math.floor(
        (today.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= days) continue;
      runningLpStaked = Math.max(0, runningLpStaked + ch.amountLp);
      processed.add(dateKey);
      const existing = dailyMap.get(dateKey) || {
        staked: 0,
        earnings: 0,
      };
      dailyMap.set(dateKey, { ...existing, staked: runningLpStaked });
    }

    for (const tx of sortedTransfers) {
      const ts = new Date(tx.timestamp || 0);
      const dateKey = ts.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
      const daysDiff = Math.floor(
        (today.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= days) continue;
      const amountXcn = parseFloat(
        convertWeiToTokens(
          tx.amount.toString(),
          STAKING_CONSTANTS.XCN_DECIMALS,
          2,
          false
        )
      );
      const existing = dailyMap.get(dateKey) || {
        staked: 0,
        earnings: 0,
      };
      dailyMap.set(dateKey, {
        ...existing,
        earnings: existing.earnings + amountXcn,
      });
      processed.add(dateKey);
    }

    const result: FarmGraphDatum[] = [];
    let lastStaked = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
      const v = dailyMap.get(dateKey) || { staked: 0, earnings: 0 };
      if (!processed.has(dateKey) && v.staked === 0) v.staked = lastStaked;
      else lastStaked = v.staked;
      result.push({
        date: dateKey,
        staked: Math.round(v.staked * 100) / 100,
        earnings: Math.round(v.earnings * 100) / 100,
      });
    }

    return result;
  }, [data, days, user.stakedWei, user.lpDecimals]);

  return {
    data: graphData,
    isLoading,
    error,
    hasData: !isLoading && !!address && !!data && data.deposits.length > 0,
  };
};

export default useUserFarmGraph;
