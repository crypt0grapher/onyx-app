"use client";

import { type ReactNode } from "react";

type StatusType = "success" | "normal" | "danger";

type StatusBadgeProps = {
    variant: StatusType;
    children: ReactNode;
    className?: string;
};

const StatusBadge = ({
    variant,
    children,
    className = "",
}: StatusBadgeProps) => {
    const baseClasses = [
        "inline-flex px-[8px] py-[2px] justify-center items-center gap-[8px] rounded-full",
        "text-[12px] font-medium leading-[16px]",
        "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
        "backdrop-blur-[10px]",
    ];

    const variantClasses = {
        success: ["bg-[#141D16]", "text-[#0CCD32]"],
        normal: ["bg-bg-boxes", "text-secondary"],
        danger: ["bg-[#1D1614]", "text-[#CD360C]"],
    };

    const allClasses = [
        ...baseClasses,
        ...(variantClasses[variant] || variantClasses.normal),
        className,
    ].join(" ");

    return <span className={allClasses}>{children}</span>;
};

export default StatusBadge;
