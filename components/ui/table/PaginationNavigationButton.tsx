import React from "react";

interface PaginationNavigationButtonProps {
    onClick: () => void;
    disabled: boolean;
    ariaLabel: string;
    children: React.ReactNode;
}

const PaginationNavigationButton: React.FC<PaginationNavigationButtonProps> = ({
    onClick,
    disabled,
    ariaLabel,
    children,
}) => {
    return (
        <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            className="flex p-[10px] w-[40px] h-[40px] cursor-pointer items-center gap-2 rounded-full border border-[#1F1F1F] bg-[#141414] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1A1A1A] transition-colors"
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
};

export default PaginationNavigationButton;
