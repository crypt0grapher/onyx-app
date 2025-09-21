"use client";

import React, { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from "recharts";
import { BaseChartProps } from "./types";
import ChartPatterns, { PatternColor } from "./ChartPatterns";
import ChartLegend from "./ChartLegend";
import ChartTooltip from "./ChartTooltip";

const BaseChart: React.FC<BaseChartProps> = ({
    data,
    series,
    height = 260,
    xAxisKey,
    legendItems,
    formatTooltipValue,
    onHover,
    className = "",
    margin = { top: 40, right: 0, bottom: 0, left: 0 },
    barCategoryGap = 24,
    barGap = 8,
    yAxisDomain = "auto",
    enableTooltip = true,
    enableLegend = true,
    yAxisTickFormatter,
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(
        () =>
            data.map((item, index) => ({
                ...item,
                index,
            })),
        [data]
    );

    const domainMax = useMemo(() => {
        if (yAxisDomain !== "auto") {
            return yAxisDomain[1];
        }

        const allValues = data.flatMap((item) =>
            series.map((s) => Number(item[s.dataKey]) || 0)
        );
        const maxVal = Math.max(...allValues, 0);

        if (maxVal === 0) return 1;

        if (maxVal < 10) {
            const headroom = Math.max(maxVal * 0.2, 0.1);
            return Math.ceil((maxVal + headroom) * 10) / 10;
        }

        if (maxVal < 100) {
            const headroom = Math.max(maxVal * 0.15, 1);
            return Math.ceil((maxVal + headroom) / 10) * 10;
        }

        const headroom = Math.max(maxVal * 0.1, 1);
        const increment = maxVal < 1000 ? 50 : maxVal < 10000 ? 100 : 500;
        return Math.ceil((maxVal + headroom) / increment) * increment;
    }, [data, series, yAxisDomain]);

    const domainMin = useMemo(() => {
        if (yAxisDomain !== "auto") {
            return yAxisDomain[0];
        }
        return 0;
    }, [yAxisDomain]);

    const patterns: PatternColor[] = useMemo(() => {
        const basePatterns: PatternColor[] = [];

        series.forEach((s) => {
            basePatterns.push({
                id: `bars-stripe-${s.dataKey}`,
                color: s.color,
            });

            const hoverColor =
                s.hoverColor ??
                (s.color === "#292929"
                    ? "#E6E6E6"
                    : s.color === "#6F6F6F"
                    ? "#6F6F6F"
                    : "#E6E6E6");
            basePatterns.push({
                id: `bars-stripe-${s.dataKey}-hover`,
                color: hoverColor,
            });
        });

        return basePatterns;
    }, [series]);

    const handleMouseMove = (state: Record<string, unknown>) => {
        if (state.isTooltipActive) {
            const index = Number(state.activeTooltipIndex) ?? null;
            setHoveredIndex(index);
            onHover?.(index);
        }
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        onHover?.(null);
    };

    return (
        <div
            className={`relative w-full h-full ${className}`}
            role="img"
            aria-label="Chart"
            tabIndex={0}
        >
            {enableLegend && legendItems && <ChartLegend items={legendItems} />}

            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={chartData}
                    margin={margin}
                    barCategoryGap={barCategoryGap}
                    barGap={barGap}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                >
                    <ChartPatterns patterns={patterns} />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        domain={[domainMin, domainMax]}
                        tick={{
                            fill: "#808080",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                        tickFormatter={yAxisTickFormatter}
                        tickMargin={6}
                    />

                    <XAxis
                        dataKey={xAxisKey}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        tick={{
                            fill: "#808080",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                    />

                    {enableTooltip && (
                        <Tooltip
                            cursor={{
                                fill: "transparent",
                                stroke: "transparent",
                            }}
                            content={
                                <ChartTooltip
                                    formatValue={formatTooltipValue}
                                    series={series}
                                />
                            }
                        />
                    )}

                    {series.map((s) => (
                        <Bar
                            key={s.dataKey}
                            dataKey={s.dataKey}
                            barSize={s.barSize || 16}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`${s.dataKey}-${index}`}
                                    fill={`url(#${
                                        hoveredIndex === index
                                            ? `bars-stripe-${s.dataKey}-hover`
                                            : `bars-stripe-${s.dataKey}`
                                    })`}
                                />
                            ))}
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BaseChart;
