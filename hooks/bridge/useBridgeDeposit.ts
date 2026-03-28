"use client";

import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
} from "wagmi";
import { goliathConfig } from "@/config/goliath";
import { bridgeLockAbi } from "@/contracts/abis/goliath";
import type { Address } from "viem";

/**
 * Executes a Source -> Goliath deposit by calling the BridgeLock
 * contract on the source chain.
 *
 * - For native ETH: calls `depositNative(recipient)` with `msg.value`.
 * - For ERC-20 tokens: calls `deposit(token, amount, recipient)`.
 *
 * The connected wallet address is used as `recipient` unless an
 * explicit override is provided.
 */
export function useBridgeDeposit() {
    const { address } = useAccount();

    const {
        writeContractAsync,
        data: hash,
        isPending,
        error,
        reset,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } =
        useWaitForTransactionReceipt({ hash });

    const deposit = async (params: {
        /** ERC-20 token address, or `null` for native ETH. */
        tokenAddress: Address | null;
        /** Amount in atomic units (wei). */
        amount: bigint;
        /** Optional override -- defaults to the connected wallet. */
        recipient?: Address;
    }) => {
        const bridgeAddress = goliathConfig.bridge.sourceBridgeAddress;
        const recipient = params.recipient || address!;

        if (!params.tokenAddress) {
            // Native ETH deposit
            return await writeContractAsync({
                address: bridgeAddress,
                abi: bridgeLockAbi,
                functionName: "depositNative",
                args: [recipient],
                value: params.amount,
                chainId: goliathConfig.bridge.sourceChainId,
            });
        } else {
            // ERC-20 deposit
            return await writeContractAsync({
                address: bridgeAddress,
                abi: bridgeLockAbi,
                functionName: "deposit",
                args: [params.tokenAddress, params.amount, recipient],
                chainId: goliathConfig.bridge.sourceChainId,
            });
        }
    };

    return {
        deposit,
        isPending: isPending || isConfirming,
        isSuccess,
        txHash: hash,
        error,
        reset,
    };
}
