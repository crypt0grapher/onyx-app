"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { mainnet } from "wagmi/chains";
import { useQuery } from "@tanstack/react-query";
import {
    formatToUiProposal,
    readOnChainStates,
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
    const publicClient = usePublicClient({ chainId: mainnet.id });

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
            const stateMap = await readOnChainStates(
                raws as unknown as RawProposal[],
                publicClient
            );
            const formatted = await Promise.all(
                raws.map((p) =>
                    formatToUiProposal(
                        p as unknown as RawProposal,
                        publicClient,
                        stateMap.get(p.id as string)
                    )
                )
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

    const [enrichedData, setEnrichedData] = useState<{
        forPageSlice: UiProposal[];
        forAddress: string | undefined;
        enriched: UiProposal[];
    }>({
        forPageSlice: [],
        forAddress: undefined,
        enriched: [],
    });

    useEffect(() => {
        const enrichVotes = async () => {
            if (!publicClient || !address || pageSlice.length === 0) {
                setEnrichedData({
                    forPageSlice: pageSlice,
                    forAddress: address,
                    enriched: pageSlice,
                });
                return;
            }

            try {
                const calls = pageSlice.map((p) => ({
                    address: CONTRACTS.governorBravoDelegator.address,
                    abi: CONTRACTS.governorBravoDelegator.abi as never,
                    functionName: "getReceipt",
                    args: [BigInt(p.proposalId), address],
                }));

                const results = await publicClient.multicall({
                    contracts: calls as never,
                    allowFailure: true,
                });

                type MulticallResult =
                    | { status: "success"; result?: unknown }
                    | { status: "failure"; error: Error };

                const enriched: UiProposal[] = pageSlice.map((p, i) => {
                    const multicallResult = results[i] as MulticallResult;

                    if (multicallResult.status !== "success") {
                        console.warn(
                            `Failed to get vote receipt for proposal ${p.proposalId}`
                        );
                        return p;
                    }

                    const receipt = multicallResult.result as
                        | {
                              hasVoted?: boolean;
                              support?: boolean;
                              votes?: bigint;
                          }
                        | undefined;

                    const voted = receipt?.hasVoted ?? false;

                    return {
                        ...p,
                        userVoteStatus: (voted
                            ? "You Have Voted"
                            : "You Have Not Voted") as UiProposal["userVoteStatus"],
                    };
                });

                setEnrichedData({
                    forPageSlice: pageSlice,
                    forAddress: address,
                    enriched: enriched,
                });
            } catch (error) {
                console.error("Error enriching vote statuses:", error);
                setEnrichedData({
                    forPageSlice: pageSlice,
                    forAddress: address,
                    enriched: pageSlice,
                });
            }
        };

        enrichVotes();
    }, [publicClient, address, pageSlice]);

    const needsReEnrichment =
        enrichedData.forPageSlice !== pageSlice ||
        enrichedData.forAddress !== address;

    return {
        proposals: needsReEnrichment ? [] : enrichedData.enriched,
        total: filteredAll.length,
        isLoading: isLoading || isFetching || hydrating || needsReEnrichment,
        isError,
        refetch,
    };
};

export default useProposals;
