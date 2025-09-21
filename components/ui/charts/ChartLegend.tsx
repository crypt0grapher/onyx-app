"use client";

import React from "react";
import { ChartLegendItem } from "./types";

export type ChartLegendProps = {
    items: ChartLegendItem[];
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    className?: string;
};

const positionClasses = {
    "top-right": "absolute right-4 top-3",
    "top-left": "absolute left-4 top-3",
    "bottom-right": "absolute right-4 bottom-3",
    "bottom-left": "absolute left-4 bottom-3",
};

const ChartLegend: React.FC<ChartLegendProps> = ({
    items,
    position = "top-right",
    className = "",
}) => {
    return (
        <div
            className={`${positionClasses[position]} flex items-center z-10 ${className}`}
        >
            {items.map((item, index) => (
                <React.Fragment key={`legend-${index}`}>
                    {index > 0 && <span className="ml-4" />}
                    <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                    />
                    <span className="ml-2 text-[12px] font-medium leading-4 [color:#808080] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                        {item.label}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

export default ChartLegend;
