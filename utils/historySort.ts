import type { HistoryItem } from "@/lib/api/services/subgraph";

export type HistorySortDirection = "asc" | "desc";

export const HISTORY_TYPE_ORDER: string[] = [
    "supply",
    "stake",
    "transfer",
    "withdraw",
    "claim",
    "propose",
    "vote",
    "approval",
    "redeem",
    "borrow",
    "repayborrow",
    "liquidateborrow",
    "reservesadded",
    "reservesreduced",
];

export const isClientSideSortableField = (
    field: keyof HistoryItem
): boolean => {
    if (
        field === "blockTimestamp" ||
        field === "blockNumber" ||
        field === "amount"
    ) {
        return false;
    }
    return true;
};

export const compareHistoryItems = (
    a: HistoryItem,
    b: HistoryItem,
    field: keyof HistoryItem,
    direction: HistorySortDirection
): number => {
    const dir = direction === "asc" ? 1 : -1;

    if (
        field === "blockNumber" ||
        field === "blockTimestamp" ||
        field === "amount"
    ) {
        const av = BigInt(a[field] as string);
        const bv = BigInt(b[field] as string);
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
    }

    if (field === "type") {
        const aIndex = HISTORY_TYPE_ORDER.indexOf(
            String(a[field] ?? "").toLowerCase()
        );
        const bIndex = HISTORY_TYPE_ORDER.indexOf(
            String(b[field] ?? "").toLowerCase()
        );
        if (aIndex !== -1 && bIndex !== -1) {
            if (aIndex === bIndex) return 0;
            return aIndex > bIndex ? dir : -dir;
        }
        if (aIndex !== -1) return -dir;
        if (bIndex !== -1) return dir;
    }

    const av = String(a[field] ?? "").toLowerCase();
    const bv = String(b[field] ?? "").toLowerCase();
    if (av === bv) return 0;
    return av > bv ? dir : -dir;
};

export const sortHistoryItems = (
    list: HistoryItem[],
    field: keyof HistoryItem,
    direction: HistorySortDirection
): HistoryItem[] => {
    return [...list].sort((a, b) =>
        compareHistoryItems(a, b, field, direction)
    );
};
