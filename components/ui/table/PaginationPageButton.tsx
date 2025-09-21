import React from "react";

interface PaginationPageButtonProps {
    page: number;
    isActive: boolean;
    onClick: (page: number) => void;
}

const PaginationPageButton: React.FC<PaginationPageButtonProps> = ({
    page,
    isActive,
    onClick,
}) => {
    const buttonClasses = `flex cursor-pointer w-[40px] h-[40px] py-[10px] flex-col justify-center items-center gap-2 rounded-full border border-[#1F1F1F] text-[14px] font-medium transition-colors ${
        isActive
            ? "bg-[#E6E6E6] text-[#141414]"
            : "bg-[#141414] text-[#808080] hover:bg-[#1A1A1A]"
    }`;

    return (
        <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onClick(page)}
            className={buttonClasses}
        >
            {page}
        </button>
    );
};

export default PaginationPageButton;
