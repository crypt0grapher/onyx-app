"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { ChartTooltipProps } from "./types";

const ChartTooltip: React.FC<ChartTooltipProps> = ({
    active,
    payload,
    coordinate,
    formatValue,
    series,
}) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [left, setLeft] = useState(0);

    useLayoutEffect(() => {
        if (tooltipRef.current && coordinate) {
            const tooltipWidth = tooltipRef.current.offsetWidth + 80;
            const windowWidth = window.innerWidth;

            let newLeft = coordinate.x - tooltipWidth / 2;

            if (newLeft < 0) {
                newLeft = 20;
            } else if (newLeft + tooltipWidth > windowWidth) {
                newLeft = windowWidth - tooltipWidth - 20;
            }
            setLeft(newLeft);
        }
    }, [coordinate]);

    if (!active || !payload || payload.length === 0 || !coordinate) return null;

    const defaultFormatValue = (value: number, dataKey: string) => {
        if (
            dataKey.toLowerCase().includes("earning") ||
            dataKey.toLowerCase().includes("profit")
        ) {
            return value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        return value.toLocaleString();
    };

    const formatFn = formatValue || defaultFormatValue;

    const getTranslatedLabel = (dataKey: string): string => {
        if (!series) return dataKey;
        const seriesItem = series.find(s => s.dataKey === dataKey);
        return seriesItem?.label || dataKey;
    };

    return (
        <div
            ref={tooltipRef}
            className="absolute pointer-events-none z-50 w-[180px]"
            style={{
                left: left,
                top: Math.max(20, coordinate.y - 120),
                opacity: left === 0 ? 0 : 1,
            }}
        >
            <div
                className="flex w-full flex-col gap-3 rounded-[8px] border border-stroke-lines bg-[rgba(20,20,20,0.50)] p-3 backdrop-blur-[10px] shadow-lg"
                role="dialog"
                aria-label="Chart details"
            >
                {payload.map((entry, index) => (
                    <div
                        key={`tooltip-${entry.dataKey}-${index}`}
                        className="flex w-full items-center justify-between gap-8"
                    >
                        <span className="text-[12px] font-normal leading-4 [color:#808080] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                            {getTranslatedLabel(entry.dataKey)}
                        </span>
                        <span className="text-[12px] font-medium leading-4 [color:#E6E6E6] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                            {formatFn(entry.value, entry.dataKey)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChartTooltip;
