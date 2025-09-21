"use client";

import React, { useEffect } from "react";
import StatusIcon from "./StatusIcon";
import CloseButton from "../buttons/CloseButton";

export interface ToastProps {
    variant: "success" | "danger";
    text: string;
    subtext?: string;
    onClose?: () => void;
    className?: string;
}

const Toast: React.FC<ToastProps> = ({
    variant,
    text,
    subtext,
    onClose,
    className = "",
}) => {
    useEffect(() => {
        if (!onClose) return;

        const timeoutId = setTimeout(() => {
            onClose();
        }, 5000);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [onClose]);

    return (
        <div
            className={`relative flex justify-between items-start overflow-hidden p-4 rounded-lg border border-[#292929] bg-[#0F0F0F] min-w-[320px] max-w-[400px] ${className}`}
            role="alert"
            aria-live="polite"
        >
            <div className="absolute top-0 left-0 pointer-events-none">
                <div
                    className="w-[84px] h-[84px] rounded-full"
                    style={{
                        backgroundColor: "rgba(12, 205, 50, 0.20)",
                        filter: "blur(100px)",
                    }}
                />
            </div>

            <div className="flex items-start gap-3 relative z-10 flex-1">
                <div className="flex-shrink-0">
                    <StatusIcon
                        variant={variant}
                        size="sm"
                        defaultBg="bg-transparent border border-[#1F1F1F]"
                    />
                </div>

                <div className="flex flex-col flex-1">
                    <p className="text-[#E6E6E6] font-inter text-base font-normal leading-6 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] m-0">
                        {text}
                    </p>

                    {subtext && (
                        <p className="text-[#808080] font-inter text-sm font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] m-0">
                            {subtext}
                        </p>
                    )}
                </div>
            </div>

            {onClose && (
                <div className="relative z-10 flex-shrink-0 flex items-center">
                    <CloseButton onClick={onClose} iconOnly={true} />
                </div>
            )}
        </div>
    );
};

export default Toast;
