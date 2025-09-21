import { useMemo } from "react";
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContracts,
} from "wagmi";
import { CONTRACTS, STAKING_CONSTANTS } from "@/contracts/config";
import { convertWeiToTokens } from "@/utils/format";
import { Address, parseEther } from "viem";
import { useStakingData } from "./useStakingData";

export const useUserStakingInfo = () => {
    const { address } = useAccount();
    const { stakingAPR } = useStakingData();

    const {
        data: contractData,
        isLoading,
        isError,
        refetch,
    } = useReadContracts({
        contracts: [
            {
                address: CONTRACTS.xcnStaking.address,
                abi: CONTRACTS.xcnStaking.abi,
                functionName: "getStakingAmount",
                args: [
                    BigInt(STAKING_CONSTANTS.XCN_POOL_ID),
                    address ||
                        ("0x0000000000000000000000000000000000000000" as Address),
                ],
                chainId: CONTRACTS.xcnStaking.chainId,
            },
            {
                address: CONTRACTS.xcnStaking.address,
                abi: CONTRACTS.xcnStaking.abi,
                functionName: "pendingReward",
                args: [
                    BigInt(STAKING_CONSTANTS.XCN_POOL_ID),
                    address ||
                        ("0x0000000000000000000000000000000000000000" as Address),
                ],
                chainId: CONTRACTS.xcnStaking.chainId,
            },
            {
                address: CONTRACTS.xcnToken.address,
                abi: CONTRACTS.xcnToken.abi,
                functionName: "balanceOf",
                args: [
                    address ||
                        ("0x0000000000000000000000000000000000000000" as Address),
                ],
                chainId: CONTRACTS.xcnToken.chainId,
            },
            {
                address: CONTRACTS.xcnToken.address,
                abi: CONTRACTS.xcnToken.abi,
                functionName: "allowance",
                args: [
                    address ||
                        ("0x0000000000000000000000000000000000000000" as Address),
                    CONTRACTS.xcnStaking.address,
                ],
                chainId: CONTRACTS.xcnToken.chainId,
            },
        ] as const,
        query: {
            enabled: !!address,
        },
    });

    const processedData = useMemo(() => {
        if (!contractData || !address || isError) {
            return {
                userStaked: "0.00",
                userStakedRaw: BigInt(0),
                pendingRewards: "0.00",
                pendingRewardsRaw: BigInt(0),
                xcnBalance: "0.00",
                xcnBalanceRaw: BigInt(0),
                allowance: BigInt(0),
                hasAllowance: false,
                dailyEarnings: "0.00",
            };
        }

        const [
            stakedAmountResult,
            pendingRewardsResult,
            xcnBalanceResult,
            allowanceResult,
        ] = contractData;

        const userStakedRaw = stakedAmountResult.result
            ? (stakedAmountResult.result as bigint)
            : BigInt(0);
        const pendingRewardsRaw = pendingRewardsResult.result
            ? (pendingRewardsResult.result as bigint)
            : BigInt(0);
        const xcnBalanceRaw = xcnBalanceResult.result
            ? (xcnBalanceResult.result as bigint)
            : BigInt(0);
        const allowance = allowanceResult.result
            ? (allowanceResult.result as bigint)
            : BigInt(0);

        const userStaked = convertWeiToTokens(
            userStakedRaw.toString(),
            STAKING_CONSTANTS.XCN_DECIMALS,
            2,
            false
        );

        const pendingRewards = convertWeiToTokens(
            pendingRewardsRaw.toString(),
            STAKING_CONSTANTS.XCN_DECIMALS,
            6,
            false
        );

        const xcnBalance = convertWeiToTokens(
            xcnBalanceRaw.toString(),
            STAKING_CONSTANTS.XCN_DECIMALS,
            2,
            false
        );

        const stakingAPRValue = parseFloat(stakingAPR.replace("%", "")) || 0;
        const dailyRate = stakingAPRValue / 365 / 100;
        const dailyEarningsRaw =
            (userStakedRaw * BigInt(Math.floor(dailyRate * 10000))) /
            BigInt(10000);
        const dailyEarnings = convertWeiToTokens(
            dailyEarningsRaw.toString(),
            STAKING_CONSTANTS.XCN_DECIMALS,
            2,
            false
        );

        const hasAllowance = allowance >= parseEther("1000000");

        return {
            userStaked,
            userStakedRaw,
            pendingRewards,
            pendingRewardsRaw,
            xcnBalance,
            xcnBalanceRaw,
            allowance,
            hasAllowance,
            dailyEarnings,
        };
    }, [contractData, address, isError, stakingAPR]);

    return {
        ...processedData,
        isLoading,
        isError,
        refetch,
        isConnected: !!address,
    };
};

export const useApproveXcn = () => {
    const {
        writeContractAsync,
        data: hash,
        isPending,
        isError,
        error,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        }
    );

    const approve = (amount?: bigint): Promise<`0x${string}`> => {
        const approveAmount = amount || parseEther("1000000");

        return writeContractAsync({
            address: CONTRACTS.xcnToken.address,
            abi: CONTRACTS.xcnToken.abi,
            functionName: "approve",
            args: [CONTRACTS.xcnStaking.address, approveAmount],
        });
    };

    return {
        approve,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        isError,
        error,
    };
};

export const useStake = () => {
    const {
        writeContractAsync,
        data: hash,
        isPending,
        isError,
        error,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        }
    );

    const stake = (amount: bigint): Promise<`0x${string}`> => {
        if (amount <= BigInt(0))
            throw new Error("Amount must be greater than 0");

        return writeContractAsync({
            address: CONTRACTS.xcnStaking.address,
            abi: CONTRACTS.xcnStaking.abi,
            functionName: "stake",
            args: [BigInt(STAKING_CONSTANTS.XCN_POOL_ID), amount],
        });
    };

    return {
        stake,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        isError,
        error,
    };
};

export const useWithdraw = () => {
    const {
        writeContractAsync,
        data: hash,
        isPending,
        isError,
        error,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        }
    );

    const withdraw = (amount: bigint): Promise<`0x${string}`> => {
        if (amount <= BigInt(0))
            throw new Error("Amount must be greater than 0");

        return writeContractAsync({
            address: CONTRACTS.xcnStaking.address,
            abi: CONTRACTS.xcnStaking.abi,
            functionName: "withdraw",
            args: [BigInt(STAKING_CONSTANTS.XCN_POOL_ID), amount],
        });
    };

    return {
        withdraw,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        isError,
        error,
    };
};

export const useClaimRewards = () => {
    const {
        writeContractAsync,
        data: hash,
        isPending,
        isError,
        error,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        }
    );

    const claim = (): Promise<`0x${string}`> => {
        return writeContractAsync({
            address: CONTRACTS.xcnClaim.address,
            abi: CONTRACTS.xcnClaim.abi,
            functionName: "claimReward",
            args: [BigInt(STAKING_CONSTANTS.XCN_POOL_ID)],
        });
    };

    return {
        claim,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        isError,
        error,
    };
};

export const useCompleteStakingData = () => {
    const userStaking = useUserStakingInfo();

    return {
        ...userStaking,
        canStake: (amount: string): boolean => {
            if (!amount || parseFloat(amount) <= 0) return false;
            const amountWei = parseEther(amount);
            return userStaking.xcnBalanceRaw >= amountWei;
        },
        canWithdraw: (amount: string): boolean => {
            if (!amount || parseFloat(amount) <= 0) return false;
            const amountWei = parseEther(amount);
            return userStaking.userStakedRaw >= amountWei;
        },
        needsApproval: (amount: string): boolean => {
            if (!amount || parseFloat(amount) <= 0) return false;
            const amountWei = parseEther(amount);
            return userStaking.allowance < amountWei;
        },
    };
};
