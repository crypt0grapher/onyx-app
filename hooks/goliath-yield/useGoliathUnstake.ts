"use client";

import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { goliathConfig } from "@/config/goliath";
import { stakedXcnAbi } from "@/contracts/abis/goliath";

const ZERO = BigInt(0);
const UNSTAKE_GAS = BigInt(200_000);

export function useGoliathUnstake() {
  const {
    writeContractAsync,
    data: hash,
    isPending,
    isError,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const unstake = (amountStXcn: string): Promise<`0x${string}`> => {
    const amount = parseEther(amountStXcn);
    if (amount === ZERO) throw new Error("Amount must be greater than 0");

    return writeContractAsync({
      address: goliathConfig.staking.stXcnAddress,
      abi: stakedXcnAbi,
      functionName: "unstake",
      args: [amount],
      gas: UNSTAKE_GAS,
    });
  };

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}
