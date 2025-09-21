"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { parseEther } from "viem";
import {
    useCompleteStakingData,
    useStake,
    useWithdraw,
    useApproveXcn,
    useStakingData,
} from "@/hooks";
import useToast from "@/hooks/ui/useToast";
import useNetworkCheck from "@/hooks/common/useNetworkCheck";
import { useTransactionExecutor } from "@/hooks/wallet/useTransactionExecutor";
import LoadingDots from "@/components/ui/common/LoadingDots";
import InteractivePanel from "@/components/ui/shared/InteractivePanel";
import { type ImageLikeSrc } from "@/utils/image";
import { useRevalidation } from "@/hooks/common/useRevalidation";

import stakeIcon from "@/assets/icons/stake.svg";
import withdrawIcon from "@/assets/icons/withdraw.svg";

const StakeActionPanel: React.FC = () => {
    const t = useTranslations("staking.stakeComponent");
    const tt = useTranslations("toast");
    const [activeMode, setActiveMode] = useState("stake");
    const [amount, setAmount] = useState("");

    const { isOnEthereum } = useNetworkCheck();
    const {
        xcnBalance,
        userStaked,
        isConnected,
        canStake,
        canWithdraw,
        needsApproval,
        isLoading,
        refetch,
    } = useCompleteStakingData();

    const { stakingAPR } = useStakingData();
    const {
        stake,
        isPending: isStakePending,
        isConfirming: isStakeConfirming,
    } = useStake();

    const {
        withdraw,
        isPending: isWithdrawPending,
        isConfirming: isWithdrawConfirming,
    } = useWithdraw();

    const {
        approve,
        isPending: isApprovePending,
        isConfirming: isApproveConfirming,
    } = useApproveXcn();

    const { showToast } = useToast();
    const { executeTransaction } = useTransactionExecutor();
    const { afterStakingTransaction } = useRevalidation();

    const availableBalance =
        activeMode === "stake"
            ? parseFloat(xcnBalance)
            : parseFloat(userStaked);

    const calculateEstimatedEarnings = (inputAmount: string): string => {
        if (!inputAmount || parseFloat(inputAmount) <= 0 || !stakingAPR) {
            return "0.00";
        }
        try {
            const amount = parseFloat(inputAmount);
            const aprPercentage = parseFloat(stakingAPR.replace("%", ""));
            const dailyRate = aprPercentage / 365 / 100;
            const dailyEarning = amount * dailyRate;
            return dailyEarning.toFixed(2);
        } catch {
            return "0.00";
        }
    };

    const handleAction = async () => {
        if (!isConnected) {
            showToast({
                variant: "danger",
                text: t("walletNotConnected"),
                subtext: t("walletNotConnectedSubtext"),
            });
            return;
        }

        if (!isOnEthereum) {
            showToast({
                variant: "danger",
                text: tt("network.wrongNetwork"),
                subtext: tt("network.wrongNetworkStakingSubtext"),
            });
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            showToast({
                variant: "danger",
                text: t("invalidAmount"),
                subtext: t("invalidAmountSubtext"),
            });
            return;
        }

        try {
            const amountWei = parseEther(amount);

            if (activeMode === "stake") {
                if (needsApproval(amount)) {
                    await executeTransaction({
                        action: () =>
                            approve().then(
                                (r) => r as unknown as `0x${string}`
                            ),
                        successText: t("approvalSuccess"),
                        errorText: t("approvalFailed"),
                        onSuccess: () => {
                            refetch();
                        },
                    });
                    return;
                }

                if (!canStake(amount)) {
                    showToast({
                        variant: "danger",
                        text: t("insufficientBalance"),
                        subtext: t("insufficientBalanceSubtext"),
                    });
                    return;
                }

                await executeTransaction({
                    action: () =>
                        stake(amountWei).then(
                            (r) => r as unknown as `0x${string}`
                        ),
                    successText: t("stakingSuccess", { amount }),
                    errorText: t("stakingFailed"),
                    onSuccess: () => {
                        setAmount("");
                        refetch();
                        afterStakingTransaction({ withPolling: true });
                    },
                });
            } else {
                if (!canWithdraw(amount)) {
                    showToast({
                        variant: "danger",
                        text: t("insufficientStakedAmount"),
                        subtext: t("insufficientStakedAmountSubtext"),
                    });
                    return;
                }

                await executeTransaction({
                    action: () =>
                        withdraw(amountWei).then(
                            (r) => r as unknown as `0x${string}`
                        ),
                    successText: t("withdrawSuccess", { amount }),
                    errorText: t("withdrawFailed"),
                    onSuccess: () => {
                        setAmount("");
                        refetch();
                        afterStakingTransaction({ withPolling: true });
                    },
                });
            }
        } catch (error) {
            console.error("Action failed:", error);
        }
    };

    const switcherItems: [
        { id: string; label: string; icon: ImageLikeSrc },
        { id: string; label: string; icon: ImageLikeSrc }
    ] = [
        {
            id: "stake",
            label: t("stake"),
            icon: stakeIcon,
        },
        {
            id: "withdraw",
            label: t("withdraw"),
            icon: withdrawIcon,
        },
    ];

    const isTransactionPending =
        isStakePending ||
        isWithdrawPending ||
        isApprovePending ||
        isStakeConfirming ||
        isWithdrawConfirming ||
        isApproveConfirming;

    const getButtonLabel = (): string => {
        if (!isConnected) return t("connectWallet");
        if (isLoading) return t("loading");

        if (activeMode === "stake") {
            if (isApprovePending || isApproveConfirming) return t("approving");
            if (isStakePending || isStakeConfirming) return t("staking");
            if (needsApproval(amount)) return t("approveXcn");
            return t("stake");
        } else {
            if (isWithdrawPending || isWithdrawConfirming)
                return t("withdrawing");
            return t("withdraw");
        }
    };

    const isButtonDisabled =
        !isConnected ||
        isLoading ||
        !amount ||
        parseFloat(amount) <= 0 ||
        isTransactionPending;

    const infoRows = [
        {
            label: t("estimatedDailyEarnings"),
            value: !stakingAPR ? (
                <LoadingDots size="sm" variant="inline" />
            ) : (
                `${calculateEstimatedEarnings(amount)} XCN`
            ),
        },
        {
            label: `${t("stakingAPR")}:`,
            value: stakingAPR || <LoadingDots size="sm" variant="inline" />,
        },
    ];

    return (
        <InteractivePanel
            title={t("amount")}
            availableBalanceLabel={`${t("availableBalance")} `}
            availableBalanceValue={`${availableBalance.toFixed(2)} XCN`}
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

export default StakeActionPanel;
