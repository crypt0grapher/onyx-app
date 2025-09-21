import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { SubgraphService } from "@/lib/api";
import type { HistoryItem, HistoryResponse } from "@/lib/api/services/subgraph";
import { ITEMS_PER_PAGE } from "@/config/historyTransactions";
import {
    sortHistoryItems,
    isClientSideSortableField,
} from "@/utils/historySort";

export type StakingScope = "all" | "my";

export const useStakingHistory = (scope: StakingScope = "all") => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] =
        useState<keyof HistoryItem>("blockTimestamp");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const { address } = useAccount();

    const subgraph = useMemo(() => new SubgraphService(), []);

    useEffect(() => {
        setCurrentPage(1);
    }, [scope, sortField, sortDirection, address]);

    const shouldFetch = scope === "all" || Boolean(address);

    const { data, isLoading, error, refetch } = useQuery<HistoryResponse>({
        queryKey: [
            "staking-history",
            scope,
            address?.toLowerCase() ?? null,
            currentPage,
            sortField,
            sortDirection,
        ],
        queryFn: async (): Promise<HistoryResponse> => {
            const offset = (currentPage - 1) * ITEMS_PER_PAGE;

            if (isClientSideSortableField(sortField)) {
                const base = await subgraph.getStakeWithdrawHistory(
                    scope,
                    address,
                    { direction: "desc", field: "blockTimestamp" },
                    { limit: ITEMS_PER_PAGE, offset }
                );
                const sorted = sortHistoryItems(
                    base.items,
                    sortField,
                    sortDirection
                );
                return { ...base, items: sorted };
            }

            return subgraph.getStakeWithdrawHistory(
                scope,
                address,
                { direction: sortDirection, field: sortField },
                { limit: ITEMS_PER_PAGE, offset }
            );
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        enabled: shouldFetch,
    });

    const effectiveData = scope === "my" && !address ? null : data;
    const items = effectiveData?.items ?? [];
    const totalItems = effectiveData?.totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const startItem =
        items.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
    const endItem =
        items.length > 0
            ? Math.min(currentPage * ITEMS_PER_PAGE, totalItems)
            : 0;

    const handlePageChange = useCallback(
        (page: number) => setCurrentPage(page),
        []
    );
    const handleSortChange = useCallback(
        (field: keyof HistoryItem) => {
            setSortDirection((prev) =>
                field === sortField ? (prev === "asc" ? "desc" : "asc") : "asc"
            );
            setSortField(field);
        },
        [sortField]
    );

    return {
        items,
        totalItems,
        totalPages,
        startItem,
        endItem,
        isLoading,
        error,
        currentPage,
        sortField,
        sortDirection,
        canShowMyTransactions: Boolean(address),
        handlePageChange,
        handleSortChange,
        refetch,
    };
};
