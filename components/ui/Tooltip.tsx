"use client";

import { useState, useRef } from "react";
import { useClickOutside } from "@/hooks/common/useClickOutside";

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    side?: "top" | "bottom" | "left" | "right";
    minWidth?: string;
    maxWidth?: string;
}

const Tooltip = ({
    content,
    children,
    side = "right",
    minWidth = "240px",
    maxWidth = "320px",
}: TooltipProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useClickOutside(containerRef, () => setIsOpen(false));

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleToggle = () => setIsOpen((prev) => !prev);

    const positionClasses =
        side === "top"
            ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
            : side === "bottom"
            ? "top-full left-1/2 -translate-x-1/2 mt-2"
            : side === "left"
            ? "right-full top-1/2 -translate-y-[calc(50%+4px)] mr-2"
            : "left-full top-1/2 -translate-y-[calc(50%+4px)] ml-2";

    const arrowPositionClasses =
        side === "top"
            ? "top-full left-1/2 -translate-x-1/2 rotate-180"
            : side === "bottom"
            ? "bottom-full left-1/2 -translate-x-1/2"
            : side === "left"
            ? "left-full top-1/2 -translate-y-1/2 -rotate-90"
            : "right-full top-1/2 -translate-y-1/2 rotate-90";

    return (
        <div
            ref={containerRef}
            className="relative inline-flex items-center"
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
            onFocus={handleOpen}
            onBlur={handleClose}
        >
            <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center focus:outline-none cursor-help"
                onClick={handleToggle}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label="Toggle tooltip"
            >
                {children}
            </button>
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Tooltip"
                    className={`absolute z-50 ${positionClasses}`}
                >
                    <div
                        className="flex p-2 justify-start items-start content-center gap-3 self-stretch flex-wrap rounded-[8px] border border-stroke-lines bg-box-primary shadow-md"
                        style={{
                            padding: "8px",
                            gap: "12px",
                            minWidth,
                            maxWidth,
                        }}
                    >
                        <div className="text-[12px] leading-4 text-text-secondary whitespace-pre-line text-left [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {content}
                        </div>
                    </div>
                    <div
                        className={`absolute h-0 w-0 ${arrowPositionClasses}`}
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

export default Tooltip;
