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
import type { UnifiedHistoryItem } from "@/types/history";
import { formatXcnAmountFromWei } from "@/utils/amount";
import { formatRelativeTimeFromSeconds } from "@/utils/time";
import { buildEtherscanUrl } from "@/utils/explorer";
import TableEmptyState from "@/components/ui/table/TableEmptyState";

const ITEMS_PER_PAGE = 15;

// ---------------------------------------------------------------------------
// Type helpers -- detect whether an item is subgraph or unified
// ---------------------------------------------------------------------------

type AnyHistoryItem = HistoryItem | UnifiedHistoryItem;

function isUnifiedItem(item: AnyHistoryItem): item is UnifiedHistoryItem {
    return "txHash" in item && "network" in item;
}

/** Format a pre-formatted unified amount for display (amount is already human-readable). */
function formatUnifiedAmount(item: UnifiedHistoryItem): string {
    const num = Number(item.amount);
    if (!Number.isFinite(num)) return "--";
    const formatted = num.toLocaleString("en-US", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    });
    return `${formatted} ${item.tokenSymbol}`;
}

/** Normalise common fields for rendering regardless of source type. */
function getItemFields(item: AnyHistoryItem) {
    if (isUnifiedItem(item)) {
        return {
            id: item.id,
            type: item.type,
            txHash: item.txHash ?? "",
            blockNumber: "",
            from: item.from,
            to: item.to,
            amount: item.amount,
            displayAmount: formatUnifiedAmount(item),
            timestamp: String(item.timestamp),
            explorerUrl: item.explorerUrl,
        };
    }
    return {
        id: item.id,
        type: item.type,
        txHash: item.transactionHash,
        blockNumber: item.blockNumber,
        from: item.from,
        to: item.to,
        amount: item.amount,
        displayAmount: formatXcnAmountFromWei(item.amount),
        timestamp: item.blockTimestamp,
        explorerUrl: buildEtherscanUrl(item.transactionHash, "tx"),
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type HistoryTableProps = {
    items: AnyHistoryItem[];
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

    /** Resolve a translation key for the event type, falling back to the
     *  common.events namespace first and history.types second. */
    const getTypeLabel = (rawType: string): string => {
        const key = rawType.toLowerCase();
        // Try common.events — first with original casing (camelCase keys
        // like "liquidStake"), then lowercased (subgraph types like "stake")
        for (const k of [rawType, key]) {
            try {
                return evT(k);
            } catch {
                // Fall through
            }
        }
        // Then try history.types (includes bridge, swap, unstake, etc.)
        try {
            return t(`types.${key}`);
        } catch {
            return capitalizeType(rawType);
        }
    };

    const formatCellData = (transaction: AnyHistoryItem) => {
        const fields = getItemFields(transaction);
        const typeLabel = getTypeLabel(fields.type);

        return [
            {
                content: (
                    <div className="flex items-center gap-2">
                        <Image
                            src={getEventIcon(capitalizeType(fields.type))}
                            alt={fields.type}
                            width={20}
                            height={20}
                            className="opacity-60"
                        />
                        <span>{typeLabel}</span>
                    </div>
                ),
                isType: true,
                className: tableHeaders[0].className,
            },
            {
                content: fields.txHash ? (
                    <ExternalLink href={fields.explorerUrl}>
                        <span>{truncateAddress(fields.txHash)}</span>
                    </ExternalLink>
                ) : (
                    <span className="text-secondary">--</span>
                ),
                className: tableHeaders[1].className,
            },
            {
                content: fields.blockNumber
                    ? Number(fields.blockNumber).toLocaleString()
                    : "--",
                className: tableHeaders[2].className,
            },
            {
                content: fields.from ? (
                    <ExternalLink
                        href={
                            isUnifiedItem(transaction)
                                ? transaction.explorerUrl
                                    ? transaction.explorerUrl.replace(
                                          /\/tx\/.*$/,
                                          `/address/${fields.from}`,
                                      )
                                    : "#"
                                : buildEtherscanUrl(fields.from, "address")
                        }
                    >
                        <span>{truncateAddress(fields.from)}</span>
                    </ExternalLink>
                ) : (
                    <span className="text-secondary">--</span>
                ),
                className: tableHeaders[3].className,
            },
            {
                content: fields.to ? (
                    <ExternalLink
                        href={
                            isUnifiedItem(transaction)
                                ? transaction.explorerUrl
                                    ? transaction.explorerUrl.replace(
                                          /\/tx\/.*$/,
                                          `/address/${fields.to}`,
                                      )
                                    : "#"
                                : buildEtherscanUrl(fields.to, "address")
                        }
                    >
                        <span>{truncateAddress(fields.to)}</span>
                    </ExternalLink>
                ) : (
                    <span className="text-secondary">--</span>
                ),
                className: tableHeaders[4].className,
            },
            {
                content: fields.displayAmount,
                textColor: "#E6E6E6",
                className: tableHeaders[5].className,
            },
            {
                content: formatRelativeTimeFromSeconds(
                    fields.timestamp,
                    timeT,
                ),
                className: tableHeaders[6].className,
            },
        ];
    };

    const formatMobileRowDetails = (transaction: AnyHistoryItem) => {
        const fields = getItemFields(transaction);

        return [
            {
                label: t("from"),
                value: fields.from ? (
                    <ExternalLink
                        href={
                            isUnifiedItem(transaction)
                                ? transaction.explorerUrl
                                    ? transaction.explorerUrl.replace(
                                          /\/tx\/.*$/,
                                          `/address/${fields.from}`,
                                      )
                                    : "#"
                                : buildEtherscanUrl(fields.from, "address")
                        }
                    >
                        <span>{truncateAddress(fields.from)}</span>
                    </ExternalLink>
                ) : (
                    "--"
                ),
            },
            {
                label: t("to"),
                value: fields.to ? (
                    <ExternalLink
                        href={
                            isUnifiedItem(transaction)
                                ? transaction.explorerUrl
                                    ? transaction.explorerUrl.replace(
                                          /\/tx\/.*$/,
                                          `/address/${fields.to}`,
                                      )
                                    : "#"
                                : buildEtherscanUrl(fields.to, "address")
                        }
                    >
                        <span>{truncateAddress(fields.to)}</span>
                    </ExternalLink>
                ) : (
                    "--"
                ),
            },
            {
                label: t("txnHash"),
                value: fields.txHash ? (
                    <ExternalLink href={fields.explorerUrl}>
                        <span>{truncateAddress(fields.txHash)}</span>
                    </ExternalLink>
                ) : (
                    "--"
                ),
            },
            {
                label: t("block"),
                value: fields.blockNumber
                    ? Number(fields.blockNumber).toLocaleString()
                    : "--",
            },
            {
                label: t("created"),
                value: formatRelativeTimeFromSeconds(
                    fields.timestamp,
                    timeT,
                ),
            },
        ];
    };

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
                        items.map(
                            (transaction: AnyHistoryItem, index: number) => (
                                <TableRow
                                    key={transaction.id}
                                    cells={formatCellData(transaction)}
                                    isLastRow={index === items.length - 1}
                                />
                            ),
                        )}
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
                        items.map((transaction: AnyHistoryItem) => {
                            const fields = getItemFields(transaction);
                            const typeLabel = getTypeLabel(fields.type);

                            return (
                                <MobileTableRow
                                    key={transaction.id}
                                    type={
                                        <div className="flex items-center gap-2">
                                            <Image
                                                src={getEventIcon(
                                                    capitalizeType(fields.type),
                                                )}
                                                alt={fields.type}
                                                width={20}
                                                height={20}
                                                className="opacity-60"
                                            />
                                            <span className="text-primary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                                {typeLabel}
                                            </span>
                                        </div>
                                    }
                                    amount={fields.displayAmount}
                                    details={formatMobileRowDetails(
                                        transaction,
                                    )}
                                />
                            );
                        })}
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
