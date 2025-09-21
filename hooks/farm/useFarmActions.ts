"use client";

import { useWriteContract } from "wagmi";
import { Address, parseUnits } from "viem";
import { CONTRACTS } from "@/contracts/config";
import erc20Abi from "@/contracts/abis/erc20.json";
import masterChefAbi from "@/contracts/abis/masterChef.json";
import { useTransactionExecutor } from "@/hooks/wallet/useTransactionExecutor";
import FARMS from "@/config/farms";

export const useFarmActions = (pid: number) => {
    const farm = FARMS.find((f) => f.pid === pid)!;
    const { writeContractAsync } = useWriteContract();
    const { executeTransaction } = useTransactionExecutor();

    const approve = async (amount: string, decimals: number) => {
        const amountWei = parseUnits(amount as `${number}`, decimals);
        return executeTransaction({
            action: () =>
                writeContractAsync({
                    address: farm.lpAddress as Address,
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [CONTRACTS.masterChef.address, amountWei],
                }),
            successText: "Approval successful",
        });
    };

    const approveMax = async () => {
        const max = (BigInt(1) << BigInt(255)) - BigInt(1);
        return executeTransaction({
            action: () =>
                writeContractAsync({
                    address: farm.lpAddress as Address,
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [CONTRACTS.masterChef.address, max],
                }),
            successText: "Approval successful",
        });
    };

    const stake = async (amount: string, decimals: number) => {
        const amountWei = parseUnits(amount as `${number}`, decimals);
        return executeTransaction({
            action: () =>
                writeContractAsync({
                    address: CONTRACTS.masterChef.address as Address,
                    abi: masterChefAbi,
                    functionName: "deposit",
                    args: [BigInt(pid), amountWei],
                }),
            successText: "Stake submitted",
        });
    };

    const withdraw = async (amount: string, decimals: number) => {
        const amountWei = parseUnits(amount as `${number}`, decimals);
        return executeTransaction({
            action: () =>
                writeContractAsync({
                    address: CONTRACTS.masterChef.address as Address,
                    abi: masterChefAbi,
                    functionName: "withdraw",
                    args: [BigInt(pid), amountWei],
                }),
            successText: "Withdraw submitted",
        });
    };

    const claim = async () => {
        return executeTransaction({
            action: () =>
                writeContractAsync({
                    address: CONTRACTS.masterChef.address as Address,
                    abi: masterChefAbi,
                    functionName: "deposit",
                    args: [BigInt(pid), BigInt(0)],
                }),
            successText: "Claim submitted",
        });
    };

    return { approve, approveMax, stake, withdraw, claim };
};

export default useFarmActions;
