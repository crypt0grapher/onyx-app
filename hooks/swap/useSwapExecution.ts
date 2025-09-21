"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import useSwapAllowances from "@/hooks/swap/useSwapAllowances";
import useExecuteSwap from "@/hooks/swap/useExecuteSwap";
import useTransactionExecutor from "@/hooks/wallet/useTransactionExecutor";
import { useTranslations } from "next-intl";
import useToast from "@/hooks/ui/useToast";

/**
 * Handles approvals and executing swaps using the shared transaction executor.
 */
export const useSwapExecution = (params: {
    fromAddress?: `0x${string}`;
    path: `0x${string}`[];
    amountInWei: bigint;
    minimumOutWei: bigint;
    amountOutWei?: bigint;
    maximumInWei?: bigint;
    activeInput?: "from" | "to";
    deadlineSec: number;
    to?: `0x${string}`;
    isEthIn?: boolean;
    refetchBalances: () => Promise<void>;
}) => {
    const { address: accountAddress } = useAccount();
    const { allowance, approveAsync, refetchAllowance } = useSwapAllowances(
        params.fromAddress
    );
    const { execExactInHash, execExactOutHash } = useExecuteSwap();
    const { executeTransaction } = useTransactionExecutor();
    const tt = useTranslations("toast");
    const { showDangerToast, showSuccessToast } = useToast();

    const [isApprovePending, setIsApprovePending] = useState(false);
    const [isSwapPending, setIsSwapPending] = useState(false);

    const isUserRejected = (error: unknown): boolean => {
        if (!error) return false;
        const message = (error as Error).message?.toLowerCase?.() || "";
        const name = (error as Error).name?.toLowerCase?.() || "";
        return (
            name.includes("userrejected") ||
            message.includes("user rejected") ||
            message.includes("user denied") ||
            message.includes("denied transaction") ||
            message.includes("request rejected")
        );
    };

    const needApproval = useMemo(() => {
        if (!params.fromAddress) return false;
        const current = (allowance.data as unknown as bigint) ?? BigInt(0);
        const isExactOut = params.activeInput === "to";
        const required = isExactOut
            ? params.maximumInWei ?? BigInt(0)
            : params.amountInWei;

        return required > BigInt(0) && current === BigInt(0);
    }, [
        allowance.data,
        params.amountInWei,
        params.maximumInWei,
        params.fromAddress,
        params.activeInput,
    ]);

    const executeSwap = async ({
        successText,
        successSubtext,
        errorText,
    }: {
        successText: string;
        successSubtext: string;
        errorText: string;
    }) => {
        if (!accountAddress) return;
        const isExactOut = params.activeInput === "to";
        if (!isExactOut) {
            if (
                params.amountInWei === BigInt(0) ||
                params.minimumOutWei === BigInt(0)
            )
                return;
        } else {
            if (
                !params.amountOutWei ||
                !params.maximumInWei ||
                params.amountOutWei === BigInt(0) ||
                params.maximumInWei === BigInt(0)
            )
                return;
        }

        if (needApproval) {
            try {
                setIsApprovePending(true);
                const hash = await approveAsync?.();
                if (hash) {
                    const { wagmiConfig } = await import("@/config/wagmi");
                    const { waitForTransactionReceipt } = await import(
                        "wagmi/actions"
                    );
                    await waitForTransactionReceipt(wagmiConfig, { hash });
                    refetchAllowance();
                    showSuccessToast(tt("swapTransaction.approvalSuccess"));
                }
            } catch (error) {
                if (isUserRejected(error)) {
                    showDangerToast(
                        tt("swapTransaction.rejected"),
                        tt("swapTransaction.rejectedSubtext")
                    );
                    return;
                }
                showDangerToast(tt("swapTransaction.failed"));
                return;
            } finally {
                setIsApprovePending(false);
            }
            return;
        }

        if (!isExactOut) {
            setIsSwapPending(true);
            try {
                const valueWei = params.isEthIn
                    ? params.amountInWei
                    : params.fromAddress
                    ? undefined
                    : params.amountInWei;
                const result = await executeTransaction({
                    action: () =>
                        execExactInHash({
                            path: params.path,
                            deadlineSec: params.deadlineSec,
                            amountInWei: params.amountInWei,
                            minimumAmountOutWei: params.minimumOutWei,
                            valueWei,
                            to: (params.to || accountAddress) as `0x${string}`,
                        }),
                    successText,
                    successSubtext,
                    errorText,
                });

                if (result) {
                    await params.refetchBalances();
                }
            } finally {
                setIsSwapPending(false);
            }
        } else {
            setIsSwapPending(true);
            try {
                const valueWei = params.isEthIn
                    ? params.maximumInWei
                    : params.fromAddress
                    ? undefined
                    : params.maximumInWei;
                const result = await executeTransaction({
                    action: () =>
                        execExactOutHash({
                            path: params.path,
                            deadlineSec: params.deadlineSec,
                            amountOutWei: params.amountOutWei!,
                            maximumAmountInWei: params.maximumInWei!,
                            valueWei,
                            to: (params.to || accountAddress) as `0x${string}`,
                        }),
                    successText,
                    successSubtext,
                    errorText,
                });

                if (result) {
                    await params.refetchBalances();
                }
            } finally {
                setIsSwapPending(false);
            }
        }
    };

    return {
        needApproval,
        executeSwap,
        isApprovePending,
        isSwapPending,
    } as const;
};

export default useSwapExecution;
