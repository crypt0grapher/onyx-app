import Image from "next/image";
import infoIcon from "@/assets/icons/info.svg";
import Tooltip from "@/components/ui/Tooltip";

interface SwapInfoRowProps {
    label: string;
    children: React.ReactNode;
    showInfoIcon?: boolean;
    isInactive?: boolean;
    tooltip?: React.ReactNode;
    tooltipMinWidth?: string;
    tooltipMaxWidth?: string;
}

const SwapInfoRow = ({
    label,
    children,
    showInfoIcon = true,
    isInactive = false,
    tooltip,
    tooltipMinWidth,
    tooltipMaxWidth,
}: SwapInfoRowProps) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-[14px] font-normal leading-5 text-text-secondary [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {label}
                </span>
                {showInfoIcon &&
                    (tooltip ? (
                        <Tooltip
                            content={tooltip}
                            side="right"
                            minWidth={tooltipMinWidth}
                            maxWidth={tooltipMaxWidth}
                        >
                            <Image
                                src={infoIcon}
                                alt="Info"
                                width={20}
                                height={20}
                            />
                        </Tooltip>
                    ) : (
                        <Image
                            src={infoIcon}
                            alt="Info"
                            width={20}
                            height={20}
                        />
                    ))}
            </div>
            <div
                className={`text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] ${
                    isInactive ? "text-text-secondary" : "text-text-primary"
                }`}
            >
                {children}
            </div>
        </div>
    );
};

export default SwapInfoRow;
