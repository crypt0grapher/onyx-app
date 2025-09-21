"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Table from "@/components/ui/table/Table";
import TableHeader from "@/components/ui/table/TableHeader";
import TableRow from "@/components/ui/table/TableRow";
import MobileTableHeader from "@/components/ui/table/MobileTableHeader";
import MobileTableRow from "@/components/ui/table/MobileTableRow";
import Pagination from "@/components/ui/table/Pagination";
import ExternalLink from "@/components/ui/common/ExternalLink";
import { STAKING_HISTORY_SCOPE } from "@/config/stakingHistory";
import { ITEMS_PER_PAGE } from "@/config/historyTransactions";
import Image from "next/image";
import { getEventIcon } from "@/utils/events";
import { truncateAddress } from "@/utils/address";
import { useStakingHistory } from "@/hooks/staking/useStakingHistory";
import type { HistoryItem } from "@/lib/api/services/subgraph";
import { formatXcnAmountFromWei } from "@/utils/amount";
import { formatRelativeTimeFromSeconds } from "@/utils/time";
import { buildExplorerUrl } from "@/utils/explorer";
import { capitalizeType } from "@/utils/string";
import TableEmptyState from "@/components/ui/table/TableEmptyState";

const StakingHistoryTable: React.FC = () => {
    const t = useTranslations("staking.history");
    const tableT = useTranslations("staking.table");
    const evT = useTranslations("common.events");
    const timeT = useTranslations("time");

    const {
        items,
        currentPage,
        totalPages,
        startItem,
        endItem,
        totalItems,
        isLoading,
        sortField,
        sortDirection,
        handlePageChange,
        handleSortChange,
    } = useStakingHistory(STAKING_HISTORY_SCOPE);

    const tableHeaders = [
        {
            label: tableT("type"),
            sortable: true,
            className: "w-[120px]",
            field: "type",
        },
        {
            label: tableT("txnHash"),
            sortable: true,
            className: "w-[120px]",
            field: "transactionHash",
        },
        {
            label: tableT("block"),
            sortable: true,
            className: "w-[120px]",
            field: "blockNumber",
        },
        {
            label: tableT("amount"),
            sortable: true,
            className: "w-[156px] ml-auto",
            field: "amount",
        },
        {
            label: tableT("created"),
            sortable: true,
            className: "w-[120px]",
            field: "blockTimestamp",
        },
    ];

    const formatCellData = (event: HistoryItem) => [
        {
            content: (
                <div className="flex items-center gap-2">
                    <Image
                        src={getEventIcon(capitalizeType(String(event.type)))}
                        alt={String(event.type)}
                        width={20}
                        height={20}
                        className="opacity-60"
                    />
                    <span>{evT(String(event.type).toLowerCase())}</span>
                </div>
            ),
            isType: true,
            className: tableHeaders[0].className,
        },
        {
            content: (
                <ExternalLink
                    href={buildExplorerUrl(event.transactionHash, "tx")}
                >
                    <span>{truncateAddress(event.transactionHash)}</span>
                </ExternalLink>
            ),
            className: tableHeaders[1].className,
        },
        {
            content: Number(event.blockNumber).toLocaleString(),
            className: tableHeaders[2].className,
        },
        {
            content: formatXcnAmountFromWei(event.amount),
            textColor: "#E6E6E6",
            className: tableHeaders[3].className,
        },
        {
            content: formatRelativeTimeFromSeconds(event.blockTimestamp, timeT),
            className: tableHeaders[4].className,
        },
    ];

    const formatMobileRowDetails = (event: HistoryItem) => [
        {
            label: t("created"),
            value: formatRelativeTimeFromSeconds(event.blockTimestamp, timeT),
        },
        {
            label: t("txnHash"),
            value: (
                <ExternalLink
                    href={buildExplorerUrl(event.transactionHash, "tx")}
                >
                    <span>{truncateAddress(event.transactionHash)}</span>
                </ExternalLink>
            ),
        },
        {
            label: t("block"),
            value: Number(event.blockNumber).toLocaleString(),
        },
    ];

    return (
        <div className="w-full">
            <div className="hidden md:block">
                <Table
                    className="w-full min-w-[800px]"
                    enableHorizontalScroll={true}
                >
                    <TableHeader
                        columns={tableHeaders}
                        sortField={sortField as string}
                        sortDirection={sortDirection}
                        onSortChange={(field) =>
                            handleSortChange(field as keyof HistoryItem)
                        }
                    />
                    {isLoading &&
                        Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                            <TableRow
                                key={`skeleton-${i}`}
                                cells={tableHeaders.map((h) => ({
                                    content: (
                                        <span
                                            className={`inline-block h-[16px] leading-[20px] bg-[#1F1F1F] rounded animate-pulse ${
                                                h.className?.includes(
                                                    "w-[156px]"
                                                )
                                                    ? "w-32"
                                                    : h.className?.includes(
                                                          "w-[120px]"
                                                      )
                                                    ? "w-24"
                                                    : "w-20"
                                            }`}
                                        />
                                    ),
                                    className: h.className,
                                }))}
                                isLastRow={i === ITEMS_PER_PAGE - 1}
                            />
                        ))}

                    {!isLoading && items.length === 0 && (
                        <TableEmptyState
                            title={t("historyTitle") || "Empty History"}
                            description={
                                <>
                                    {tableT("empty.descriptionLine1")}
                                    <br />
                                    {tableT("empty.descriptionLine2")}
                                </>
                            }
                        />
                    )}

                    {!isLoading &&
                        items.length > 0 &&
                        items.map((event, index) => (
                            <TableRow
                                key={(event as HistoryItem).id}
                                cells={formatCellData(event as HistoryItem)}
                                isLastRow={index === items.length - 1}
                            />
                        ))}
                </Table>
            </div>

            <div className="block md:hidden">
                <div className="rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                    <MobileTableHeader
                        typeLabel={tableT("type")}
                        amountLabel={tableT("amount")}
                        sortField={sortField as string}
                        sortDirection={sortDirection}
                        onSortChange={(field) =>
                            handleSortChange(field as keyof HistoryItem)
                        }
                    />
                </div>

                <div className="mt-2 space-y-2">
                    {isLoading &&
                        Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                            <MobileTableRow
                                key={`skeleton-${i}`}
                                type={
                                    <span className="inline-block h-[16px] leading-[20px] w-40 bg-[#1F1F1F] rounded animate-pulse" />
                                }
                                amount={"--"}
                                details={[]}
                            />
                        ))}

                    {!isLoading && items.length === 0 && (
                        <div className="rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                            <TableEmptyState
                                title={t("historyTitle") || "Empty History"}
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
                        items.length > 0 &&
                        items.map((event) => (
                            <MobileTableRow
                                key={(event as HistoryItem).id}
                                type={
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={getEventIcon(
                                                capitalizeType(
                                                    String(
                                                        (event as HistoryItem)
                                                            .type
                                                    )
                                                )
                                            )}
                                            alt={String(
                                                (event as HistoryItem).type
                                            )}
                                            width={20}
                                            height={20}
                                            className="opacity-60"
                                        />
                                        <span className="text-[#E6E6E6] text-sm font-medium leading-5 font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                            {evT(
                                                String(
                                                    (event as HistoryItem).type
                                                ).toLowerCase()
                                            )}
                                        </span>
                                    </div>
                                }
                                amount={formatXcnAmountFromWei(
                                    (event as HistoryItem).amount
                                )}
                                details={formatMobileRowDetails(
                                    event as HistoryItem
                                )}
                            />
                        ))}
                </div>
            </div>

            {!isLoading && items.length > 0 && (
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

export default StakingHistoryTable;
