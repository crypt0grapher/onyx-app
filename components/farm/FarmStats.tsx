"use client";

import React, { useState } from "react";
import BigNumber from "bignumber.js";
import { useTranslations } from "next-intl";
import StatsDisplay from "@/components/ui/shared/StatsDisplay";
import { useAccount } from "wagmi";
import { useFarmUser } from "@/hooks/farm/useFarmUser";
import { useFarmActions } from "@/hooks/farm/useFarmActions";
import { useFarmsData } from "@/hooks/farm/useFarmsData";
import { formatTokenBalance } from "@/utils/format";
import LoadingDots from "@/components/ui/common/LoadingDots";
import { useRevalidation } from "@/hooks/common/useRevalidation";
import useNetworkCheck from "@/hooks/common/useNetworkCheck";
import useToast from "@/hooks/ui/useToast";

import stakeIcon from "@/assets/icons/stake.svg";
import dailyIcon from "@/assets/icons/24.svg";
import claimIcon from "@/assets/icons/claim.svg";
import FarmingGraph from "./FarmingGraph";

const FarmStats: React.FC = () => {
    const t = useTranslations("farms.stats");
    const { address } = useAccount();
    const pid = 0;
    const user = useFarmUser(pid);
    const { farms } = useFarmsData();
    const { claim } = useFarmActions(pid);
    const { afterFarmTransaction } = useRevalidation();
    const [isClaimPending, setIsClaimPending] = useState(false);
    const { isOnEthereum } = useNetworkCheck();
    const { showDangerToast } = useToast();
    const tt = useTranslations("toast");

    const farm = farms[0];

    const calculateDailyEarnings = (): string => {
        if (
            !farm?.tokenPerSecondWei ||
            !farm?.lpStakedTotalWei ||
            !user.stakedWei ||
            user.stakedWei === BigInt(0)
        ) {
            return "0.00";
        }

        try {
            const poolPerSecond = new BigNumber(farm.tokenPerSecondWei);
            const totalStakedWei = new BigNumber(farm.lpStakedTotalWei);
            if (totalStakedWei.isZero()) return "0.00";

            const userStakedWei = new BigNumber(user.stakedWei.toString());
            const share = userStakedWei.div(totalStakedWei);
            const dailyTokensWei = poolPerSecond.times(86400).times(share);
            const dailyXcn = dailyTokensWei.div(new BigNumber(10).pow(18));
            if (!dailyXcn.isFinite() || dailyXcn.lte(0)) return "0.00";
            return dailyXcn.toFixed(4);
        } catch (error) {
            console.error("Error calculating daily earnings:", error);
            return "0.00";
        }
    };

    const userStaked =
        formatTokenBalance(user.stakedWei, user.lpDecimals, 2) + " LP";

    const isConnected = !!address;
    const isLoading = user.isLoading || farms.length === 0;
    const hasPendingRewards = user.pendingRewardsWei > BigInt(0);

    const dailyEarnings = calculateDailyEarnings() + " XCN";
    const pendingRewards =
        formatTokenBalance(user.pendingRewardsWei, 18, 4) + " XCN";

    const handleClaimRewards = async () => {
        if (!isOnEthereum) {
            showDangerToast(
                tt("network.wrongNetwork"),
                tt("network.wrongNetworkFarmSubtext")
            );
            return;
        }
        try {
            setIsClaimPending(true);
            const res = await claim();
            if (res) {
                await user.refetch();
                afterFarmTransaction({ withPolling: true });
            }
        } finally {
            setIsClaimPending(false);
        }
    };

    const renderValue = (value: string): string | React.ReactElement => {
        if (!isConnected) return "0.00";
        if (isLoading)
            return (
                <LoadingDots
                    size="md"
                    variant="inline"
                    className="text-primary"
                />
            );
        return value;
    };

    const dataBoxes = [
        {
            icon: stakeIcon,
            value: renderValue(userStaked),
            description: t("yourStakedTokens"),
            hasBorderBottom: true,
        },
        {
            icon: dailyIcon,
            value: renderValue(dailyEarnings),
            description: t("dailyEarnings"),
            hasBorderBottom: true,
        },
        {
            icon: claimIcon,
            value: renderValue(pendingRewards),
            description: t("toClaim"),
        },
    ];

    const mobileRows = [
        {
            icon: stakeIcon,
            label: t("yourStakedTokens"),
            value: renderValue(userStaked),
        },
        {
            icon: dailyIcon,
            label: t("dailyEarnings"),
            value: renderValue(dailyEarnings),
        },
        {
            icon: claimIcon,
            label: t("toClaim"),
            value: renderValue(pendingRewards),
        },
    ];

    const shouldShowClaimButton = isConnected;

    return (
        <StatsDisplay
            dataBoxes={dataBoxes}
            graph={<FarmingGraph height={"100%"} />}
            onClaim={handleClaimRewards}
            claimButtonLabel={
                isClaimPending ? t("claiming") : t("claimRewards")
            }
            isClaimDisabled={
                !isConnected ||
                isLoading ||
                !hasPendingRewards ||
                isClaimPending
            }
            claimIcon={claimIcon}
            mobileRows={mobileRows}
            shouldShowClaimButton={shouldShowClaimButton}
        />
    );
};

export default FarmStats;
