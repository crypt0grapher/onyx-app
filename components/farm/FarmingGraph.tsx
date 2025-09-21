"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAccount } from "wagmi";
import { BaseChart, ChartSeries, ChartLegendItem } from "../ui/charts";
import LoadingDots from "../ui/common/LoadingDots";
import GraphEmptyState from "../ui/graph/GraphEmptyState";
import { useUserFarmGraph } from "@/hooks/farm/useUserFarmGraph";
import { formatLargeNumber } from "@/utils/format";

type FarmingGraphProps = {
    height?: number | string;
    days?: number;
};

const FarmingGraph: React.FC<FarmingGraphProps> = ({
    height = 260,
    days = 7,
}) => {
    const t = useTranslations("farms.graph");
    const { address } = useAccount();
    const { data, isLoading, error, hasData } = useUserFarmGraph(days);

    const series: ChartSeries[] = useMemo(
        () => [
            {
                dataKey: "staked",
                color: "#292929",
                label: t("staked"),
                barSize: 16,
            },
            {
                dataKey: "earnings",
                color: "#292929",
                hoverColor: "#6F6F6F",
                label: t("earnings"),
                barSize: 16,
            },
        ],
        [t]
    );

    const legendItems: ChartLegendItem[] = useMemo(
        () => [
            { color: "#6F6F6F", label: t("dailyEarnings") },
            { color: "#E6E6E6", label: t("stakedLabel") },
        ],
        [t]
    );

    const formatTooltipValue = (value: number, dataKey: string): string => {
        if (dataKey === "earnings") {
            return value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        return value.toLocaleString();
    };

    if (!address) {
        return (
            <GraphEmptyState
                title={t("connectWalletTitle")}
                description={
                    <>
                        {t("connectWalletDescriptionLine1")}
                        <br />
                        {t("connectWalletDescriptionLine2")}
                    </>
                }
                showConnectButton={true}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <LoadingDots size="lg" variant="block" />
                <div className="text-secondary text-sm">{t("loading")}</div>
            </div>
        );
    }

    if (error) {
        return (
            <GraphEmptyState
                title={t("errorTitle")}
                description={
                    <>
                        {t("errorDescriptionLine1")}
                        <br />
                        {t("errorDescriptionLine2")}
                    </>
                }
                showConnectButton={false}
            />
        );
    }

    if (!isLoading && !hasData) {
        return (
            <GraphEmptyState
                title={t("noDataTitle")}
                description={
                    <>
                        {t("noDataDescriptionLine1")}
                        <br />
                        {t("noDataDescriptionLine2")}
                    </>
                }
                showConnectButton={false}
            />
        );
    }

    return (
        <BaseChart
            data={data}
            series={series}
            height={height}
            xAxisKey="date"
            legendItems={legendItems}
            formatTooltipValue={formatTooltipValue}
            yAxisTickFormatter={(v) => formatLargeNumber(Number(v), 1)}
            margin={{ top: 40, right: 8, bottom: 0, left: 8 }}
            className="relative w-full h-full"
            aria-label="Farming and daily earnings graph"
        />
    );
};

export default FarmingGraph;
