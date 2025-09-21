export type ChartDataPoint = {
    [key: string]: string | number;
};

export type ChartSeries = {
    dataKey: string;
    color: string;
    label: string;
    barSize?: number;
    hoverColor?: string;
};

export type ChartLegendItem = {
    color: string;
    label: string;
};

export type TooltipData = {
    label: string;
    value: string | number;
    color?: string;
};

export type ChartTooltipProps = {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color?: string }>;
    coordinate?: { x: number; y: number };
    tooltipData?: TooltipData[];
    formatValue?: (value: number, dataKey: string) => string;
    series?: ChartSeries[];
};

export type BaseChartProps = {
    data: ChartDataPoint[];
    series: ChartSeries[];
    height?: number | string;
    xAxisKey: string;
    legendItems?: ChartLegendItem[];
    formatTooltipValue?: (value: number, dataKey: string) => string;
    onHover?: (index: number | null) => void;
    className?: string;
    yAxisTickFormatter?: (value: number) => string;
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    barCategoryGap?: number;
    barGap?: number;
    yAxisDomain?: [number, number] | "auto";
    enableTooltip?: boolean;
    enableLegend?: boolean;
};
