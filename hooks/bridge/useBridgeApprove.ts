"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi, maxUint256, type Address } from "viem";

/**
 * Sends an ERC-20 `approve` transaction granting the bridge contract
 * (`spenderAddress`) the maximum allowance for `tokenAddress`.
 *
 * When `tokenAddress` is `null` (native token), calling `approve` is a
 * no-op.
 */
export function useBridgeApprove(
    tokenAddress: Address | null,
    spenderAddress: Address,
    chainId: number,
) {
    const {
        writeContractAsync,
        data: hash,
        isPending,
        error,
        reset,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } =
        useWaitForTransactionReceipt({ hash });

    const approve = async () => {
        if (!tokenAddress) return;

        await writeContractAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [spenderAddress, maxUint256],
            chainId,
        });
    };

    return {
        approve,
        isPending: isPending || isConfirming,
        isSuccess,
        error,
        reset,
    };
}
