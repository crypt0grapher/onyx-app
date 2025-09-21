import React from "react";

interface PaginationResultsProps {
    startItem: number;
    endItem: number;
    totalItems: number;
}

const PaginationResults: React.FC<PaginationResultsProps> = ({
    startItem,
    endItem,
    totalItems,
}) => {
    return (
        <div className="hidden md:flex items-center">
            <span className="text-[#808080] text-[14px] font-normal leading-[20px]">
                Results:{" "}
                <span className="text-[#E6E6E6] font-medium">
                    {startItem}-{endItem}
                </span>{" "}
                of {totalItems}
            </span>
        </div>
    );
};

export default PaginationResults;
