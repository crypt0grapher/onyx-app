"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import {
    formatToUiProposal,
    type RawProposal,
    type UiProposal,
} from "@/lib/governance/format";
import { CONTRACTS } from "@/contracts";
import { SubgraphService } from "@/lib/api";

export type UseProposalsParams = {
    page?: number;
    limit?: number;
    searchQuery?: string;
    statusFilter?: string;
};

type ProposalsResponse = {
    proposals: RawProposal[];
    proposalCounts: Array<{ count: string }>;
};

export const useProposals = (params: UseProposalsParams = {}) => {
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const page = params.page ?? 1;
    const limit = params.limit ?? 4;
    const searchQuery = params.searchQuery?.trim().toLowerCase() ?? "";
    const statusFilter = params.statusFilter ?? "all-statuses";

    const FETCH_BATCH = Math.max(limit * 5, 100);

    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ["gov-proposals", FETCH_BATCH],
        enabled: Boolean(publicClient),
        queryFn: async () => {
            const service = new SubgraphService();
            const res = await service.getProposals(FETCH_BATCH, 0);
            return res as ProposalsResponse;
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    const [allUiProposals, setAllUiProposals] = useState<UiProposal[]>([]);
    const [hydrating, setHydrating] = useState<boolean>(true);

    useEffect(() => {
        const run = async () => {
            if (!data || !publicClient) return;
            setHydrating(true);
            const raws = data.proposals;
            const formatted = await Promise.all(
                raws.map((p) => formatToUiProposal(p, publicClient))
            );
            setAllUiProposals(formatted);
            setHydrating(false);
        };
        run();
    }, [data, publicClient]);

    const filteredAll = useMemo(() => {
        let list = allUiProposals;
        if (searchQuery) {
            list = list.filter(
                (p) =>
                    p.title.toLowerCase().includes(searchQuery) ||
                    p.description.toLowerCase().includes(searchQuery) ||
                    p.type.toLowerCase().includes(searchQuery)
            );
        }
        if (statusFilter !== "all-statuses") {
            list = list.filter(
                (p) => p.status === (statusFilter as UiProposal["status"])
            );
        }
        return list;
    }, [allUiProposals, searchQuery, statusFilter]);

    const pageSlice = useMemo(() => {
        const requestedOffset = (page - 1) * limit;
        const clampedOffset =
            filteredAll.length === 0
                ? 0
                : Math.min(
                      requestedOffset,
                      Math.max(filteredAll.length - limit, 0)
                  );
        return filteredAll.slice(clampedOffset, clampedOffset + limit);
    }, [filteredAll, page, limit]);

    const [enrichedPage, setEnrichedPage] = useState<UiProposal[]>([]);

    useEffect(() => {
        setEnrichedPage(pageSlice);
    }, [pageSlice]);

    useEffect(() => {
        const enrichVotes = async () => {
            if (!publicClient || !address || pageSlice.length === 0) return;
            try {
                const calls = pageSlice.map((p) => ({
                    address: CONTRACTS.governorBravoDelegator.address,
                    abi: CONTRACTS.governorBravoDelegator.abi as never,
                    functionName: "getReceipt",
                    args: [BigInt(p.proposalId), address],
                }));
                const { results } = await publicClient.multicall({
                    contracts: calls as never,
                    allowFailure: true,
                });
                setEnrichedPage((prev) =>
                    prev.map((p, i) => {
                        const receipt = (
                            results?.[i] as { result?: unknown } | undefined
                        )?.result as
                            | {
                                  hasVoted?: boolean;
                                  support?: boolean;
                                  votes?: bigint;
                              }
                            | undefined;
                        const voted = receipt?.hasVoted;
                        return {
                            ...p,
                            userVoteStatus: voted
                                ? "You Voted"
                                : "You Not Voted",
                        };
                    })
                );
            } catch {}
        };
        enrichVotes();
    }, [publicClient, address, pageSlice]);

    return {
        proposals: enrichedPage,
        total: filteredAll.length,
        isLoading: isLoading || isFetching || hydrating,
        isError,
        refetch,
    };
};

export default useProposals;
