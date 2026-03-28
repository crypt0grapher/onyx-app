"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Table from "@/components/ui/table/Table";
import TableHeader from "@/components/ui/table/TableHeader";
import TableRow from "@/components/ui/table/TableRow";
import MobileTableHeader from "@/components/ui/table/MobileTableHeader";
import MobileTableRow from "@/components/ui/table/MobileTableRow";
import Pagination from "@/components/ui/table/Pagination";
import TableEmptyState from "@/components/ui/table/TableEmptyState";
import ExternalLink from "@/components/ui/common/ExternalLink";
import { truncateAddress } from "@/utils/address";
import { getEventIcon } from "@/utils/events";
import { capitalizeType } from "@/utils/string";
import { buildExplorerUrl } from "@/utils/explorer";
import { getGoliathNetwork } from "@/config/networks";
import {
    useGoliathStakingHistory,
    type GoliathStakingEvent,
} from "@/hooks/goliath-yield/useGoliathStakingHistory";

const SKELETON_COUNT = 10;

const GoliathEmptyIcon: React.FC = () => (
    <svg
        width="136"
        height="136"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 opacity-40"
    >
        <path
            d="M300 30C151.08 30 30 151.08 30 300C30 448.92 151.08 570 300 570C366.3 570 426.3 544.68 471.6 503.4C476.7 498.6 480 492 480 484.5V345H315V414H405V462C376.2 482.4 339.6 495 300 495C192.3 495 105 407.7 105 300C105 192.3 192.3 105 300 105C356.1 105 406.5 128.4 442.2 165.9L495.6 112.5C447.6 62.1 378.6 30 300 30Z"
            fill="#E6E6E6"
            fillOpacity="0.15"
        />
    </svg>
);

/**
 * Format a numeric string (already in ether units) with locale-aware
 * thousands separators and 4 decimal places, appended with " XCN".
 */
function formatAmount(value: string): string {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return "--";
    return (
        num.toLocaleString("en-US", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
        }) + " XCN"
    );
}

const GoliathStakingHistory: React.FC = () => {
    const t = useTranslations("goliathYield.history");
    const evT = useTranslations("common.events");

    const goliathNetwork = getGoliathNetwork();
    const goliathChainId = goliathNetwork.chainId;

    const {
        items,
        currentPage,
        totalPages,
        startItem,
        endItem,
        totalItems,
        isLoading,
        isError,
        refetch,
        sortField,
        sortDirection,
        handlePageChange,
        handleSortChange,
    } = useGoliathStakingHistory();

    const tableHeaders = [
        {
            label: t("type"),
            sortable: true,
            className: "w-[180px]",
            field: "type",
        },
        {
            label: t("txnHash"),
            sortable: true,
            className: "w-[120px]",
            field: "transactionHash",
        },
        {
            label: t("block"),
            sortable: true,
            className: "w-[120px]",
            field: "blockNumber",
        },
        {
            label: t("amount"),
            sortable: true,
            className: "w-[156px] ml-auto",
            field: "amount",
        },
    ];

    const formatCellData = (event: GoliathStakingEvent) => [
        {
            content: (
                <div className="flex items-center gap-2">
                    <Image
                        src={getEventIcon(capitalizeType(event.type))}
                        alt={event.type}
                        width={20}
                        height={20}
                        className="opacity-60"
                    />
                    <span>{evT(event.type)}</span>
                </div>
            ),
            isType: true,
            className: tableHeaders[0].className,
        },
        {
            content: (
                <ExternalLink
                    href={buildExplorerUrl(
                        event.transactionHash,
                        "tx",
                        goliathChainId
                    )}
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
            content: formatAmount(event.amount),
            textColor: "#E6E6E6",
            className: tableHeaders[3].className,
        },
    ];

    const formatMobileRowDetails = (event: GoliathStakingEvent) => [
        {
            label: t("txnHash"),
            value: (
                <ExternalLink
                    href={buildExplorerUrl(
                        event.transactionHash,
                        "tx",
                        goliathChainId
                    )}
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
            {/* Desktop table */}
            <div className="hidden md:block">
                <Table
                    className="w-full min-w-[800px]"
                    enableHorizontalScroll={true}
                >
                    <TableHeader
                        columns={tableHeaders}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSortChange={handleSortChange}
                    />

                    {isLoading &&
                        Array.from({ length: SKELETON_COUNT }).map((_, i) => (
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
                                isLastRow={i === SKELETON_COUNT - 1}
                            />
                        ))}

                    {!isLoading && isError && (
                        <TableEmptyState
                            title={t("errorTitle")}
                            description={
                                <button
                                    type="button"
                                    onClick={() => refetch()}
                                    className="text-blue-400 hover:underline cursor-pointer"
                                >
                                    {t("errorRetry")}
                                </button>
                            }
                            icon={<GoliathEmptyIcon />}
                        />
                    )}

                    {!isLoading && !isError && items.length === 0 && (
                        <TableEmptyState
                            title={t("emptyTitle")}
                            description={
                                <>
                                    {t("emptyDescription")}
                                    <br />
                                    {t("emptyDescriptionLine2")}
                                </>
                            }
                            icon={<GoliathEmptyIcon />}
                        />
                    )}

                    {!isLoading &&
                        items.length > 0 &&
                        items.map((event, index) => (
                            <TableRow
                                key={event.id}
                                cells={formatCellData(event)}
                                isLastRow={index === items.length - 1}
                            />
                        ))}
                </Table>
            </div>

            {/* Mobile cards */}
            <div className="block md:hidden">
                <div className="rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                    <MobileTableHeader
                        typeLabel={t("type")}
                        amountLabel={t("amount")}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSortChange={handleSortChange}
                    />
                </div>

                <div className="mt-2 space-y-2">
                    {isLoading &&
                        Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                            <MobileTableRow
                                key={`skeleton-${i}`}
                                type={
                                    <span className="inline-block h-[16px] leading-[20px] w-40 bg-[#1F1F1F] rounded animate-pulse" />
                                }
                                amount="--"
                                details={[]}
                            />
                        ))}

                    {!isLoading && isError && (
                        <div className="rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                            <TableEmptyState
                                title={t("errorTitle")}
                                description={
                                    <button
                                        type="button"
                                        onClick={() => refetch()}
                                        className="text-blue-400 hover:underline cursor-pointer"
                                    >
                                        {t("errorRetry")}
                                    </button>
                                }
                                className="px-[16px]"
                                icon={<GoliathEmptyIcon />}
                            />
                        </div>
                    )}

                    {!isLoading && !isError && items.length === 0 && (
                        <div className="rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
                            <TableEmptyState
                                title={t("emptyTitle")}
                                description={
                                    <>
                                        {t("emptyDescription")}
                                        <br />
                                        {t("emptyDescriptionLine2")}
                                    </>
                                }
                                className="px-[16px]"
                                icon={<GoliathEmptyIcon />}
                            />
                        </div>
                    )}

                    {!isLoading &&
                        items.length > 0 &&
                        items.map((event) => (
                            <MobileTableRow
                                key={event.id}
                                type={
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={getEventIcon(
                                                capitalizeType(event.type)
                                            )}
                                            alt={event.type}
                                            width={20}
                                            height={20}
                                            className="opacity-60"
                                        />
                                        <span className="text-[#E6E6E6] text-sm font-medium leading-5 font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                            {evT(event.type)}
                                        </span>
                                    </div>
                                }
                                amount={formatAmount(event.amount)}
                                details={formatMobileRowDetails(event)}
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

export default GoliathStakingHistory;
