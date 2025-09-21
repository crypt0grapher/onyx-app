"use client";

import React from "react";
import Image, { type StaticImageData } from "next/image";

interface FormatIconProps {
    src: StaticImageData | string;
    alt: string;
    onClick: () => void;
    isActive?: boolean;
    tooltip?: string;
    disabled?: boolean;
}

const FormatIcon: React.FC<FormatIconProps> = ({
    src,
    alt,
    onClick,
    isActive = false,
    tooltip,
    disabled = false,
}) => (
    <button
        type="button"
        className={`p-1 rounded transition-colors duration-200 ${
            isActive
                ? "bg-[#2F2F2F] text-[#E6E6E6]"
                : "hover:bg-[#1F1F1F] text-[#808080] hover:text-[#E6E6E6]"
        }`}
        onClick={onClick}
        disabled={disabled}
        aria-label={alt}
        title={tooltip || alt}
    >
        <Image src={src} alt={alt} width={20} height={20} />
    </button>
);

export default FormatIcon;
