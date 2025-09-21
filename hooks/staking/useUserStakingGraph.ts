import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { SubgraphService } from "@/lib/api";
import type { HistoryItem } from "@/lib/api/services/subgraph";
import { convertWeiToTokens } from "@/utils/format";
import { STAKING_CONSTANTS } from "@/contracts/config";
import { useUserStakingInfo } from "./useUserStaking";

export type StakingGraphDatum = {
    date: string;
    staked: number;
    earnings: number;
};

export const useUserStakingGraph = (days: number = 5) => {
    const { address } = useAccount();
    const subgraph = useMemo(() => new SubgraphService(), []);
    const { userStakedRaw } = useUserStakingInfo();

    const { data, isLoading, error } = useQuery({
        queryKey: ["user-staking-graph", address?.toLowerCase(), days],
        queryFn: async (): Promise<HistoryItem[]> => {
            if (!address) return [];

            const response = await subgraph.getStakeWithdrawHistory(
                "my",
                address,
                { direction: "desc", field: "blockTimestamp" },
                { limit: 500, offset: 0 }
            );

            return response.items;
        },
        enabled: !!address,
        staleTime: 2 * 60 * 1000,
    });

    const graphData = useMemo((): StakingGraphDatum[] => {
        if (!data || data.length === 0) {
            const emptyData: StakingGraphDatum[] = [];
            const today = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                emptyData.push({
                    date: date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                    }),
                    staked: 0,
                    earnings: 0,
                });
            }
            return emptyData;
        }

        const dailyData = new Map<
            string,
            { staked: number; earnings: number }
        >();

        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
            });
            dailyData.set(dateKey, { staked: 0, earnings: 0 });
        }

        const currentStakedBalance = parseFloat(
            convertWeiToTokens(
                userStakedRaw.toString(),
                STAKING_CONSTANTS.XCN_DECIMALS,
                2,
                false
            )
        );

        const relevantTransactions = data.filter((transaction) => {
            const transactionDate = new Date(
                parseInt(transaction.blockTimestamp) * 1000
            );
            const daysDiff = Math.floor(
                (today.getTime() - transactionDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            );
            return daysDiff < days;
        });

        const sortedTransactions = [...relevantTransactions].sort(
            (a, b) => parseInt(a.blockTimestamp) - parseInt(b.blockTimestamp)
        );

        let lastKnownStaked = currentStakedBalance;
        const processedDates = new Set<string>();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
            });

            const transactionsAfterDate = sortedTransactions.filter(
                (transaction) => {
                    const transactionDate = new Date(
                        parseInt(transaction.blockTimestamp) * 1000
                    );
                    const transactionDateKey =
                        transactionDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                        });
                    return transactionDateKey >= dateKey;
                }
            );

            let stakedForDay = currentStakedBalance;
            for (const transaction of transactionsAfterDate) {
                const amount = parseFloat(
                    convertWeiToTokens(
                        transaction.amount,
                        STAKING_CONSTANTS.XCN_DECIMALS,
                        2,
                        false
                    )
                );

                if (transaction.type === "stake") {
                    stakedForDay -= amount;
                } else if (transaction.type === "withdraw") {
                    stakedForDay += amount;
                }
            }

            const earningsForDay = sortedTransactions
                .filter((transaction) => {
                    const transactionDate = new Date(
                        parseInt(transaction.blockTimestamp) * 1000
                    );
                    const transactionDateKey =
                        transactionDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                        });
                    return (
                        transactionDateKey === dateKey &&
                        transaction.type === "claim"
                    );
                })
                .reduce((total, transaction) => {
                    const amount = parseFloat(
                        convertWeiToTokens(
                            transaction.amount,
                            STAKING_CONSTANTS.XCN_DECIMALS,
                            2,
                            false
                        )
                    );
                    return total + amount;
                }, 0);

            dailyData.set(dateKey, {
                staked: Math.max(0, stakedForDay),
                earnings: earningsForDay,
            });
            processedDates.add(dateKey);
            lastKnownStaked = Math.max(0, stakedForDay);
        }

        const result: StakingGraphDatum[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
            });

            const dayData = dailyData.get(dateKey) || {
                staked: lastKnownStaked,
                earnings: 0,
            };

            result.push({
                date: dateKey,
                staked: Math.round(dayData.staked * 100) / 100,
                earnings: Math.round(dayData.earnings * 100) / 100,
            });
        }

        return result;
    }, [data, days, userStakedRaw]);
    return {
        data: graphData,
        isLoading,
        error,
        hasData: !isLoading && !!address && data && data.length > 0,
    };
};
