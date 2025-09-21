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
import Image from "next/image";
import { getEventIcon } from "@/utils/events";
import { truncateAddress } from "@/utils/address";
import { capitalizeType } from "@/utils/string";
import type { HistoryItem } from "@/lib/api/services/subgraph";
import { formatXcnAmountFromWei } from "@/utils/amount";
import { formatRelativeTimeFromSeconds } from "@/utils/time";
import { buildExplorerUrl } from "@/utils/explorer";
import TableEmptyState from "@/components/ui/table/TableEmptyState";

const ITEMS_PER_PAGE = 15;

export type HistoryTableProps = {
    items: HistoryItem[];
    currentPage: number;
    totalPages: number;
    startItem: number;
    endItem: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    sortField?: keyof HistoryItem;
    sortDirection?: "asc" | "desc";
    onSortChange?: (field: keyof HistoryItem) => void;
};

const HistoryTable: React.FC<HistoryTableProps> = ({
    items,
    currentPage,
    totalPages,
    startItem,
    endItem,
    totalItems,
    onPageChange,
    isLoading = false,
    sortField = "blockTimestamp",
    sortDirection = "desc",
    onSortChange,
}) => {
    const t = useTranslations("history");
    const tableT = useTranslations("history.table");
    const evT = useTranslations("common.events");
    const timeT = useTranslations("time");

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
            label: tableT("from"),
            sortable: true,
            className: "w-[120px]",
            field: "from",
        },
        {
            label: tableT("to"),
            sortable: true,
            className: "w-[120px]",
            field: "to",
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

    const createSkeletonCells = (headers: { className?: string }[]) =>
        headers.map((header) => ({
            content: (
                <span
                    className={`inline-block h-[16px] leading-[20px] bg-[#1F1F1F] rounded animate-pulse ${
                        header.className?.includes("w-[156px]")
                            ? "w-32"
                            : header.className?.includes("w-[120px]")
                            ? "w-24"
                            : "w-20"
                    }`}
                />
            ),
            className: header.className,
        }));

    const formatCellData = (transaction: HistoryItem) => [
        {
            content: (
                <div className="flex items-center gap-2">
                    <Image
                        src={getEventIcon(capitalizeType(transaction.type))}
                        alt={transaction.type}
                        width={20}
                        height={20}
                        className="opacity-60"
                    />
                    <span>{evT(String(transaction.type).toLowerCase())}</span>
                </div>
            ),
            isType: true,
            className: tableHeaders[0].className,
        },
        {
            content: (
                <ExternalLink
                    href={buildExplorerUrl(transaction.transactionHash, "tx")}
                >
                    <span>{truncateAddress(transaction.transactionHash)}</span>
                </ExternalLink>
            ),
            className: tableHeaders[1].className,
        },
        {
            content: Number(transaction.blockNumber).toLocaleString(),
            className: tableHeaders[2].className,
        },
        {
            content: (
                <ExternalLink
                    href={buildExplorerUrl(transaction.from, "address")}
                >
                    <span>{truncateAddress(transaction.from)}</span>
                </ExternalLink>
            ),
            className: tableHeaders[3].className,
        },
        {
            content: (
                <ExternalLink
                    href={buildExplorerUrl(transaction.to, "address")}
                >
                    <span>{truncateAddress(transaction.to)}</span>
                </ExternalLink>
            ),
            className: tableHeaders[4].className,
        },
        {
            content: formatXcnAmountFromWei(transaction.amount),
            textColor: "#E6E6E6",
            className: tableHeaders[5].className,
        },
        {
            content: formatRelativeTimeFromSeconds(
                transaction.blockTimestamp,
                timeT
            ),
            className: tableHeaders[6].className,
        },
    ];

    const formatMobileRowDetails = (transaction: HistoryItem) => [
        {
            label: t("from"),
            value: (
                <ExternalLink
                    href={buildExplorerUrl(transaction.from, "address")}
                >
                    <span>{truncateAddress(transaction.from)}</span>
                </ExternalLink>
            ),
        },
        {
            label: t("to"),
            value: (
                <ExternalLink
                    href={buildExplorerUrl(transaction.to, "address")}
                >
                    <span>{truncateAddress(transaction.to)}</span>
                </ExternalLink>
            ),
        },
        {
            label: t("txnHash"),
            value: (
                <ExternalLink
                    href={buildExplorerUrl(transaction.transactionHash, "tx")}
                >
                    <span>{truncateAddress(transaction.transactionHash)}</span>
                </ExternalLink>
            ),
        },
        {
            label: t("block"),
            value: Number(transaction.blockNumber).toLocaleString(),
        },
        {
            label: t("created"),
            value: formatRelativeTimeFromSeconds(
                transaction.blockTimestamp,
                timeT
            ),
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
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSortChange={(field) =>
                            onSortChange?.(field as keyof HistoryItem)
                        }
                    />
                    {isLoading &&
                        Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                            <TableRow
                                key={`skeleton-${i}`}
                                cells={createSkeletonCells(tableHeaders)}
                                isLastRow={i === ITEMS_PER_PAGE - 1}
                            />
                        ))}

                    {!isLoading && items.length === 0 && (
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
                    )}

                    {!isLoading &&
                        items.length > 0 &&
                        items.map((transaction: unknown, index: number) => (
                            <TableRow
                                key={(transaction as HistoryItem).id}
                                cells={formatCellData(
                                    transaction as HistoryItem
                                )}
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
                            onSortChange?.(field as keyof HistoryItem)
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
                        items.length > 0 &&
                        items.map((transaction: unknown) => (
                            <MobileTableRow
                                key={(transaction as HistoryItem).id}
                                type={
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={getEventIcon(
                                                capitalizeType(
                                                    (transaction as HistoryItem)
                                                        .type
                                                )
                                            )}
                                            alt={
                                                (transaction as HistoryItem)
                                                    .type
                                            }
                                            width={20}
                                            height={20}
                                            className="opacity-60"
                                        />
                                        <span className="text-primary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                            {t(
                                                `types.${String(
                                                    (transaction as HistoryItem)
                                                        .type
                                                ).toLowerCase()}`
                                            )}
                                        </span>
                                    </div>
                                }
                                amount={formatXcnAmountFromWei(
                                    (transaction as HistoryItem).amount
                                )}
                                details={formatMobileRowDetails(
                                    transaction as HistoryItem
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
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default HistoryTable;
