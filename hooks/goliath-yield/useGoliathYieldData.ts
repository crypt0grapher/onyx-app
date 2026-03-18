"use client";

import { useMemo } from "react";
import { useReadContracts, useBalance, useAccount, useChainId } from "wagmi";
import { goliathConfig } from "@/config/goliath";
import { isGoliathChain } from "@/config/networks";
import { stakedXcnAbi } from "@/contracts/abis/goliath";
import {
  type GoliathProtocolData,
  type GoliathUserData,
  RAY,
  SECONDS_PER_YEAR,
} from "./types";

const ZERO = BigInt(0);

/**
 * Precision multiplier used when converting the bigint APR to a float.
 * We scale up by 1e8 before the integer division so that after converting
 * to `Number` and dividing back we keep ~8 significant digits -- more than
 * enough for an APR display value.
 */
const APR_PRECISION = BigInt(10) ** BigInt(8);
const APR_PERCENT = BigInt(100);

export function useGoliathYieldData() {
  const { address } = useAccount();
  const chainId = useChainId();
  const stXcnAddress = goliathConfig.staking.stXcnAddress;
  const onGoliath = isGoliathChain(chainId);

  // ---- Protocol data (multicall) ----------------------------------------
  const {
    data: protocolResults,
    isLoading: protocolLoading,
    refetch: refetchProtocol,
  } = useReadContracts({
    contracts: [
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "totalSupply",
      },
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "getCumulativeIndex",
      },
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "getRewardRate",
      },
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "getFeePercent",
      },
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "getLastUpdateTimestamp",
      },
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "paused",
      },
    ],
    query: {
      refetchInterval: goliathConfig.staking.protocolPollMs,
      enabled: onGoliath,
    },
  });

  // ---- Contract balance (native XCN held by stXCN contract) ---------------
  const { data: contractBal } = useBalance({
    address: stXcnAddress,
    query: {
      refetchInterval: goliathConfig.staking.protocolPollMs,
      enabled: onGoliath,
    },
  });

  // ---- User data (when connected) ----------------------------------------
  const {
    data: userResults,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useReadContracts({
    contracts: [
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "balanceOf",
        args: [address!],
      },
      {
        address: stXcnAddress,
        abi: stakedXcnAbi,
        functionName: "scaledBalanceOf",
        args: [address!],
      },
    ],
    query: {
      refetchInterval: goliathConfig.staking.balancePollMs,
      enabled: !!address && onGoliath,
    },
  });

  // ---- Derived values -----------------------------------------------------
  const protocolData: GoliathProtocolData | null = useMemo(() => {
    if (!protocolResults) return null;

    return {
      totalSupply: (protocolResults[0].result as bigint) ?? ZERO,
      cumulativeIndex: (protocolResults[1].result as bigint) ?? ZERO,
      rewardRateRay: (protocolResults[2].result as bigint) ?? ZERO,
      feePercentBps: Number((protocolResults[3].result as bigint) ?? ZERO),
      lastUpdateTimestamp: Number(
        (protocolResults[4].result as bigint) ?? ZERO,
      ),
      isPaused: (protocolResults[5].result as boolean) ?? false,
      contractBalance: contractBal?.value ?? ZERO,
    };
  }, [protocolResults, contractBal]);

  const userData: GoliathUserData | null = useMemo(() => {
    if (!userResults || !address) return null;

    const stXcnBalance = (userResults[0].result as bigint) ?? ZERO;
    const scaledBalance = (userResults[1].result as bigint) ?? ZERO;
    const cumulativeIndex = protocolData?.cumulativeIndex ?? RAY;
    const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;

    return { stXcnBalance, scaledBalance, underlyingXcn };
  }, [userResults, address, protocolData?.cumulativeIndex]);

  // APR: (rewardRateRay * SECONDS_PER_YEAR) / RAY * 100
  // To keep precision we scale up before the integer division, then convert.
  const apr = useMemo(() => {
    if (!protocolData) return 0;
    const scaled =
      (protocolData.rewardRateRay *
        SECONDS_PER_YEAR *
        APR_PERCENT *
        APR_PRECISION) /
      RAY;
    return Number(scaled) / Number(APR_PRECISION);
  }, [protocolData]);

  const refetch = () => {
    refetchProtocol();
    refetchUser();
  };

  return {
    protocolData,
    userData,
    apr,
    isLoading: protocolLoading || userLoading,
    refetch,
  };
}
