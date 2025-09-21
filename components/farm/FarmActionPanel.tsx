"use client";

import React, { useState } from "react";
import BigNumber from "bignumber.js";
import { useTranslations } from "next-intl";
import InteractivePanel from "@/components/ui/shared/InteractivePanel";
import { type ImageLikeSrc } from "@/utils/image";
import { useAccount } from "wagmi";
import { useFarmUser } from "@/hooks/farm/useFarmUser";
import { useFarmActions } from "@/hooks/farm/useFarmActions";
import LoadingDots from "@/components/ui/common/LoadingDots";
import useToast from "@/hooks/ui/useToast";
import useNetworkCheck from "@/hooks/common/useNetworkCheck";
import { useRevalidation } from "@/hooks/common/useRevalidation";
import { useFarmsData } from "@/hooks/farm/useFarmsData";

import stakeIcon from "@/assets/icons/stake.svg";
import withdrawIcon from "@/assets/icons/withdraw.svg";

const FarmActionPanel: React.FC = () => {
    const t = useTranslations("farms.actionPanel");
    const tCommon = useTranslations("common");
    const tWallet = useTranslations("sidebar.wallet");
    const [activeMode, setActiveMode] = useState("stake");
    const [amount, setAmount] = useState("");
    const { address } = useAccount();
    const pid = 0;
    const user = useFarmUser(pid);
    const { approveMax, stake, withdraw } = useFarmActions(pid);
    const { farms } = useFarmsData();
    const { showToast, showDangerToast } = useToast();
    const { isOnEthereum } = useNetworkCheck();
    const tt = useTranslations("toast");
    const { afterFarmTransaction } = useRevalidation();
    const [submitting, setSubmitting] = useState(false);
    const [isApprovePending, setIsApprovePending] = useState(false);
    const [isStakePending, setIsStakePending] = useState(false);
    const [isWithdrawPending, setIsWithdrawPending] = useState(false);

    const isConnected = !!address;
    const isUserLoading = user.isLoading;
    const isSubmitting = submitting;

    const numericMaxBalance = (() => {
        const sourceWei =
            activeMode === "stake" ? user.walletLpWei : user.stakedWei;
        try {
            const raw = new BigNumber(sourceWei.toString()).div(
                new BigNumber(10).pow(user.lpDecimals)
            );
            return raw.decimalPlaces(6, BigNumber.ROUND_FLOOR).toNumber();
        } catch {
            return 0;
        }
    })();

    const farm = farms.find((f) => f.pid === pid);

    const calculateEstimatedDailyEarnings = (inputAmount: string): string => {
        if (
            !inputAmount ||
            parseFloat(inputAmount) <= 0 ||
            !farm?.tokenPerSecondWei ||
            !farm?.lpStakedTotalWei
        ) {
            return "0.00";
        }

        try {
            const amountWei = new BigNumber(inputAmount).times(
                new BigNumber(10).pow(user.lpDecimals)
            );
            if (!amountWei.isFinite() || amountWei.lte(0)) return "0.00";

            const totalStakedWei = new BigNumber(farm.lpStakedTotalWei);
            if (totalStakedWei.lte(0)) return "0.00";

            const poolPerSecondWei = new BigNumber(farm.tokenPerSecondWei);

            const adjustedTotalWei =
                activeMode === "stake"
                    ? totalStakedWei.plus(amountWei)
                    : BigNumber.max(totalStakedWei.minus(amountWei), 0);

            if (adjustedTotalWei.lte(0)) return "0.00";

            const share = amountWei.div(adjustedTotalWei);
            if (!share.isFinite() || share.lte(0)) return "0.00";

            const dailyTokensWei = poolPerSecondWei.times(86400).times(share);
            const dailyXcn = dailyTokensWei.div(new BigNumber(10).pow(18));
            if (!dailyXcn.isFinite() || dailyXcn.lte(0)) return "0.00";
            return dailyXcn.toFixed(4);
        } catch {
            return "0.00";
        }
    };

    const handleAction = async () => {
        if (!isOnEthereum) {
            showDangerToast(
                tt("network.wrongNetwork"),
                tt("network.wrongNetworkFarmSubtext")
            );
            return;
        }
        if (!isConnected) {
            showToast({
                variant: "danger",
                text: tStake("walletNotConnected"),
                subtext: tStake("walletNotConnectedSubtext"),
            });
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            showToast({
                variant: "danger",
                text: tStake("invalidAmount"),
                subtext: tStake("invalidAmountSubtext"),
            });
            return;
        }
        try {
            setSubmitting(true);
            if (activeMode === "stake") {
                if (user.needsApproval(amount)) {
                    setIsApprovePending(true);
                    const approved = await approveMax();
                    setIsApprovePending(false);
                    if (!approved) return;
                    await user.refetch();
                }

                setIsStakePending(true);
                const staked = await stake(amount, user.lpDecimals);
                setIsStakePending(false);
                if (!staked) return;
                setAmount("");
                await user.refetch();
                afterFarmTransaction({ withPolling: true });
            } else {
                setIsWithdrawPending(true);
                const withdrew = await withdraw(amount, user.lpDecimals);
                setIsWithdrawPending(false);
                if (!withdrew) return;
                setAmount("");
                await user.refetch();
                afterFarmTransaction({ withPolling: true });
            }
        } finally {
            setSubmitting(false);
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

    const infoRows = [
        {
            label: t("estimatedDailyEarnings"),
            value: isUserLoading ? (
                <LoadingDots size="sm" variant="inline" />
            ) : farm ? (
                `${calculateEstimatedDailyEarnings(amount)} XCN`
            ) : (
                "0.00 XCN"
            ),
        },
        {
            label: `${t("stakingAPR")}:`,
            value: farm?.stakingAPR || "0.00%",
        },
    ];

    const tStake = useTranslations("staking.stakeComponent");
    const tFarms = useTranslations("farms");

    const availableBalanceDisplay = (() => {
        const str = new BigNumber(numericMaxBalance)
            .toFixed(6)
            .replace(/\.0+$|(?<=\..*?)0+$/g, "")
            .replace(/\.$/, "");
        return str === "" ? "0" : str;
    })();
    const getButtonLabel = (): string => {
        if (!isConnected) return tWallet("connect");
        if (activeMode === "stake") {
            if (isApprovePending) return tStake("approving");
            if (isStakePending) return tStake("staking");
            if (isOnEthereum && user.needsApproval(amount))
                return tFarms("approvePair");
            if (isOnEthereum && isUserLoading) return tCommon("loading");
            return t("stake");
        } else {
            if (isWithdrawPending) return tStake("withdrawing");
            if (isOnEthereum && isUserLoading) return tCommon("loading");
            return t("withdraw");
        }
    };

    return (
        <InteractivePanel
            title={t("amount")}
            availableBalanceLabel={`${t("availableBalance")} `}
            availableBalanceValue={`${availableBalanceDisplay} LP`}
            switcherItems={switcherItems}
            activeMode={activeMode}
            onSwitch={setActiveMode}
            amount={amount}
            onAmountChange={setAmount}
            maxBalance={numericMaxBalance}
            infoRows={infoRows}
            buttonLabel={getButtonLabel()}
            onAction={handleAction}
            isButtonDisabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                isUserLoading ||
                isSubmitting ||
                isApprovePending ||
                isStakePending ||
                isWithdrawPending ||
                (activeMode === "stake" && !user.canStake(amount)) ||
                (activeMode === "withdraw" && !user.canWithdraw(amount))
            }
            actionIcon={activeMode === "stake" ? stakeIcon : withdrawIcon}
            isConnected={isConnected}
            isLoading={isUserLoading}
        />
    );
};

export default FarmActionPanel;
