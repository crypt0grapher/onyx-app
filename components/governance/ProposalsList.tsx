import React, { useState, useMemo, useEffect } from "react";
import ProposalCard from "./ProposalCard";
import Pagination from "@/components/ui/table/Pagination";
import { PROPOSALS_PER_PAGE } from "@/config/governance";
import { useProposals } from "@/hooks/governance/useProposals";
import ProposalCardSkeleton from "./ProposalCardSkeleton";

interface ProposalsListProps {
    searchQuery?: string;
    statusFilter?: string;
}

const ProposalsList: React.FC<ProposalsListProps> = ({
    searchQuery = "",
    statusFilter = "all-statuses",
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const { proposals, total, isLoading } = useProposals({
        page: currentPage,
        limit: PROPOSALS_PER_PAGE,
        searchQuery,
        statusFilter,
    });

    const visibleProposals = useMemo(() => {
        let list = proposals;
        const q = (searchQuery || "").toLowerCase();
        if (q) {
            list = list.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.type.toLowerCase().includes(q)
            );
        }
        if (statusFilter && statusFilter !== "all-statuses") {
            list = list.filter((p) => p.status === statusFilter);
        }
        return list;
    }, [proposals, searchQuery, statusFilter]);

    const totalItems = total || proposals.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PROPOSALS_PER_PAGE));
    const startIndex = (currentPage - 1) * PROPOSALS_PER_PAGE;
    const endIndex = startIndex + PROPOSALS_PER_PAGE;

    const startItem = totalItems > 0 ? startIndex + 1 : 0;
    const endItem = Math.min(endIndex, totalItems);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const [prevNonEmpty, setPrevNonEmpty] = useState<typeof proposals>([]);
    useEffect(() => {
        if (proposals.length > 0) setPrevNonEmpty(proposals);
    }, [proposals]);

    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-4">
                {isLoading ? (
                    Array.from({ length: PROPOSALS_PER_PAGE }).map((_, i) => (
                        <ProposalCardSkeleton key={`proposal-skeleton-${i}`} />
                    ))
                ) : visibleProposals.length > 0 ? (
                    visibleProposals.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                    ))
                ) : prevNonEmpty.length > 0 ? (
                    prevNonEmpty.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                    ))
                ) : (
                    <div className="flex p-4 flex-col items-center justify-center gap-2 rounded-[8px] border border-[#1F1F1F] bg-[#141414] min-h-[120px]">
                        <p className="text-secondary text-center">
                            No proposals found matching your criteria.
                        </p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    startItem={startItem}
                    endItem={endItem}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                    className="mt-4"
                />
            )}
        </div>
    );
};

export default ProposalsList;
