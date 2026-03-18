"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useAccount, useBalance } from "wagmi";
import { formatEther, parseEther } from "viem";
import {
    useGoliathYieldData,
    useGoliathStake,
    useGoliathUnstake,
} from "@/hooks/goliath-yield";
import { useTransactionExecutor } from "@/hooks/wallet/useTransactionExecutor";
import useToast from "@/hooks/ui/useToast";
import InteractivePanel from "@/components/ui/shared/InteractivePanel";
import LoadingDots from "@/components/ui/common/LoadingDots";
import { type ImageLikeSrc } from "@/utils/image";

import stakeIcon from "@/assets/icons/stake.svg";
import withdrawIcon from "@/assets/icons/withdraw.svg";

const GoliathYieldPanel: React.FC = () => {
    const t = useTranslations("goliathYield");
    const tt = useTranslations("toast");
    const { address, isConnected } = useAccount();
    const { protocolData, userData, apr, isLoading } = useGoliathYieldData();
    const {
        stake,
        isPending: isStakePending,
        isConfirming: isStakeConfirming,
    } = useGoliathStake();
    const {
        unstake,
        isPending: isUnstakePending,
        isConfirming: isUnstakeConfirming,
    } = useGoliathUnstake();

    const [activeMode, setActiveMode] = useState("stake");
    const [amount, setAmount] = useState("");

    const { showToast } = useToast();
    const { executeTransaction } = useTransactionExecutor();

    // Get native XCN balance for staking
    const { data: xcnBalance } = useBalance({ address });

    // Compute available balance based on active mode
    const availableBalance = (() => {
        if (activeMode === "stake") {
            if (!xcnBalance) return 0;
            return parseFloat(formatEther(xcnBalance.value));
        }
        if (!userData) return 0;
        return parseFloat(formatEther(userData.stXcnBalance));
    })();

    const calculateEstimatedEarnings = (inputAmount: string): string => {
        if (!inputAmount || parseFloat(inputAmount) <= 0 || !apr) {
            return "0.00";
        }
        try {
            const amountVal = parseFloat(inputAmount);
            const dailyRate = apr / 365 / 100;
            const dailyEarning = amountVal * dailyRate;
            return dailyEarning.toFixed(2);
        } catch {
            return "0.00";
        }
    };

    const handleAction = async () => {
        if (!isConnected) {
            showToast({
                variant: "danger",
                text: tt("wallet.needsConnection"),
                subtext: tt("wallet.needsConnectionSubtext"),
            });
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            showToast({
                variant: "danger",
                text: tt("transaction.defaultError"),
                subtext: tt("transaction.defaultErrorSubtext"),
            });
            return;
        }

        if (protocolData?.isPaused) {
            showToast({
                variant: "danger",
                text: t("paused"),
            });
            return;
        }

        try {
            if (activeMode === "stake") {
                // Check balance
                const amountWei = parseEther(amount);
                if (!xcnBalance || amountWei > xcnBalance.value) {
                    showToast({
                        variant: "danger",
                        text: t("insufficientBalance"),
                        subtext: t("insufficientBalanceSubtext"),
                    });
                    return;
                }

                await executeTransaction({
                    action: () => stake(amount),
                    successText: t("stakeSuccess", { amount }),
                    errorText: t("stakeFailed"),
                    onSuccess: () => {
                        setAmount("");
                    },
                });
            } else {
                // Check stXCN balance
                const amountWei = parseEther(amount);
                if (!userData || amountWei > userData.stXcnBalance) {
                    showToast({
                        variant: "danger",
                        text: t("insufficientStXcnBalance"),
                        subtext: t("insufficientStXcnBalanceSubtext"),
                    });
                    return;
                }

                await executeTransaction({
                    action: () => unstake(amount),
                    successText: t("unstakeSuccess", { amount }),
                    errorText: t("unstakeFailed"),
                    onSuccess: () => {
                        setAmount("");
                    },
                });
            }
        } catch (error) {
            console.error("Goliath yield action failed:", error);
        }
    };

    const switcherItems: [
        { id: string; label: string; icon: ImageLikeSrc },
        { id: string; label: string; icon: ImageLikeSrc },
    ] = [
        {
            id: "stake",
            label: t("stake"),
            icon: stakeIcon,
        },
        {
            id: "unstake",
            label: t("unstake"),
            icon: withdrawIcon,
        },
    ];

    const isTransactionPending =
        isStakePending ||
        isUnstakePending ||
        isStakeConfirming ||
        isUnstakeConfirming;

    const getButtonLabel = (): string => {
        if (!isConnected) return t("connectWallet");
        if (isLoading) return t("loading");
        if (protocolData?.isPaused) return t("paused");

        if (activeMode === "stake") {
            if (isStakePending || isStakeConfirming) return t("staking");
            return t("stakeXCN");
        } else {
            if (isUnstakePending || isUnstakeConfirming) return t("unstaking");
            return t("unstakeStXCN");
        }
    };

    const isButtonDisabled =
        !isConnected ||
        isLoading ||
        !amount ||
        parseFloat(amount) <= 0 ||
        isTransactionPending ||
        (protocolData?.isPaused ?? false);

    const infoRows = [
        {
            label: t("estimatedDailyEarnings"),
            value: isLoading ? (
                <LoadingDots size="sm" variant="inline" />
            ) : (
                `${calculateEstimatedEarnings(amount)} XCN`
            ),
        },
        {
            label: `${t("apr")}:`,
            value: isLoading ? (
                <LoadingDots size="sm" variant="inline" />
            ) : (
                `${apr.toFixed(2)}%`
            ),
        },
        {
            label: `${t("fee")}:`,
            value: isLoading ? (
                <LoadingDots size="sm" variant="inline" />
            ) : (
                `${((protocolData?.feePercentBps ?? 0) / 100).toFixed(2)}%`
            ),
        },
    ];

    const balanceLabel =
        activeMode === "stake" ? t("xcnBalance") : t("balance");

    return (
        <InteractivePanel
            title={t("amount")}
            availableBalanceLabel={`${balanceLabel}: `}
            availableBalanceValue={`${availableBalance.toFixed(2)} ${activeMode === "stake" ? "XCN" : "stXCN"}`}
            switcherItems={switcherItems}
            activeMode={activeMode}
            onSwitch={setActiveMode}
            amount={amount}
            onAmountChange={setAmount}
            maxBalance={availableBalance}
            infoRows={infoRows}
            buttonLabel={getButtonLabel()}
            onAction={handleAction}
            isButtonDisabled={isButtonDisabled}
            actionIcon={activeMode === "stake" ? stakeIcon : withdrawIcon}
            isConnected={isConnected}
            isLoading={isLoading}
        />
    );
};

export default GoliathYieldPanel;
