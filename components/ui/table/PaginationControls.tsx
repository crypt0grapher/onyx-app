import React from "react";
import PaginationPageButton from "./PaginationPageButton";
import PaginationEllipsis from "./PaginationEllipsis";

interface PaginationControlsProps {
    visiblePages: (number | string)[];
    currentPage: number;
    onPageClick: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    visiblePages,
    currentPage,
    onPageClick,
}) => {
    return (
        <>
            {visiblePages.map((page, index) => (
                <React.Fragment key={index}>
                    {page === "..." ? (
                        <PaginationEllipsis />
                    ) : (
                        <PaginationPageButton
                            page={page as number}
                            isActive={currentPage === page}
                            onClick={onPageClick}
                        />
                    )}
                </React.Fragment>
            ))}
        </>
    );
};

export default PaginationControls;
