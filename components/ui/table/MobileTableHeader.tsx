import React, { useCallback } from "react";

interface MobileTableHeaderProps {
    className?: string;
    typeLabel: string;
    amountLabel: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
    onSortChange?: (field: string) => void;
}

const MobileTableHeader: React.FC<MobileTableHeaderProps> = ({
    className = "",
    typeLabel,
    amountLabel,
    sortField,
    sortDirection = "desc",
    onSortChange,
}) => {
    const isActive = useCallback(
        (field?: string) => Boolean(field && field === sortField),
        [sortField]
    );

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
    return (
        <div
            className={`flex py-[12px] px-[16px] items-center justify-between self-stretch rounded-[8px] border border-[#1F1F1F] bg-[#141414] ${className}`}
        >
            <div
                className="flex items-center gap-1"
                role="button"
                tabIndex={0}
                aria-label={`Sort by ${typeLabel}`}
                aria-pressed={isActive("type") ? true : undefined}
                onClick={() =>
                    onSortChange ? onSortChange("type") : undefined
                }
                onKeyDown={(e) => handleKeyDown(e, "type")}
            >
                <span className="text-secondary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                    {typeLabel}
                </span>
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
                            isActive("type") && sortDirection === "asc"
                                ? "#E6E6E6"
                                : "#808080"
                        }
                        strokeWidth="1.5"
                        strokeLinecap="square"
                    />
                    <path
                        d="M13.3334 12.4993L10 15.8327L6.66669 12.4993"
                        stroke={
                            isActive("type") && sortDirection === "desc"
                                ? "#E6E6E6"
                                : "#808080"
                        }
                        strokeWidth="1.5"
                        strokeLinecap="square"
                    />
                </svg>
            </div>

            <div
                className="flex items-center gap-1"
                role="button"
                tabIndex={0}
                aria-label={`Sort by ${amountLabel}`}
                aria-pressed={isActive("amount") ? true : undefined}
                onClick={() =>
                    onSortChange ? onSortChange("amount") : undefined
                }
                onKeyDown={(e) => handleKeyDown(e, "amount")}
            >
                <span className="text-secondary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                    {amountLabel}
                </span>
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
                            isActive("amount") && sortDirection === "asc"
                                ? "#E6E6E6"
                                : "#808080"
                        }
                        strokeWidth="1.5"
                        strokeLinecap="square"
                    />
                    <path
                        d="M13.3334 12.4993L10 15.8327L6.66669 12.4993"
                        stroke={
                            isActive("amount") && sortDirection === "desc"
                                ? "#E6E6E6"
                                : "#808080"
                        }
                        strokeWidth="1.5"
                        strokeLinecap="square"
                    />
                </svg>
            </div>
        </div>
    );
};

export default MobileTableHeader;
