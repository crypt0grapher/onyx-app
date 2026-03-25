"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { goliathConfig } from "@/config/goliath";
import { stakedXcnAbi } from "@/contracts/abis/goliath";
import { goliathPublicClient } from "@/lib/goliathClient";

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

    const { data: events, isLoading } = useQuery({
        queryKey: ["goliath-staking-history", address],
        queryFn: async () => {
            if (!address) return [];

            const [stakedLogs, unstakedLogs] = await Promise.all([
                goliathPublicClient.getContractEvents({
                    address: stXcnAddress,
                    abi: stakedXcnAbi,
                    eventName: "Staked",
                    args: { user: address },
                    fromBlock: 0n,
                    toBlock: "latest",
                }),
                goliathPublicClient.getContractEvents({
                    address: stXcnAddress,
                    abi: stakedXcnAbi,
                    eventName: "Unstaked",
                    args: { user: address },
                    fromBlock: 0n,
                    toBlock: "latest",
                }),
            ]);

            const staked: GoliathStakingEvent[] = stakedLogs.map((log, i) => ({
                id: `staked-${log.transactionHash}-${i}`,
                type: "staked" as const,
                transactionHash: log.transactionHash,
                blockNumber: log.blockNumber,
                amount: formatEther(log.args.xcnAmount ?? 0n),
            }));

            const unstaked: GoliathStakingEvent[] = unstakedLogs.map(
                (log, i) => ({
                    id: `unstaked-${log.transactionHash}-${i}`,
                    type: "unstaked" as const,
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    amount: formatEther(log.args.xcnReturned ?? 0n),
                })
            );

            return [...staked, ...unstaked].sort(
                (a, b) => Number(b.blockNumber - a.blockNumber)
            );
        },
        enabled: !!address,
        refetchInterval: 30000,
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
        sortField,
        sortDirection,
        handlePageChange,
        handleSortChange,
    };
}
