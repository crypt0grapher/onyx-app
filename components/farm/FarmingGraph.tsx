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
  const t = useTranslations("staking.graph");
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
        title="Connect Wallet"
        description={
          <>
            Connect your wallet to
            <br />
            see your farming data
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
        <div className="text-secondary text-sm">Loading graph data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <GraphEmptyState
        title="Unable to Load Data"
        description={
          <>
            Unable to load farming
            <br />
            data. Please try again.
          </>
        }
        showConnectButton={false}
      />
    );
  }

  if (!isLoading && !hasData) {
    return (
      <GraphEmptyState
        title="No Data"
        description={
          <>
            No farming performance
            <br />
            data available
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
