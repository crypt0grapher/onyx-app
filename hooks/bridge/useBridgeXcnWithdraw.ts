"use client";

import { useState, useCallback } from "react";
import {
    useSignTypedData,
    useSendTransaction,
    useWaitForTransactionReceipt,
    useAccount,
} from "wagmi";
import { type Address } from "viem";
import { getGoliathNetwork } from "@/config/networks";
import { bridgeApiService } from "@/lib/api/services/bridge";

/**
 * Multi-phase XCN withdrawal flow for moving native XCN from the
 * Goliath chain back to the source chain.
 *
 * Steps:
 *  1. Check capability (is the relayer ready?)
 *  2. Build EIP-712 typed data and request a wallet signature
 *  3. Register the intent with the bridge API
 *  4. Send native XCN to the relayer wallet
 *  5. Bind the origin tx hash to the intent (fire-and-forget with retries)
 */
export function useBridgeXcnWithdraw() {
    const { address } = useAccount();
    const goliathChainId = getGoliathNetwork().chainId;

    const [intentId, setIntentId] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { signTypedDataAsync } = useSignTypedData();
    const { sendTransactionAsync, data: hash } = useSendTransaction();
    const { isLoading: isConfirming, isSuccess } =
        useWaitForTransactionReceipt({ hash });

    /**
     * Exponential-backoff retry for the `bindXcnWithdrawOrigin` call.
     * This runs in the background after the on-chain tx is submitted so
     * the user is not blocked.
     */
    const bindWithRetry = useCallback(
        async (
            id: string,
            sender: string,
            txHash: string,
            attempt = 0,
        ) => {
            const maxRetries = 5;
            const baseDelay = 2000;

            try {
                await bridgeApiService.bindXcnWithdrawOrigin({
                    intentId: id,
                    senderAddress: sender,
                    originTxHash: txHash,
                });
            } catch {
                if (attempt < maxRetries) {
                    setTimeout(
                        () =>
                            bindWithRetry(id, sender, txHash, attempt + 1),
                        baseDelay * Math.pow(2, attempt),
                    );
                }
            }
        },
        [],
    );

    const withdraw = async (params: {
        /** Amount of native XCN in atomic units (wei). */
        amount: bigint;
        /** Optional override -- defaults to the connected wallet. */
        recipient?: Address;
    }) => {
        if (!address) throw new Error("Wallet not connected");

        setIsPending(true);
        setError(null);

        try {
            // 1. Check capability
            const capable =
                await bridgeApiService.checkXcnWithdrawCapability();
            if (!capable) {
                throw new Error("XCN withdraw not available");
            }

            // 2. Build EIP-712 typed data
            const recipient = params.recipient || address;
            const amountAtomic = params.amount.toString();
            const idempotencyKey = crypto.randomUUID();
            const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 min
            const nonce = Date.now().toString();

            const domain = {
                name: "GoliathBridge",
                version: "1",
                chainId: BigInt(goliathChainId),
            } as const;

            const types = {
                XcnWithdrawIntent: [
                    { name: "senderAddress", type: "address" },
                    { name: "recipientAddress", type: "address" },
                    { name: "amountAtomic", type: "string" },
                    { name: "idempotencyKey", type: "string" },
                    { name: "deadline", type: "uint256" },
                    { name: "nonce", type: "string" },
                ],
            } as const;

            const message = {
                senderAddress: address,
                recipientAddress: recipient,
                amountAtomic,
                idempotencyKey,
                deadline: BigInt(deadline),
                nonce,
            };

            // 3. Sign
            const signature = await signTypedDataAsync({
                domain,
                types,
                primaryType: "XcnWithdrawIntent",
                message,
            });

            // 4. Register intent
            const intentResult =
                await bridgeApiService.registerXcnWithdrawIntent({
                    senderAddress: address,
                    recipientAddress: recipient,
                    amountAtomic,
                    idempotencyKey,
                    deadline,
                    nonce,
                    signature,
                });
            setIntentId(intentResult.intentId);

            // 5. Send native XCN to relayer
            const relayerAddress =
                intentResult.relayerWalletAddress as Address;
            const txHash = await sendTransactionAsync({
                to: relayerAddress,
                value: params.amount,
                chainId: goliathChainId,
            });

            // 6. Background bind (fire and forget with retries)
            bindWithRetry(intentResult.intentId, address, txHash);
        } catch (err) {
            const resolvedError =
                err instanceof Error ? err : new Error("Unknown error");
            setError(resolvedError);
            setIsPending(false);
            throw resolvedError;
        }
    };

    const reset = useCallback(() => {
        setError(null);
        setIsPending(false);
        setIntentId(null);
    }, []);

    return {
        withdraw,
        isPending: isPending || isConfirming,
        isSuccess,
        txHash: hash,
        intentId,
        error,
        reset,
    };
}
