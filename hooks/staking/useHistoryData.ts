import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { SubgraphService } from "@/lib/api";
import type { HistoryItem, HistoryResponse } from "@/lib/api/services/subgraph";
import { ITEMS_PER_PAGE } from "@/config/historyTransactions";
import {
    isClientSideSortableField,
    sortHistoryItems,
} from "@/utils/historySort";

type SearchType = "none" | "address" | "txHash";

export type HistoryFilter = {
    type: string;
    userFilter: "all" | "my";
};

export const useHistoryData = () => {
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "my">("all");
    const [selectedType, setSelectedType] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] =
        useState<keyof HistoryItem>("blockTimestamp");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const { address } = useAccount();

    const subgraph = useMemo(() => new SubgraphService(), []);

    const searchType: SearchType = useMemo(() => {
        const trimmed = searchValue.trim();
        if (!trimmed) return "none";

        if (trimmed.startsWith("0x")) {
            if (trimmed.length === 66) {
                return "txHash";
            }
            if (trimmed.length === 42) {
                return "address";
            }
            if (trimmed.length > 2) {
                return "address";
            }
        }

        return "none";
    }, [searchValue]);

    const subgraphFilter = useMemo(() => {
        const filter: Record<string, string> = {};

        if (selectedType !== "all") {
            filter.type = selectedType;
        }

        if (activeFilter === "my" && address) {
            filter.from = address.toLowerCase();
        }

        return filter;
    }, [selectedType, activeFilter, address]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, activeFilter, selectedType, sortField, sortDirection]);

    const { data, isLoading, error, refetch } = useQuery<HistoryResponse>({
        queryKey: [
            "history",
            activeFilter,
            subgraphFilter,
            searchType,
            searchType !== "none" ? searchValue.trim() : null,
            currentPage,
            sortField,
            sortDirection,
            address?.toLowerCase() ?? null,
        ],
        queryFn: async (): Promise<HistoryResponse> => {
            if (activeFilter === "my" && !address) {
                return {
                    items: [],
                    totalCount: 0,
                    hasNextPage: false,
                };
            }
            const offset = (currentPage - 1) * ITEMS_PER_PAGE;

            try {
                if (selectedType === "propose") {
                    const first = ITEMS_PER_PAGE + 1;
                    const skip = (currentPage - 1) * ITEMS_PER_PAGE;
                    const proposalsResult = await subgraph.getProposals(
                        first,
                        skip
                    );

                    let mapped: HistoryItem[] = proposalsResult.proposals.map(
                        (p) => {
                            let totalVotes = BigInt(0);
                            try {
                                const forV = BigInt(p.forVotes || "0");
                                const againstV = BigInt(p.againstVotes || "0");
                                totalVotes = forV + againstV;
                            } catch {
                                totalVotes = BigInt(0);
                            }
                            return {
                                id: p.id,
                                type: "propose",
                                to: p.proposer,
                                from: p.proposer,
                                amount: totalVotes.toString(),
                                blockNumber: p.createdBlockNumber,
                                blockTimestamp: p.createdBlockTimestamp,
                                transactionHash: p.createdTransactionHash,
                            } as HistoryItem;
                        }
                    );

                    if (activeFilter === "my" && address) {
                        mapped = mapped.filter(
                            (m) =>
                                m.from.toLowerCase() === address.toLowerCase()
                        );
                    }

                    if (searchType === "txHash") {
                        mapped = mapped.filter(
                            (m) =>
                                m.transactionHash.toLowerCase() ===
                                searchValue.trim().toLowerCase()
                        );
                    } else if (searchType === "address") {
                        const q = searchValue.trim().toLowerCase();
                        mapped = mapped.filter(
                            (m) =>
                                m.from.toLowerCase() === q ||
                                m.to.toLowerCase() === q
                        );
                    }

                    let finalItems = mapped;
                    if (isClientSideSortableField(sortField)) {
                        finalItems = sortHistoryItems(
                            mapped,
                            sortField,
                            sortDirection
                        );
                    } else if (sortField !== "blockTimestamp") {
                        finalItems = sortHistoryItems(
                            mapped,
                            sortField,
                            sortDirection
                        );
                    } else if (sortDirection === "asc") {
                        finalItems = [...mapped].sort(
                            (a, b) =>
                                Number(a.blockTimestamp) -
                                Number(b.blockTimestamp)
                        );
                    }

                    const hasNextPage = finalItems.length > ITEMS_PER_PAGE;
                    if (hasNextPage)
                        finalItems = finalItems.slice(0, ITEMS_PER_PAGE);

                    return {
                        items: finalItems,
                        totalCount: proposalsResult.proposalCounts?.[0]
                            ? Number(proposalsResult.proposalCounts[0].count)
                            : finalItems.length,
                        hasNextPage,
                    };
                }

                if (searchType === "txHash") {
                    const result = await subgraph.searchByTxHash(
                        searchValue.trim()
                    );
                    let filteredItems = result.items;
                    if (selectedType !== "all") {
                        filteredItems = filteredItems.filter(
                            (item) =>
                                item.type.toLowerCase() ===
                                selectedType.toLowerCase()
                        );
                    }
                    if (activeFilter === "my" && address) {
                        filteredItems = filteredItems.filter(
                            (item) =>
                                item.from.toLowerCase() ===
                                    address.toLowerCase() ||
                                item.to.toLowerCase() === address.toLowerCase()
                        );
                    }
                    const sortedItems = sortHistoryItems(
                        filteredItems,
                        sortField,
                        sortDirection
                    );

                    return {
                        ...result,
                        items: sortedItems,
                        totalCount: sortedItems.length,
                    };
                }

                if (searchType === "address") {
                    const result = await subgraph.searchByAddress(
                        searchValue.trim().toLowerCase(),
                        {
                            limit: ITEMS_PER_PAGE * 3,
                            offset: 0,
                        }
                    );
                    let filteredItems = result.items;
                    if (selectedType !== "all") {
                        filteredItems = filteredItems.filter(
                            (item) =>
                                item.type.toLowerCase() ===
                                selectedType.toLowerCase()
                        );
                    }
                    if (activeFilter === "my" && address) {
                        filteredItems = filteredItems.filter(
                            (item) =>
                                item.from.toLowerCase() ===
                                    address.toLowerCase() ||
                                item.to.toLowerCase() === address.toLowerCase()
                        );
                    }
                    const sortedItems = sortHistoryItems(
                        filteredItems,
                        sortField,
                        sortDirection
                    );
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const endIndex = startIndex + ITEMS_PER_PAGE;
                    const paginatedItems = sortedItems.slice(
                        startIndex,
                        endIndex
                    );

                    return {
                        items: paginatedItems,
                        totalCount: sortedItems.length,
                        hasNextPage: endIndex < sortedItems.length,
                    };
                }

                if (isClientSideSortableField(sortField)) {
                    const result = await subgraph.getHistory(
                        subgraphFilter,
                        { direction: "desc", field: "blockTimestamp" },
                        { limit: ITEMS_PER_PAGE, offset }
                    );

                    const pageSorted = sortHistoryItems(
                        result.items,
                        sortField,
                        sortDirection
                    );

                    return {
                        ...result,
                        items: pageSorted,
                    };
                }

                return subgraph.getHistory(
                    subgraphFilter,
                    { direction: sortDirection, field: sortField },
                    { limit: ITEMS_PER_PAGE, offset }
                );
            } catch {
                return {
                    items: [],
                    totalCount: 0,
                    hasNextPage: false,
                };
            }
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        placeholderData: (prev) => prev,
        enabled: true,
    });

    const items = data?.items ?? [];
    const totalItems = data?.totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const startItem =
        items.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
    const endItem =
        items.length > 0
            ? Math.min(currentPage * ITEMS_PER_PAGE, totalItems)
            : 0;

    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
    }, []);

    const handleFilterChange = useCallback((filter: "all" | "my") => {
        setActiveFilter(filter);
    }, []);

    const handleTypeChange = useCallback((type: string) => {
        setSelectedType(type);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

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

        searchValue,
        activeFilter,
        selectedType,
        currentPage,
        searchType,
        sortField,
        sortDirection,

        isSearchActive: searchType !== "none",
        canShowMyTransactions: Boolean(address),

        handleSearchChange,
        handleFilterChange,
        handleTypeChange,
        handlePageChange,
        handleSortChange,
        refetch,
    };
};
