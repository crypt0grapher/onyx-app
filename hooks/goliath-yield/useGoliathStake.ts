"use client";

import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { goliathConfig } from "@/config/goliath";
import { stakedXcnAbi } from "@/contracts/abis/goliath";

const ZERO = BigInt(0);
const STAKE_GAS = BigInt(150_000);

export function useGoliathStake() {
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

  const stake = (amountXcn: string): Promise<`0x${string}`> => {
    const value = parseEther(amountXcn);
    if (value === ZERO) throw new Error("Amount must be greater than 0");

    return writeContractAsync({
      address: goliathConfig.staking.stXcnAddress,
      abi: stakedXcnAbi,
      functionName: "stake",
      value,
      gas: STAKE_GAS,
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
    reset,
  };
}
