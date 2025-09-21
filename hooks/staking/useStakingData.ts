import React from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS, STAKING_CONSTANTS } from "@/contracts/config";
import {
    calculateStakingAPR,
    calculateDailyEmission,
    convertWeiToTokens,
    formatToReadablePercentage,
    formatLargeNumber,
} from "@/utils/format";

interface PoolInfo {
    stakToken: string;
    allocPoint: bigint;
    lastRewardBlock: bigint;
    accRewardPerShare: bigint;
    totalAmountStake: bigint;
}

interface ContractResult {
    result?: unknown;
    status: string;
}

export const useStakingContracts = () => {
    const {
        data: contractData,
        isError,
        isLoading,
        refetch,
    } = useReadContracts({
        contracts: [
            {
                address: CONTRACTS.xcnStaking.address,
                abi: CONTRACTS.xcnStaking.abi,
                functionName: "poolInfo",
                args: [STAKING_CONSTANTS.XCN_POOL_ID],
                chainId: CONTRACTS.xcnStaking.chainId,
            },
            {
                address: CONTRACTS.xcnStaking.address,
                abi: CONTRACTS.xcnStaking.abi,
                functionName: "rewardPerBlock",
                chainId: CONTRACTS.xcnStaking.chainId,
            },
            {
                address: CONTRACTS.xcnToken.address,
                abi: CONTRACTS.xcnToken.abi,
                functionName: "balanceOf",
                args: [CONTRACTS.treasury.address],
                chainId: CONTRACTS.xcnToken.chainId,
            },
        ] as const,
    });

    return {
        contractData,
        isError,
        isLoading,
        refetch,
    };
};

export const useStakingCalculations = (
    contractData: ContractResult[] | undefined
) => {
    return React.useMemo(() => {
        if (
            !contractData ||
            contractData.some((result: ContractResult) => !result.result)
        ) {
            return {
                stakingAPR: "--",
                dailyEmission: "--",
                totalStaked: "--",
                totalStakedUSD: "--",
                totalTreasury: "--",
                totalTreasuryUSD: "--",
                raw: null,
            };
        }

        const [poolInfoResult, rewardPerBlockResult, treasuryBalanceResult] =
            contractData;

        if (
            !poolInfoResult.result ||
            !rewardPerBlockResult.result ||
            !treasuryBalanceResult.result
        ) {
            return {
                stakingAPR: "--",
                dailyEmission: "--",
                totalStaked: "--",
                totalStakedUSD: "--",
                totalTreasury: "--",
                totalTreasuryUSD: "--",
                raw: null,
            };
        }

        const poolInfoArray = poolInfoResult.result as readonly [
            string,
            bigint,
            bigint,
            bigint,
            bigint
        ];
        const poolInfo: PoolInfo = {
            stakToken: poolInfoArray[0],
            allocPoint: poolInfoArray[1],
            lastRewardBlock: poolInfoArray[2],
            accRewardPerShare: poolInfoArray[3],
            totalAmountStake: poolInfoArray[4],
        };

        const rewardPerBlock = rewardPerBlockResult.result as bigint;
        const treasuryBalance = treasuryBalanceResult.result as bigint;

        const aprPercentage = calculateStakingAPR(
            rewardPerBlock.toString(),
            poolInfo.totalAmountStake.toString(),
            STAKING_CONSTANTS.STAKING_APR_BLOCKS_PER_DAY,
            STAKING_CONSTANTS.DAYS_PER_YEAR
        );

        const dailyEmissionValue = calculateDailyEmission(
            rewardPerBlock.toString(),
            STAKING_CONSTANTS.BLOCKS_PER_DAY,
            STAKING_CONSTANTS.XCN_DECIMALS
        );

        const totalStakedTokens = convertWeiToTokens(
            poolInfo.totalAmountStake.toString(),
            STAKING_CONSTANTS.XCN_DECIMALS,
            2,
            true
        );

        const totalTreasuryTokens = convertWeiToTokens(
            treasuryBalance.toString(),
            STAKING_CONSTANTS.XCN_DECIMALS,
            2,
            true
        );

        return {
            stakingAPR: formatToReadablePercentage(aprPercentage),
            dailyEmission: formatLargeNumber(dailyEmissionValue),
            totalStaked: totalStakedTokens,
            totalStakedUSD: "--",
            totalTreasury: totalTreasuryTokens,
            totalTreasuryUSD: "--",
            raw: {
                poolInfo,
                rewardPerBlock,
                treasuryBalance,
                aprPercentage,
                dailyEmissionValue,
            },
        };
    }, [contractData]);
};

export const useStakingData = () => {
    const { contractData, isError, isLoading, refetch } = useStakingContracts();
    const processedData = useStakingCalculations(contractData);

    return {
        ...processedData,
        isLoading,
        isError,
        refetch,
    };
};

export const useStakingAPR = () => {
    const {
        data: poolInfo,
        isLoading: poolInfoLoading,
        error: poolInfoError,
    } = useReadContract({
        address: CONTRACTS.xcnStaking.address,
        abi: CONTRACTS.xcnStaking.abi,
        functionName: "poolInfo",
        args: [STAKING_CONSTANTS.XCN_POOL_ID],
        chainId: CONTRACTS.xcnStaking.chainId,
    });

    const {
        data: rewardPerBlock,
        isLoading: rewardLoading,
        error: rewardError,
    } = useReadContract({
        address: CONTRACTS.xcnStaking.address,
        abi: CONTRACTS.xcnStaking.abi,
        functionName: "rewardPerBlock",
        chainId: CONTRACTS.xcnStaking.chainId,
    });

    const apr = React.useMemo(() => {
        if (!poolInfo || !rewardPerBlock) {
            return null;
        }

        const poolInfoArray = poolInfo as readonly [
            string,
            bigint,
            bigint,
            bigint,
            bigint
        ];
        const poolInfoTyped: PoolInfo = {
            stakToken: poolInfoArray[0],
            allocPoint: poolInfoArray[1],
            lastRewardBlock: poolInfoArray[2],
            accRewardPerShare: poolInfoArray[3],
            totalAmountStake: poolInfoArray[4],
        };

        if (
            !poolInfoTyped ||
            typeof poolInfoTyped.totalAmountStake === "undefined"
        ) {
            return null;
        }

        return calculateStakingAPR(
            rewardPerBlock.toString(),
            poolInfoTyped.totalAmountStake.toString(),
            STAKING_CONSTANTS.BLOCKS_PER_DAY,
            STAKING_CONSTANTS.DAYS_PER_YEAR
        );
    }, [poolInfo, rewardPerBlock]);

    return {
        apr,
        formattedAPR: apr ? formatToReadablePercentage(apr) : "--",
        isLoading: poolInfoLoading || rewardLoading,
        error: poolInfoError || rewardError,
    };
};

export const useTreasuryBalance = () => {
    const {
        data: balance,
        isLoading,
        isError,
    } = useReadContract({
        ...CONTRACTS.xcnToken,
        functionName: "balanceOf",
        args: [CONTRACTS.treasury.address],
    });

    const formattedBalance = React.useMemo(() => {
        if (!balance) return "--";

        return convertWeiToTokens(
            balance.toString(),
            STAKING_CONSTANTS.XCN_DECIMALS,
            2,
            true
        );
    }, [balance]);

    return {
        balance,
        formattedBalance,
        isLoading,
        isError,
    };
};
