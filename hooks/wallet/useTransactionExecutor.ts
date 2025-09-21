"use client";

import { waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "@/config/wagmi";
import { useTranslations } from "next-intl";
import useToast from "@/hooks/ui/useToast";

export interface ExecuteTransactionResult {
    hash: `0x${string}`;
}

export interface ExecuteTransactionParams {
    action: () => Promise<`0x${string}`>;
    successText: string;
    successSubtext?: string;
    errorText?: string;
    onSuccess?: () => void;
}

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

const isInsufficientGas = (error: unknown): boolean => {
    if (!error) return false;
    const message = (error as Error).message?.toLowerCase?.() || "";
    return (
        message.includes("safeerc20: low-level call failed") ||
        message.includes("insufficient funds") ||
        message.includes("insufficient gas") ||
        message.includes("gas required exceeds allowance") ||
        message.includes("insufficient balance for transfer") ||
        message.includes("out of gas") ||
        message.includes("gas limit exceeded")
    );
};

export const useTransactionExecutor = () => {
    const t = useTranslations("toast.transaction");
    const { showSuccessToast, showDangerToast } = useToast();

    const executeTransaction = async ({
        action,
        successText,
        successSubtext,
        errorText,
        onSuccess,
    }: ExecuteTransactionParams): Promise<ExecuteTransactionResult | null> => {
        try {
            const hash = await action();

            const receipt = await waitForTransactionReceipt(wagmiConfig, {
                hash,
            });

            if (receipt.status === "success") {
                showSuccessToast(successText, successSubtext);
                if (onSuccess) onSuccess();
                return { hash };
            }

            showDangerToast(errorText || t("failed"));
            return null;
        } catch (error) {
            if (isUserRejected(error)) {
                showDangerToast(t("rejected"), t("rejectedSubtext"));
                return null;
            }

            if (isInsufficientGas(error)) {
                showDangerToast(
                    t("insufficientGas"),
                    t("insufficientGasSubtext")
                );
                return null;
            }

            showDangerToast(
                errorText || t("defaultError"),
                errorText ? t("defaultErrorSubtext") : undefined
            );
            return null;
        }
    };

    return { executeTransaction };
};

export default useTransactionExecutor;
