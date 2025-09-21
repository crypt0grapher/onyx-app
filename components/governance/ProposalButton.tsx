"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ImageLikeSrc, toSrc } from "@/utils/image";
import { useClickOutside } from "@/hooks/common/useClickOutside";

type ProposalButtonProps = {
    label: string;
    icon?: ImageLikeSrc;
    secondIcon?: ImageLikeSrc;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    backgroundColor?: string;
    showTooltip?: boolean;
};

const ProposalButton: React.FC<ProposalButtonProps> = ({
    label,
    icon,
    secondIcon,
    onClick,
    disabled = false,
    className = "",
    backgroundColor,
    showTooltip = true,
}) => {
    const t = useTranslations("governance");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [displayLabel, setDisplayLabel] = useState(label);
    const [displayIcon, setDisplayIcon] = useState(icon);
    const [displaySecondIcon, setDisplaySecondIcon] = useState(secondIcon);
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useClickOutside(containerRef, () => setIsTooltipOpen(false));

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

    const handleTooltipOpen = () => setIsTooltipOpen(true);
    const handleTooltipClose = () => setIsTooltipOpen(false);
    const handleTooltipToggle = () => setIsTooltipOpen((prev) => !prev);

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
        <div
            ref={containerRef}
            className="relative inline-flex"
            onMouseEnter={handleTooltipOpen}
            onMouseLeave={handleTooltipClose}
            onFocus={handleTooltipOpen}
            onBlur={handleTooltipClose}
        >
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
                    backgroundColor
                        ? `bg-[${backgroundColor}]`
                        : "bg-[#1B1B1B]",
                    disabled
                        ? "cursor-not-allowed opacity-30"
                        : "cursor-pointer",
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
                onFocus={handleTooltipOpen}
                onBlur={handleTooltipClose}
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
                    {displaySecondIcon && showTooltip && disabled && (
                        <div
                            className="relative cursor-help"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTooltipToggle();
                            }}
                        >
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

            {showTooltip && disabled && isTooltipOpen && (
                <div
                    role="dialog"
                    aria-label="Tooltip"
                    className="absolute z-50 top-full right-0 mt-2 hidden sm:block"
                >
                    <div
                        className="flex p-2 justify-start items-start content-center gap-3 self-stretch flex-wrap rounded-[8px] border border-stroke-lines bg-box-primary shadow-md"
                        style={{
                            padding: "8px",
                            gap: "12px",
                            minWidth: "280px",
                            maxWidth: "320px",
                        }}
                    >
                        <div className="text-[12px] leading-4 text-text-secondary whitespace-pre-line text-left [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {t("createProposalTooltip")}
                        </div>
                    </div>
                    <div
                        className="absolute h-0 w-0 bottom-full right-[30px] -translate-x-1/2 rotate-180"
                        aria-hidden
                    >
                        <svg
                            width="8"
                            height="5"
                            viewBox="0 0 8 5"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M3.24407 4.12713C3.64284 4.58759 4.35716 4.58759 4.75593 4.12713L7.76318 0.654654C8.32406 0.00700951 7.864 -1 7.00725 -1H0.992749C0.135997 -1 -0.324056 0.00700998 0.23682 0.654654L3.24407 4.12713Z"
                                fill="#1F1F1F"
                            />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProposalButton;
