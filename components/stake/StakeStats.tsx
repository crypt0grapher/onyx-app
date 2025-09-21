"use client";

import React from "react";
import { useTranslations } from "next-intl";
import StakingGraph from "@/components/stake/StakingGraph";
import { useUserStakingInfo, useClaimRewards } from "@/hooks";
import useToast from "@/hooks/ui/useToast";
import useNetworkCheck from "@/hooks/common/useNetworkCheck";
import LoadingDots from "@/components/ui/common/LoadingDots";
import { useTransactionExecutor } from "@/hooks/wallet/useTransactionExecutor";
import StatsDisplay from "@/components/ui/shared/StatsDisplay";
import { useRevalidation } from "@/hooks/common/useRevalidation";

import stakeIcon from "@/assets/icons/stake.svg";
import dailyIcon from "@/assets/icons/24.svg";
import claimIcon from "@/assets/icons/claim.svg";

const StakeStats: React.FC = () => {
  const t = useTranslations("staking.stakedTokens");
  const tt = useTranslations("toast");
  const { isOnEthereum } = useNetworkCheck();
  const {
    userStaked,
    dailyEarnings,
    pendingRewards,
    pendingRewardsRaw,
    isLoading,
    isError,
    isConnected,
    refetch,
  } = useUserStakingInfo();

  const {
    claim,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
  } = useClaimRewards();

  const { showToast } = useToast();
  const { executeTransaction } = useTransactionExecutor();
  const { afterStakingTransaction } = useRevalidation();

  const handleClaimRewards = async () => {
    if (!isConnected) {
      showToast({
        variant: "danger",
        text: "Wallet Not Connected",
        subtext: "Please connect your wallet to claim rewards",
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

    if (pendingRewardsRaw <= 0) {
      showToast({
        variant: "danger",
        text: "No Rewards",
        subtext: "You have no rewards to claim",
      });
      return;
    }

    try {
      await executeTransaction({
        action: () => claim().then((r) => r as unknown as `0x${string}`),
        successText: "Rewards claimed successfully!",
        errorText: "Failed to claim rewards",
        onSuccess: () => {
          refetch();
          afterStakingTransaction({ withPolling: true });
        },
      });
    } catch (error) {
      console.error("Claim error:", error);
    }
  };

  const renderValue = (
    value: string,
    isLoading: boolean
  ): string | React.ReactElement => {
    if (isLoading)
      return (
        <LoadingDots size="md" variant="inline" className="text-primary" />
      );
    if (!isConnected) return "0.00 XCN";
    if (isError) return "Error";
    return `${value} XCN`;
  };

  const isClaimDisabled =
    !isConnected ||
    isLoading ||
    pendingRewardsRaw <= 0 ||
    isClaimPending ||
    isClaimConfirming;

  const shouldShowClaimButton = isConnected;

  const dataBoxes = [
    {
      icon: stakeIcon,
      value: renderValue(userStaked, isLoading),
      description: t("yourStakedTokens"),
      hasBorderBottom: true,
    },
    {
      icon: dailyIcon,
      value: renderValue(dailyEarnings, isLoading),
      description: t("dailyEarnings"),
      showBadge: true,
      hasBorderBottom: true,
    },
    {
      icon: claimIcon,
      value: renderValue(pendingRewards, isLoading),
      description: t("toClaim"),
    },
  ];

  const mobileRows = [
    {
      icon: stakeIcon,
      label: t("yourStakedTokens"),
      value: renderValue(userStaked, isLoading),
    },
    {
      icon: dailyIcon,
      label: t("dailyEarnings"),
      value: renderValue(dailyEarnings, isLoading),
    },
    {
      icon: claimIcon,
      label: t("toClaim"),
      value: renderValue(pendingRewards, isLoading),
    },
  ];

  return (
    <StatsDisplay
      dataBoxes={dataBoxes}
      graph={<StakingGraph height={"100%"} />}
      onClaim={handleClaimRewards}
      claimButtonLabel={
        isClaimPending || isClaimConfirming ? "Claiming..." : t("claimRewards")
      }
      isClaimDisabled={isClaimDisabled}
      claimIcon={claimIcon}
      mobileRows={mobileRows}
      shouldShowClaimButton={shouldShowClaimButton}
    />
  );
};

export default StakeStats;
