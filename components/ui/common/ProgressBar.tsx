import React from "react";

interface ProgressBarProps {
    value: number;
    variant?: "success" | "danger" | "normal";
    className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    variant = "normal",
    className = "",
}) => {
    const safeValue = Math.min(Math.max(value, 0), 100);

    const colorClasses = {
        success: "bg-[#3DD598]",
        danger: "bg-[#E53E3E]",
        normal: "bg-[#4A5568]",
    };

    return (
        <div
            className={`w-full h-[12px] min-h-[12px] flex-shrink-0 rounded-[8px] bg-[#2D2D2D] overflow-hidden ${className}`}
        >
            <div
                className={`h-full rounded-[8px] transition-all duration-300 ${colorClasses[variant]}`}
                style={{ width: `${safeValue}%` }}
            />
        </div>
    );
};

export default ProgressBar;
