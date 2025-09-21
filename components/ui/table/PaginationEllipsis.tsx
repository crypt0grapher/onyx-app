import React from "react";

const PaginationEllipsis: React.FC = () => {
    return (
        <div className="flex w-[40px] md:w-[64px] h-[40px] py-[10px] flex-col justify-center items-center gap-2 rounded-full border border-[#1F1F1F] bg-[#141414] text-[#808080] text-[14px] font-medium">
            ...
        </div>
    );
};

export default PaginationEllipsis;
