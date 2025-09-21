import React from "react";

interface DividerProps {
    className?: string;
    orientation?: "horizontal" | "vertical";
}

const Divider: React.FC<DividerProps> = ({
    className = "",
    orientation = "horizontal",
}) => {
    const baseClasses =
        orientation === "horizontal"
            ? "w-full h-[1px] bg-bg-boxes"
            : "min-w-px h-full bg-bg-boxes";

    return <div className={`${baseClasses} ${className}`} />;
};

export default Divider;
