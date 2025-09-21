import React from "react";
import Image from "next/image";
import greenCheckIcon from "@/assets/icons/green_checkmark.svg";
import redXIcon from "@/assets/icons/red_x.svg";
import executionIcon from "@/assets/icons/execution.svg";

interface StatusIconProps {
    variant: "success" | "danger" | "normal";
    className?: string;
    size?: "sm" | "md" | "lg";
    defaultBg?: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({
    variant,
    className = "",
    size = "md",
    defaultBg,
}) => {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10",
    };

    const iconSizes = {
        sm: { width: 16, height: 16 },
        md: { width: 20, height: 20 },
        lg: { width: 24, height: 24 },
    };

    const getBackgroundAndIcon = () => {
        switch (variant) {
            case "success":
                return {
                    bg: "bg-[#141D16]",
                    icon: greenCheckIcon,
                    alt: "Success",
                };
            case "danger":
                return {
                    bg: "bg-[#1D1414]",
                    icon: redXIcon,
                    alt: "Danger",
                };
            case "normal":
                return {
                    bg: "bg-[#1B1B1B] border border-[#1F1F1F]",
                    icon: executionIcon,
                    alt: "Normal",
                };
            default:
                return {
                    bg: "bg-[#1B1B1B] border border-[#1F1F1F]",
                    icon: executionIcon,
                    alt: "Normal",
                };
        }
    };

    const { bg, icon, alt } = getBackgroundAndIcon();
    const iconSize = iconSizes[size];
    const backgroundClass = defaultBg || bg;

    return (
        <div
            className={`flex ${sizeClasses[size]} py-[10px] flex-col justify-center items-center gap-2 shrink-0 rounded-full ${backgroundClass} ${className}`}
        >
            <Image
                src={icon}
                alt={alt}
                width={iconSize.width}
                height={iconSize.height}
            />
        </div>
    );
};

export default StatusIcon;
