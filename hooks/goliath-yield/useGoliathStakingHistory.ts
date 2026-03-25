"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { goliathConfig } from "@/config/goliath";
import { getGoliathNetwork } from "@/config/networks";
import { fetchStakingEventsFromExplorer } from "@/lib/api/services/blockscout";

export interface GoliathStakingEvent {
    id: string;
    type: "staked" | "unstaked";
    transactionHash: string;
    blockNumber: bigint;
    amount: string; // formatted XCN amount (ether units)
}

const ITEMS_PER_PAGE = 10;

export function useGoliathStakingHistory() {
    const { address } = useAccount();
    const stXcnAddress = goliathConfig.staking.stXcnAddress;

    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string>("blockNumber");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const { data: events, isLoading, isError, refetch } = useQuery({
        queryKey: ["goliath-staking-history", address],
        queryFn: async () => {
            if (!address) return [];

            const explorerUrl = getGoliathNetwork().blockExplorerUrl;
            const explorerEvents = await fetchStakingEventsFromExplorer(
                stXcnAddress,
                address,
                explorerUrl,
            );

            return explorerEvents.map(
                (ev, i): GoliathStakingEvent => ({
                    id: `${ev.type.toLowerCase()}-${ev.transactionHash}-${i}`,
                    type: ev.type === "Staked" ? "staked" : "unstaked",
                    transactionHash: ev.transactionHash,
                    blockNumber: ev.blockNumber,
                    amount: formatEther(ev.xcnAmount),
                }),
            );
        },
        enabled: !!address,
        refetchInterval: 30000,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    });

    const allEvents = events ?? [];

    const sortedEvents = useMemo(() => {
        const sorted = [...allEvents];
        sorted.sort((a, b) => {
            let comparison = 0;
            if (sortField === "blockNumber") {
                comparison = Number(a.blockNumber - b.blockNumber);
            } else if (sortField === "type") {
                comparison = a.type.localeCompare(b.type);
            } else if (sortField === "amount") {
                comparison = parseFloat(a.amount) - parseFloat(b.amount);
            }
            return sortDirection === "desc" ? -comparison : comparison;
        });
        return sorted;
    }, [allEvents, sortField, sortDirection]);

    const totalItems = sortedEvents.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startItem = (safePage - 1) * ITEMS_PER_PAGE;
    const endItem = Math.min(startItem + ITEMS_PER_PAGE, totalItems);
    const pageItems = sortedEvents.slice(startItem, endItem);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleSortChange = (field: string) => {
        if (field === sortField) {
            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    return {
        items: pageItems,
        currentPage: safePage,
        totalPages,
        startItem: startItem + 1,
        endItem,
        totalItems,
        isLoading,
        isError,
        refetch,
        sortField,
        sortDirection,
        handlePageChange,
        handleSortChange,
    };
}
