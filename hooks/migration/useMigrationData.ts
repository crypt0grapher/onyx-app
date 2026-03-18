"use client";

import { useReadContracts, useBalance, useAccount } from "wagmi";
import { erc20Abi } from "viem";
import { goliathConfig } from "@/config/goliath";
import { chnStakingAbi } from "@/contracts/abis/goliath";
import type { StakingSnapshot } from "./types";

export function useMigrationData() {
    const { address } = useAccount();
    const sourceChainId = goliathConfig.bridge.sourceChainId;
    const stakingAddress = goliathConfig.migration.sourceStakingAddress;
    const xcnAddress = goliathConfig.bridge.sourceTokens.XCN;
    const bridgeAddress = goliathConfig.bridge.sourceBridgeAddress;

    // Read staked amount and pending rewards from source chain CHNStaking
    const {
        data: stakingResults,
        isLoading: stakingLoading,
        refetch: refetchStaking,
    } = useReadContracts({
        contracts: [
            {
                address: stakingAddress,
                abi: chnStakingAbi,
                functionName: "getStakingAmount",
                args: [0n, address!],
                chainId: sourceChainId,
            },
            {
                address: stakingAddress,
                abi: chnStakingAbi,
                functionName: "pendingReward",
                args: [0n, address!],
                chainId: sourceChainId,
            },
        ],
        query: {
            enabled: !!address,
            refetchInterval: goliathConfig.migration.dataPollMs,
        },
    });

    // Read XCN token balance on source chain
    const {
        data: xcnBalance,
        isLoading: balanceLoading,
        refetch: refetchBalance,
    } = useBalance({
        address,
        token: xcnAddress,
        chainId: sourceChainId,
        query: {
            enabled: !!address,
            refetchInterval: goliathConfig.migration.dataPollMs,
        },
    });

    // Read XCN allowance for bridge contract on source chain
    const {
        data: allowanceResult,
        isLoading: allowanceLoading,
        refetch: refetchAllowance,
    } = useReadContracts({
        contracts: [
            {
                address: xcnAddress,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address!, bridgeAddress],
                chainId: sourceChainId,
            },
        ],
        query: {
            enabled: !!address,
            refetchInterval: goliathConfig.migration.dataPollMs,
        },
    });

    const snapshot: StakingSnapshot = {
        staked: (stakingResults?.[0]?.result as bigint) ?? 0n,
        rewards: (stakingResults?.[1]?.result as bigint) ?? 0n,
        walletXcn: xcnBalance?.value ?? 0n,
        allowance: (allowanceResult?.[0]?.result as bigint) ?? 0n,
        isLoading: stakingLoading || balanceLoading || allowanceLoading,
        error: null,
    };

    const refetch = () => {
        void refetchStaking();
        void refetchBalance();
        void refetchAllowance();
    };

    return { snapshot, refetch };
}
