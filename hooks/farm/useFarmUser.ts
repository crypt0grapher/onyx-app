"use client";

import { useAccount, useReadContracts } from "wagmi";
import { Address, parseUnits } from "viem";
import FARMS from "@/config/farms";
import erc20Abi from "@/contracts/abis/erc20.json";
import masterChefAbi from "@/contracts/abis/masterChef.json";
import { CONTRACTS } from "@/contracts/config";
import { formatTokenBalance } from "@/utils/format";

export type FarmUserData = {
    isConnected: boolean;
    lpDecimals: number;
    walletLpWei: bigint;
    stakedWei: bigint;
    allowanceWei: bigint;
    pendingRewardsWei: bigint;
    availableBalanceDisplay: string;
    canStake: (amount: string) => boolean;
    canWithdraw: (amount: string) => boolean;
    needsApproval: (amount: string) => boolean;
    refetch: () => void;
    isLoading: boolean;
};

export const useFarmUser = (pid: number): FarmUserData => {
    const { address } = useAccount();
    const farm = FARMS.find((f) => f.pid === pid)!;
    const mc = CONTRACTS.masterChef.address;
    const lp = farm.lpAddress as Address;

    const { data, isLoading, refetch } = useReadContracts({
        contracts: [
            {
                address: lp,
                abi: erc20Abi,
                functionName: "decimals",
                args: [],
                chainId: CONTRACTS.masterChef.chainId,
            },
            {
                address: lp,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [
                    (address ||
                        ("0x0000000000000000000000000000000000000000" as Address)) as Address,
                ],
                chainId: CONTRACTS.masterChef.chainId,
            },
            {
                address: lp,
                abi: erc20Abi,
                functionName: "allowance",
                args: [
                    (address ||
                        ("0x0000000000000000000000000000000000000000" as Address)) as Address,
                    mc,
                ],
                chainId: CONTRACTS.masterChef.chainId,
            },
            {
                address: mc,
                abi: masterChefAbi,
                functionName: "userInfo",
                args: [
                    BigInt(pid),
                    (address ||
                        ("0x0000000000000000000000000000000000000000" as Address)) as Address,
                ],
                chainId: CONTRACTS.masterChef.chainId,
            },
            {
                address: mc,
                abi: masterChefAbi,
                functionName: "pendingXcn",
                args: [
                    BigInt(pid),
                    (address ||
                        ("0x0000000000000000000000000000000000000000" as Address)) as Address,
                ],
                chainId: CONTRACTS.masterChef.chainId,
            },
        ],
        query: { enabled: !!address },
    });

    const [decimalsRes, walletBalRes, allowanceRes, userInfoRes, pendingRes] =
        (data || []) as Array<{ result?: unknown }>;

    const lpDecimals: number = (decimalsRes?.result as number) ?? 18;
    const walletLpWei: bigint = (walletBalRes?.result as bigint) ?? BigInt(0);
    const allowanceWei: bigint = (allowanceRes?.result as bigint) ?? BigInt(0);
    let stakedWei: bigint = BigInt(0);
    if (userInfoRes?.result) {
        const result = userInfoRes.result;
        if (Array.isArray(result)) {
            stakedWei = (result[0] as bigint) ?? BigInt(0);
        } else if (typeof result === "object" && "amount" in result) {
            stakedWei = (result.amount as bigint) ?? BigInt(0);
        }
    }
    const pendingRewardsWei: bigint =
        (pendingRes?.result as bigint) ?? BigInt(0);

    const availableBalanceDisplay = formatTokenBalance(
        walletLpWei,
        lpDecimals,
        2
    );

    const canStake = (amount: string) => {
        if (!amount || parseFloat(amount) <= 0 || !address) return false;
        const amountWei = parseUnits(amount as `${number}`, lpDecimals);
        return walletLpWei >= amountWei;
    };

    const canWithdraw = (amount: string) => {
        if (!amount || parseFloat(amount) <= 0 || !address) return false;
        const amountWei = parseUnits(amount as `${number}`, lpDecimals);
        return stakedWei >= amountWei;
    };

    const needsApproval = (amount: string) => {
        if (!amount || parseFloat(amount) <= 0 || !address) return false;
        const amountWei = parseUnits(amount as `${number}`, lpDecimals);
        return allowanceWei < amountWei;
    };

    return {
        isConnected: !!address,
        lpDecimals,
        walletLpWei,
        stakedWei,
        allowanceWei,
        pendingRewardsWei,
        availableBalanceDisplay,
        canStake,
        canWithdraw,
        needsApproval,
        refetch,
        isLoading,
    };
};

export default useFarmUser;
