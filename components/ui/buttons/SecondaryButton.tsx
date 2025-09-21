"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { type ImageLikeSrc, toSrc } from "@/utils/image";

type ButtonProps = {
    label: string;
    icon?: ImageLikeSrc;
    secondIcon?: ImageLikeSrc;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    backgroundColor?: string;
};

const SecondaryButton: React.FC<ButtonProps> = ({
    label,
    icon,
    secondIcon,
    onClick,
    disabled = false,
    className = "",
    backgroundColor,
}) => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [displayLabel, setDisplayLabel] = useState(label);
    const [displayIcon, setDisplayIcon] = useState(icon);
    const [displaySecondIcon, setDisplaySecondIcon] = useState(secondIcon);

    useEffect(() => {
        if (
            label !== displayLabel ||
            icon !== displayIcon ||
            secondIcon !== displaySecondIcon
        ) {
            setIsTransitioning(true);

            const timeout = setTimeout(() => {
                setDisplayLabel(label);
                setDisplayIcon(icon);
                setDisplaySecondIcon(secondIcon);
                setIsTransitioning(false);
            }, 150);

            return () => clearTimeout(timeout);
        }
    }, [label, icon, secondIcon, displayLabel, displayIcon, displaySecondIcon]);

    const defaultIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
        >
            <path
                d="M10 5V10M10 10V15M10 10H5M10 10H15"
                stroke="#E6E6E6"
                strokeWidth="1.5"
                strokeLinecap="square"
            />
        </svg>
    );

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={[
                "group relative",
                "flex items-center justify-center gap-2",
                "h-10 px-6 py-2.5",
                "rounded-full",
                "border border-[#292929]",
                "bg-[#1B1B1B]",
                "outline-none",
                backgroundColor ? `bg-[${backgroundColor}]` : "bg-[#1B1B1B]",
                disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer",
                "overflow-hidden",
                "transition-all duration-300 ease-out",
                disabled
                    ? ""
                    : "hover:scale-[1.02] hover:border-[#3a3a3a] hover:bg-[#232323]",
                disabled ? "" : "active:scale-[0.98]",
                disabled
                    ? ""
                    : "focus-visible:ring-2 focus-visible:ring-[#292929]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]",
                className,
            ].join(" ")}
            aria-label={displayLabel}
        >
            <div
                className={`relative z-10 flex items-center gap-2 transition-all duration-300 ease-out ${
                    isTransitioning
                        ? "opacity-0 scale-95 translate-y-1"
                        : "opacity-100 scale-100 translate-y-0"
                }`}
            >
                {displayIcon ? (
                    <div className="relative">
                        <Image
                            src={toSrc(displayIcon)}
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
                            ].join(" ")}
                        />
                    </div>
                ) : (
                    <div
                        className={[
                            "transition-all duration-300 ease-out",
                            disabled
                                ? ""
                                : "group-hover:scale-110 group-hover:rotate-2",
                            disabled ? "" : "group-active:scale-95",
                        ].join(" ")}
                    >
                        {defaultIcon}
                    </div>
                )}
                <span
                    className={[
                        "text-center",
                        "text-[14px] leading-5 font-medium",
                        "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
                        "text-[#E6E6E6]",
                        "transition-all duration-300 ease-out",
                        disabled ? "" : "group-hover:tracking-wide",
                    ].join(" ")}
                >
                    {displayLabel}
                </span>
                {displaySecondIcon && (
                    <div className="relative">
                        <Image
                            src={toSrc(displaySecondIcon)}
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
                            ].join(" ")}
                        />
                    </div>
                )}
            </div>
        </button>
    );
};

export default SecondaryButton;
