import React from "react";

interface CellData {
    content: string | React.ReactNode;
    isType?: boolean;
    textColor?: string;
    className?: string;
}

interface TableRowProps {
    cells: CellData[];
    className?: string;
    isLastRow?: boolean;
    backgroundColor?: string;
}

const TableRow: React.FC<TableRowProps> = ({
    cells,
    className = "",
    isLastRow = false,
    backgroundColor = "#141414",
}) => {
    return (
        <div
            className={`flex py-[14px] px-[16px] items-center self-stretch gap-[24px] ${
                !isLastRow ? "border-b border-[#1F1F1F]" : ""
            } ${className}`}
            style={{ backgroundColor }}
        >
            {cells.map((cell, index) => (
                <div key={index} className={`${cell.className || ""}`}>
                    <span
                        className={`text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off] ${
                            cell.isType
                                ? "text-[#E6E6E6]"
                                : cell.textColor
                                ? ""
                                : "text-[#808080]"
                        }`}
                        style={{
                            color: cell.textColor || undefined,
                        }}
                    >
                        {cell.content}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default TableRow;
