import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ExternalLink from "@/components/ui/common/ExternalLink";
import TableHeader from "@/components/ui/table/TableHeader";
import TableRow from "@/components/ui/table/TableRow";

interface VoteRow {
    address: string;
    votes: string;
    href?: string;
}

interface VotingTableProps {
    rows: VoteRow[];
    className?: string;
    maxHeight?: string;
    headerBackgroundColor?: string;
    rowBackgroundColor?: string;
}

const VotingTable: React.FC<VotingTableProps> = ({
    rows,
    className = "",
    maxHeight = "max-h-[240px]",
    headerBackgroundColor,
    rowBackgroundColor,
}) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showFade, setShowFade] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [sortField, setSortField] = useState<string>("votes");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const t = useTranslations("governance.proposal");

    useEffect(() => {
        const updateStates = () => {
            const el = scrollRef.current;
            if (!el) return;

            const overflow = el.scrollHeight > el.clientHeight;
            setHasOverflow(overflow);

            const showFadeGradient =
                el.scrollHeight - el.scrollTop > el.clientHeight + 1;
            setShowFade(showFadeGradient);
        };

        updateStates();

        const element = scrollRef.current;
        element?.addEventListener("scroll", updateStates);
        window.addEventListener("resize", updateStates);
        return () => {
            element?.removeEventListener("scroll", updateStates);
            window.removeEventListener("resize", updateStates);
        };
    }, [rows.length]);

    const parseVotes = (v: string) => {
        if (!v) return 0;
        const normalized = v.replace(/,/g, "").trim();
        const suffix = normalized.slice(-1).toUpperCase();
        const multipliers: Record<string, number> = {
            K: 1e3,
            M: 1e6,
            B: 1e9,
        };
        if (suffix in multipliers) {
            const base = parseFloat(normalized.slice(0, -1));
            return Number.isFinite(base) ? base * multipliers[suffix] : 0;
        }
        const num = parseFloat(normalized);
        return Number.isFinite(num) ? num : 0;
    };

    const sortedRows = useMemo(() => {
        const copy = [...rows];
        if (sortField === "votes") {
            copy.sort((a, b) => {
                const av = parseVotes(a.votes);
                const bv = parseVotes(b.votes);
                return sortDirection === "asc" ? av - bv : bv - av;
            });
        }
        return copy;
    }, [rows, sortField, sortDirection]);

    const handleSortChange = (field: string) => {
        if (field !== sortField) {
            setSortField(field);
            setSortDirection("desc");
        } else {
            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        }
    };

    return (
        <div
            className={`relative w-full rounded-[8px] border border-[#1F1F1F] bg-[#141414] overflow-hidden ${className}`}
        >
            <TableHeader
                columns={[
                    {
                        label: `${t("addresses")} (${rows.length})`,
                        sortable: false,
                        className: "flex-1",
                    },
                    {
                        label: t("votes"),
                        sortable: true,
                        className: "ml-auto",
                        field: "votes",
                    },
                ]}
                backgroundColor={headerBackgroundColor}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
            />
            <div
                ref={scrollRef}
                className={`relative overflow-y-auto scrollbar-hide ${maxHeight} ${
                    hasOverflow ? "pb-[58px]" : ""
                }`}
            >
                {sortedRows.map((row, i) => (
                    <TableRow
                        key={i}
                        isLastRow={i === rows.length - 1}
                        backgroundColor={rowBackgroundColor}
                        cells={[
                            {
                                content: (
                                    <ExternalLink
                                        href={row.href || "#"}
                                        underline={false}
                                    >
                                        {row.address}
                                    </ExternalLink>
                                ),
                                className: "flex-1",
                                isType: true,
                            },
                            {
                                content: row.votes,
                                className: "ml-auto text-right",
                                textColor: "#E6E6E6",
                            },
                        ]}
                    />
                ))}
            </div>
            {showFade && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[72px] bg-gradient-to-t from-[#141414] to-transparent" />
            )}
        </div>
    );
};

export default VotingTable;
