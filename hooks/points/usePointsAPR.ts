"use client";

import { useQuery } from "@tanstack/react-query";
import { BigNumber } from "bignumber.js";
import { pointsSubsquidService } from "@/lib/api/services/points";
import { useStakingData } from "@/hooks/staking/useStakingData";
import { STAKING_CONSTANTS } from "@/contracts/config";

export const usePointsAPR = () => {
    const { raw } = useStakingData();

    return useQuery({
        queryKey: [
            "points-apr",
            raw?.poolInfo?.totalAmountStake?.toString() || "0",
        ],
        queryFn: async () => {
            try {
                if (!raw?.poolInfo?.totalAmountStake) {
                    return new BigNumber(0);
                }

                const totalStakedWei = new BigNumber(
                    raw.poolInfo.totalAmountStake.toString()
                );

                if (totalStakedWei.isZero()) {
                    return new BigNumber(0);
                }

                const data = await pointsSubsquidService.getPointsSettings();
                const { weight, pointsPerDay } = data;

                const totalStakedFromWei = totalStakedWei.div(
                    new BigNumber(10).pow(STAKING_CONSTANTS.XCN_DECIMALS)
                );

                return new BigNumber(pointsPerDay ?? 0)
                    .times(weight ?? 0)
                    .times(365)
                    .times(100)
                    .div(totalStakedFromWei);
            } catch (error) {
                console.error("Error fetching points apr:", error);
                return new BigNumber(0);
            }
        },
        enabled: !!raw?.poolInfo?.totalAmountStake,
        refetchInterval: 60000,
        staleTime: 30000,
    });
};

export default usePointsAPR;
