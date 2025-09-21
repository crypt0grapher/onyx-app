"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { type ImageLikeSrc, toSrc } from "@/utils/image";

type ButtonProps = {
    label: string;
    icon?: ImageLikeSrc;
    onClick?: () => void;
    disabled?: boolean;
    iconOnly?: boolean;
    iconPosition?: "left" | "right";
    className?: string;
};

const PrimaryButton: React.FC<ButtonProps> = ({
    label,
    icon,
    onClick,
    disabled = false,
    iconOnly = false,
    iconPosition = "left",
    className = "",
}) => {
    const [displayLabel, setDisplayLabel] = useState(label);
    const [displayIcon, setDisplayIcon] = useState(icon);

    const IconComponent = () => (
        <div className="relative">
            <Image
                src={toSrc(displayIcon!)}
                alt=""
                width={20}
                height={20}
                aria-hidden
                className={[
                    "transition-all duration-300 ease-out",
                    disabled
                        ? ""
                        : "group-hover:scale-110 group-hover:rotate-2",
                    disabled ? "" : "group-active:scale-95",
                    "brightness-0",
                ].join(" ")}
            />
        </div>
    );

    useEffect(() => {
        setDisplayLabel(label);
        setDisplayIcon(icon);
    }, [label, icon]);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={[
                "group relative",
                "flex items-center justify-center gap-2",
                iconOnly
                    ? "w-10 h-10 p-2.5 md:w-full md:h-10 md:px-6 md:py-2.5"
                    : "w-full h-10 px-6 py-2.5",
                "rounded-full",
                "bg-primary",
                "outline-none",
                disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer",
                "overflow-hidden",
                "transition-all duration-300 ease-out",
                disabled
                    ? ""
                    : "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20",
                disabled ? "" : "active:scale-[0.98]",
                disabled
                    ? ""
                    : "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
                className,
            ].join(" ")}
            aria-label={displayLabel}
        >
            <div
                className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-300 rounded-full ${
                    disabled ? "" : "group-hover:opacity-100"
                }`}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] transition-transform duration-700 ease-out rounded-full ${
                    disabled ? "" : "group-hover:translate-x-[100%]"
                }`}
            />

            <div
                className={`relative z-10 flex items-center ${
                    iconOnly ? "gap-0 md:gap-2" : "gap-2"
                }`}
            >
                {displayIcon && iconPosition === "left" && <IconComponent />}
                <span
                    className={[
                        "text-center",
                        "text-[14px] leading-5 font-medium",
                        "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
                        "text-button-text",
                        "transition-all duration-300 ease-out",
                        disabled ? "" : "group-hover:tracking-wide",
                        iconOnly ? "hidden md:inline" : "",
                    ].join(" ")}
                >
                    {displayLabel}
                </span>
                {displayIcon && iconPosition === "right" && <IconComponent />}
            </div>

            <div
                className={`absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-white/30 to-white/20 opacity-0 transition-opacity duration-300 blur-sm ${
                    disabled ? "" : "group-hover:opacity-100"
                }`}
            />
        </button>
    );
};

export default PrimaryButton;
