"use client";

import { useRef } from "react";
import { useWriteContract, useSignTypedData, useAccount } from "wagmi";
import { erc20Abi, maxUint256 } from "viem";
import { goliathConfig } from "@/config/goliath";
import { chnStakingAbi, bridgeLockAbi } from "@/contracts/abis/goliath";
import { migrationApiService } from "@/lib/api/services/migration";
import type {
    MigrationStep,
    StepExecution,
    StakingSnapshot,
    PendingMigration,
} from "./types";

type UpdateFn = (step: MigrationStep, update: Partial<StepExecution>) => void;
type LockFn = () => void;
type SaveFn = (migration: PendingMigration) => void;

async function bindWithRetry(
    intentId: string,
    sender: string,
    txHash: string,
    attempt = 0,
) {
    const maxRetries = 5;
    const baseDelay = 2000;
    try {
        await migrationApiService.bindOriginTxHash({
            intentId,
            senderAddress: sender,
            originTxHash: txHash,
        });
    } catch {
        if (attempt < maxRetries) {
            setTimeout(
                () => bindWithRetry(intentId, sender, txHash, attempt + 1),
                baseDelay * Math.pow(2, attempt),
            );
        }
    }
}

export function useMigrationTransactions(
    snapshot: StakingSnapshot,
    updateStep: UpdateFn,
    lockToggle: LockFn,
    savePending: SaveFn,
    stakeOnGoliath: boolean,
) {
    const { address } = useAccount();
    const executingRef = useRef(false);
    const { writeContractAsync } = useWriteContract();
    const { signTypedDataAsync } = useSignTypedData();

    const sourceChainId = goliathConfig.bridge.sourceChainId;
    const stakingAddress = goliathConfig.migration.sourceStakingAddress;
    const xcnAddress = goliathConfig.bridge.sourceTokens.XCN;
    const bridgeAddress = goliathConfig.bridge.sourceBridgeAddress;

    const executeWithLifecycle = async (
        step: MigrationStep,
        action: () => Promise<string>,
    ) => {
        if (executingRef.current) return;
        executingRef.current = true;

        try {
            updateStep(step, { status: "WAITING_SIGNATURE", error: null });
            const txHash = await action();
            updateStep(step, { status: "TX_PENDING", txHash });
            // The component layer can use useWaitForTransactionReceipt for
            // on-chain confirmation.  For this flow we optimistically mark
            // CONFIRMED once the hash is returned since wagmi's
            // writeContractAsync already waits for submission.
            updateStep(step, { status: "CONFIRMED" });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Transaction failed";
            // User rejection -- reset to IDLE without error
            if (
                message.includes("rejected") ||
                message.includes("denied") ||
                message.includes("4001")
            ) {
                updateStep(step, { status: "IDLE", error: null });
            } else {
                updateStep(step, { status: "FAILED", error: message });
            }
        } finally {
            executingRef.current = false;
        }
    };

    const executeClaim = () =>
        executeWithLifecycle("CLAIM_REWARDS", async () => {
            const hash = await writeContractAsync({
                address: stakingAddress,
                abi: chnStakingAbi,
                functionName: "withdraw",
                args: [0n, 0n],
                chainId: sourceChainId,
            });
            return hash;
        });

    const executeApprove = () =>
        executeWithLifecycle("APPROVE", async () => {
            const hash = await writeContractAsync({
                address: xcnAddress,
                abi: erc20Abi,
                functionName: "approve",
                args: [bridgeAddress, maxUint256],
                chainId: sourceChainId,
            });
            return hash;
        });

    const executeUnstake = () =>
        executeWithLifecycle("UNSTAKE", async () => {
            if (snapshot.staked === 0n)
                throw new Error("No staked amount");
            const hash = await writeContractAsync({
                address: stakingAddress,
                abi: chnStakingAbi,
                functionName: "withdraw",
                args: [0n, snapshot.staked],
                chainId: sourceChainId,
            });
            return hash;
        });

    const executeBridge = () =>
        executeWithLifecycle("BRIDGE", async () => {
            if (!address) throw new Error("Wallet not connected");

            lockToggle();

            // Generate idempotency key
            const idempotencyKey = crypto.randomUUID();
            const deadline =
                Math.floor(Date.now() / 1000) +
                goliathConfig.migration.deadline;
            const nonce = Date.now().toString();

            const bridgeAmount = snapshot.walletXcn;
            if (bridgeAmount === 0n) throw new Error("No XCN to bridge");

            // Build EIP-712 typed data for stake preference
            const domain = {
                name: "GoliathBridge",
                version: "1",
                chainId: BigInt(sourceChainId),
            } as const;

            const types = {
                StakePreference: [
                    { name: "senderAddress", type: "address" },
                    { name: "recipientAddress", type: "address" },
                    { name: "amountAtomic", type: "string" },
                    { name: "stakeOnGoliath", type: "bool" },
                    { name: "idempotencyKey", type: "string" },
                    { name: "deadline", type: "uint256" },
                    { name: "nonce", type: "string" },
                ],
            } as const;

            const message = {
                senderAddress: address,
                recipientAddress: address,
                amountAtomic: bridgeAmount.toString(),
                stakeOnGoliath,
                idempotencyKey,
                deadline: BigInt(deadline),
                nonce,
            };

            // Sign the typed data
            const signature = await signTypedDataAsync({
                domain,
                types,
                primaryType: "StakePreference",
                message,
            });

            // Submit stake preference to API
            const intentResult =
                await migrationApiService.submitStakePreference({
                    senderAddress: address,
                    recipientAddress: address,
                    amountAtomic: bridgeAmount.toString(),
                    stakeOnGoliath,
                    idempotencyKey,
                    deadline,
                    nonce,
                    signature,
                });

            // Bridge deposit
            const hash = await writeContractAsync({
                address: bridgeAddress,
                abi: bridgeLockAbi,
                functionName: "deposit",
                args: [xcnAddress, bridgeAmount, address],
                chainId: sourceChainId,
            });

            // Background bind with retries (fire-and-forget)
            bindWithRetry(intentResult.intentId, address, hash);

            // Save pending migration to localStorage
            savePending({
                originTxHash: hash,
                intentId: intentResult.intentId,
                stakeOnGoliath,
                timestamp: Date.now(),
            });

            return hash;
        });

    return { executeClaim, executeApprove, executeUnstake, executeBridge };
}
