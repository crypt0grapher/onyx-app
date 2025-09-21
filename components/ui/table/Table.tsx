import React from "react";

interface TableProps {
    children: React.ReactNode;
    className?: string;
    enableHorizontalScroll?: boolean;
}

const Table: React.FC<TableProps> = ({
    children,
    className = "",
    enableHorizontalScroll = false,
}) => {
    const scrollContainerClass = enableHorizontalScroll
        ? "overflow-x-auto custom-scrollbar"
        : "";

    const tableClass = enableHorizontalScroll ? "min-w-fit" : "";

    return (
        <div className={scrollContainerClass}>
            <div
                className={`flex flex-col items-start rounded-[8px] border border-[#1F1F1F] bg-[#141414] ${tableClass} ${className}`}
            >
                {children}
            </div>
        </div>
    );
};

export default Table;
