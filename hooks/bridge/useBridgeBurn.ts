"use client";

import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
} from "wagmi";
import { goliathConfig } from "@/config/goliath";
import { bridgeGoliathAbi } from "@/contracts/abis/goliath";
import { getGoliathNetwork } from "@/config/networks";
import type { Address } from "viem";

/**
 * Executes a Goliath -> Source withdrawal for ERC-20 tokens by calling
 * `burn(token, amount, destinationAddress)` on the Goliath bridge
 * contract.
 *
 * This hook is NOT used for native XCN -- use `useBridgeXcnWithdraw`
 * for the multi-phase XCN withdrawal flow instead.
 */
export function useBridgeBurn() {
    const { address } = useAccount();
    const goliathChainId = getGoliathNetwork().chainId;

    const {
        writeContractAsync,
        data: hash,
        isPending,
        error,
        reset,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } =
        useWaitForTransactionReceipt({ hash });

    const burn = async (params: {
        /** ERC-20 token address on the Goliath chain. */
        tokenAddress: Address;
        /** Amount in atomic units (wei). */
        amount: bigint;
        /** Optional override -- defaults to the connected wallet. */
        recipient?: Address;
    }) => {
        const bridgeAddress = goliathConfig.bridge.goliathBridgeAddress;
        const recipient = params.recipient || address!;

        return await writeContractAsync({
            address: bridgeAddress,
            abi: bridgeGoliathAbi,
            functionName: "burn",
            args: [params.tokenAddress, params.amount, recipient],
            chainId: goliathChainId,
        });
    };

    return {
        burn,
        isPending: isPending || isConfirming,
        isSuccess,
        txHash: hash,
        error,
        reset,
    };
}
