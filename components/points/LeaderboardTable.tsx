"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Table from "@/components/ui/table/Table";
import TableHeader from "@/components/ui/table/TableHeader";
import TableRow from "@/components/ui/table/TableRow";
import MobileTableHeader from "@/components/ui/table/MobileTableHeader";
import MobileTableRow from "@/components/ui/table/MobileTableRow";
import Pagination from "@/components/ui/table/Pagination";
import ExternalLink from "@/components/ui/common/ExternalLink";
import PlaceBig from "@/components/ui/pills/PlaceBig";
import TableEmptyState from "@/components/ui/table/TableEmptyState";
import { useLeaderboard } from "@/hooks/points/useLeaderboard";
import { buildExplorerUrl } from "@/utils/explorer";
import { truncateAddress } from "@/utils/address";
import LoadingDots from "@/components/ui/common/LoadingDots";

const LeaderboardTable: React.FC = () => {
    const tableT = useTranslations("points.leaderboard");
    const [currentPage, setCurrentPage] = useState(1);

    const tableHeaders = [
        { label: tableT("place"), sortable: true, className: "w-[80px]" },
        {
            label: tableT("userAddress"),
            sortable: true,
            className: "w-[200px]",
        },
        {
            label: tableT("amount"),
            sortable: true,
            className: "w-[200px] ml-auto",
        },
    ];

    const PAGE_LIMIT = 10;
    const SKIP_TOP = 3;
    const { data, isLoading } = useLeaderboard({
        page: currentPage,
        limit: PAGE_LIMIT,
        skipTop: SKIP_TOP,
    });
    const currentItems = data?.results || [];
    const totalPages = data?.meta.totalPages || 0;
    const totalItems = data?.meta.total || 0;
    const startItem = (currentPage - 1) * PAGE_LIMIT + 1 + SKIP_TOP;
    const endItem = Math.min(startItem + PAGE_LIMIT - 1, totalItems + SKIP_TOP);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const formatCellData = (
        entry: { id: string; address: string; points: number },
        index: number
    ) => [
        {
            content: (
                <PlaceBig>
                    #{SKIP_TOP + (currentPage - 1) * PAGE_LIMIT + index + 1}
                </PlaceBig>
            ),
            isType: true,
            className: tableHeaders[0].className,
        },
        {
            content: (
                <ExternalLink href={buildExplorerUrl(entry.address, "address")}>
                    <span>{truncateAddress(entry.address)}</span>
                </ExternalLink>
            ),
            className: tableHeaders[1].className,
        },
        {
            content: Number(entry.points).toLocaleString("en-US", {
                maximumFractionDigits: 2,
            }),
            textColor: "#E6E6E6",
            className: tableHeaders[2].className,
        },
    ];

    const formatMobileRowDetails = (
        entry: { id: string; address: string; points: number },
        index: number
    ) => [
        {
            label: tableT("place"),
            value: (
                <PlaceBig>
                    #{SKIP_TOP + (currentPage - 1) * PAGE_LIMIT + index + 1}
                </PlaceBig>
            ),
        },
        {
            label: tableT("userAddress"),
            value: (
                <ExternalLink href={buildExplorerUrl(entry.address, "address")}>
                    <span>{truncateAddress(entry.address)}</span>
                </ExternalLink>
            ),
        },
    ];

    return (
        <div className="w-full">
            <div className="hidden md:block">
                <Table
                    className="w-full min-w-[500px]"
                    enableHorizontalScroll={true}
                >
                    <TableHeader columns={tableHeaders} />
                    {isLoading &&
                        Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                            <TableRow
                                key={`skeleton-${i}`}
                                cells={tableHeaders.map((h) => ({
                                    content: (
                                        <span
                                            className={`inline-block h-[16px] leading-[20px] bg-[#1F1F1F] rounded animate-pulse ${
                                                h.className?.includes(
                                                    "w-[200px]"
                                                )
                                                    ? "w-40"
                                                    : h.className?.includes(
                                                          "w-[80px]"
                                                      )
                                                    ? "w-16"
                                                    : "w-24"
                                            }`}
                                        />
                                    ),
                                    className: h.className,
                                }))}
                                isLastRow={i === PAGE_LIMIT - 1}
                            />
                        ))}
                    {!isLoading && currentItems.length === 0 ? (
                        <TableEmptyState
                            title={tableT("empty.title")}
                            description={
                                <>
                                    {tableT("empty.descriptionLine1")}
                                    <br />
                                    {tableT("empty.descriptionLine2")}
                                </>
                            }
                        />
                    ) : (
                        !isLoading &&
                        currentItems.map((entry, index) => (
                            <TableRow
                                key={entry.id}
                                cells={formatCellData(entry, index)}
                                isLastRow={index === currentItems.length - 1}
                            />
                        ))
                    )}
                </Table>
            </div>

            <div className="block md:hidden">
                <div className="rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                    <MobileTableHeader
                        typeLabel={tableT("place")}
                        amountLabel={tableT("amount")}
                    />
                </div>
                <div className="mt-2 space-y-2">
                    {isLoading &&
                        Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                            <MobileTableRow
                                key={`skeleton-${i}`}
                                type={
                                    <LoadingDots size="md" variant="inline" />
                                }
                                amount={"--"}
                                details={[]}
                            />
                        ))}

                    {!isLoading && currentItems.length === 0 && (
                        <div className="rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                            <TableEmptyState
                                title={tableT("empty.title")}
                                description={
                                    <>
                                        {tableT("empty.descriptionLine1")}
                                        <br />
                                        {tableT("empty.descriptionLine2")}
                                    </>
                                }
                                className="px-[16px]"
                            />
                        </div>
                    )}

                    {!isLoading &&
                        currentItems.length > 0 &&
                        currentItems.map((entry, index) => (
                            <MobileTableRow
                                key={entry.id}
                                type={
                                    <PlaceBig>
                                        #
                                        {SKIP_TOP +
                                            (currentPage - 1) * PAGE_LIMIT +
                                            index +
                                            1}
                                    </PlaceBig>
                                }
                                amount={Number(entry.points).toLocaleString(
                                    "en-US",
                                    { maximumFractionDigits: 2 }
                                )}
                                details={formatMobileRowDetails(entry, index)}
                            />
                        ))}
                </div>
            </div>

            {!isLoading && currentItems.length > 0 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        startItem={startItem}
                        endItem={endItem}
                        totalItems={totalItems}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default LeaderboardTable;
