import React, { useCallback } from "react";

interface HeaderColumn {
    label: string;
    sortable?: boolean;
    className?: string;
    field?: string;
}

interface TableHeaderProps {
    columns: HeaderColumn[];
    className?: string;
    backgroundColor?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
    onSortChange?: (field: string) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
    columns,
    className = "",
    backgroundColor = "#141414",
    sortField,
    sortDirection = "desc",
    onSortChange,
}) => {
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>, field?: string) => {
            if (!field || !onSortChange) return;
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSortChange(field);
            }
        },
        [onSortChange]
    );

    const isActive = useCallback(
        (field?: string) => Boolean(field && field === sortField),
        [sortField]
    );

    return (
        <div
            className={`flex py-[10px] px-[16px] items-center self-stretch rounded-t-[8px] border-b border-[#1F1F1F] gap-[24px] ${className}`}
            style={{ backgroundColor }}
        >
            {columns.map((column, index) => (
                <div
                    key={index}
                    className={`flex items-center gap-1 ${
                        column.className || ""
                    }`}
                    role={
                        column.sortable && column.field ? "button" : undefined
                    }
                    tabIndex={column.sortable && column.field ? 0 : -1}
                    aria-label={
                        column.sortable ? `Sort by ${column.label}` : undefined
                    }
                    aria-pressed={
                        column.sortable && isActive(column.field)
                            ? true
                            : undefined
                    }
                    onClick={() =>
                        column.sortable && column.field && onSortChange
                            ? onSortChange(column.field)
                            : undefined
                    }
                    onKeyDown={(e) => handleKeyDown(e, column.field)}
                >
                    <span className="text-secondary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                        {column.label}
                    </span>
                    {column.sortable && (
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="ml-1"
                            aria-hidden="true"
                        >
                            <path
                                d="M6.66669 7.49935L10 4.16602L13.3334 7.49935"
                                stroke={
                                    isActive(column.field) &&
                                    sortDirection === "asc"
                                        ? "#E6E6E6"
                                        : "#808080"
                                }
                                strokeWidth="1.5"
                                strokeLinecap="square"
                            />
                            <path
                                d="M13.3334 12.4993L10 15.8327L6.66669 12.4993"
                                stroke={
                                    isActive(column.field) &&
                                    sortDirection === "desc"
                                        ? "#E6E6E6"
                                        : "#808080"
                                }
                                strokeWidth="1.5"
                                strokeLinecap="square"
                            />
                        </svg>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TableHeader;
