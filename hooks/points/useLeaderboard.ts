"use client";

import { useQuery } from "@tanstack/react-query";
import {
    pointsApiService,
    pointsSubsquidService,
    type LeaderboardResponse,
} from "@/lib/api/services/points";

type UseLeaderboardParams = {
    page: number;
    limit: number;
    skipTop?: number;
};

export const useLeaderboard = ({
    page,
    limit,
    skipTop = 0,
}: UseLeaderboardParams) => {
    return useQuery<LeaderboardResponse>({
        queryKey: ["leaderboard", page, limit, skipTop],
        queryFn: async () => {
            const offset = skipTop + (page - 1) * limit;

            try {
                const gql = await pointsSubsquidService.getLeaderboard({
                    page,
                    limit,
                    offset,
                });
                if (skipTop > 0) {
                    const totalAdjusted = Math.max(0, gql.meta.total - skipTop);
                    const totalPagesAdjusted = Math.ceil(totalAdjusted / limit);
                    return {
                        results: gql.results,
                        meta: {
                            page,
                            limit,
                            total: totalAdjusted,
                            totalPages: totalPagesAdjusted,
                        },
                    };
                }
                return gql;
            } catch {
                console.error(
                    "[useLeaderboard] gql failed, falling back to REST"
                );
                const restPage = Math.max(1, Math.floor(offset / limit) + 1);
                const rest = await pointsApiService.getLeaderboard({
                    page: restPage,
                    limit,
                });
                return rest;
            }
        },
        placeholderData: (previous) => previous,
        staleTime: 30000,
        refetchInterval: 30000,
    });
};

export default useLeaderboard;
