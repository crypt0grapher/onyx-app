"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { useBridgeOperations } from "@/hooks/bridge/useBridgeOperations";
import { adaptLocalSwaps, readLocalSwapRecords } from "./adapters/localSwapAdapter";
import { mergeAndDedup } from "./mergeHistory";
import type {
  UnifiedHistoryItem,
  HistoryNetwork,
  HistoryType,
  HistoryStatus,
} from "@/types/history";
import { getGoliathNetwork } from "@/config/networks";
import { buildExplorerUrl } from "@/utils/explorer";

const ITEMS_PER_PAGE = 20;

export function useUnifiedHistory() {
  const { address } = useAccount();
  const goliathChainId = getGoliathNetwork().chainId;

  // Filters
  const [networkFilter, setNetworkFilter] = useState<HistoryNetwork | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<HistoryType | "all">("all");
  const [userFilter, setUserFilter] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [networkFilter, typeFilter, userFilter, searchQuery]);

  // Sources
  // Bridge operations from localStorage
  const { operations: bridgeOps } = useBridgeOperations();

  // Local swap records from localStorage
  const localSwaps = useMemo(() => {
    if (typeof window === "undefined") return [];
    return readLocalSwapRecords(address);
  }, [address]);

  // Adapt all sources into UnifiedHistoryItem[]
  const allItems = useMemo(() => {
    const items: UnifiedHistoryItem[] = [];

    // Bridge operations
    if (bridgeOps.length > 0) {
      items.push(
        ...bridgeOps.map((op): UnifiedHistoryItem => {
          const status: HistoryStatus = ["COMPLETED"].includes(op.status)
            ? "confirmed"
            : ["FAILED", "EXPIRED"].includes(op.status)
              ? "failed"
              : "pending";

          return {
            id: op.id,
            network:
              op.direction === "SOURCE_TO_GOLIATH"
                ? ("ethereum" as const)
                : ("goliath" as const),
            source: "bridge-api" as const,
            type: "bridge" as const,
            status,
            timestamp: Math.floor(op.createdAt / 1000),
            txHash: op.originTxHash,
            from: op.sender,
            to: op.recipient,
            amount: op.amountHuman,
            amountRaw: op.amountAtomic,
            tokenSymbol: op.token,
            tokenDecimals: op.token === "USDC" ? 6 : 18,
            explorerUrl: op.originTxHash
              ? buildExplorerUrl(op.originTxHash, "tx", op.originChainId)
              : "",
            bridgeDirection: op.direction,
            destinationTxHash: op.destinationTxHash ?? undefined,
            destinationExplorerUrl: op.destinationTxHash
              ? buildExplorerUrl(
                  op.destinationTxHash,
                  "tx",
                  op.destinationChainId,
                )
              : undefined,
          };
        }),
      );
    }

    // Local swaps
    if (localSwaps.length > 0) {
      items.push(...adaptLocalSwaps(localSwaps, goliathChainId));
    }

    return mergeAndDedup(items);
  }, [bridgeOps, localSwaps, goliathChainId]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let items = allItems;

    if (networkFilter !== "all") {
      items = items.filter((item) => item.network === networkFilter);
    }
    if (typeFilter !== "all") {
      items = items.filter((item) => item.type === typeFilter);
    }
    if (userFilter === "my" && address) {
      items = items.filter(
        (item) =>
          item.from.toLowerCase() === address.toLowerCase() ||
          item.to.toLowerCase() === address.toLowerCase(),
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.txHash?.toLowerCase().includes(q) ||
          item.from.toLowerCase().includes(q) ||
          item.to.toLowerCase().includes(q),
      );
    }

    return items;
  }, [allItems, networkFilter, typeFilter, userFilter, address, searchQuery]);

  // Pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleNetworkFilterChange = useCallback(
    (network: HistoryNetwork | "all") => {
      setNetworkFilter(network);
    },
    [],
  );

  const handleTypeFilterChange = useCallback(
    (type: HistoryType | "all") => {
      setTypeFilter(type);
    },
    [],
  );

  const handleUserFilterChange = useCallback((filter: "all" | "my") => {
    setUserFilter(filter);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    items: paginatedItems,
    totalItems,
    totalPages,
    currentPage: page,
    startItem:
      paginatedItems.length > 0
        ? (page - 1) * ITEMS_PER_PAGE + 1
        : 0,
    endItem:
      paginatedItems.length > 0
        ? Math.min(page * ITEMS_PER_PAGE, totalItems)
        : 0,
    isLoading: false,

    networkFilter,
    typeFilter,
    userFilter,
    searchQuery,

    handleNetworkFilterChange,
    handleTypeFilterChange,
    handleUserFilterChange,
    handleSearchChange,
    handlePageChange,
  };
}
