"use client";

import { useTranslations } from "next-intl";
import { Token, formatTokenAmount, formatUSDValue } from "@/config/swap";
import SwapInfoRow from "./SwapInfoRow";

interface SwapInfoProps {
    fromToken: Token;
    toToken: Token;
    exchangeRate: number;
    minReceived: number;
    minReceivedUsd?: number;
    gasFeeUsd: number | null;
    slippageBps: number;
}

const SwapInfo = ({
    fromToken,
    toToken,
    exchangeRate,
    minReceived,
    gasFeeUsd,
    slippageBps,
    minReceivedUsd,
}: SwapInfoProps) => {
    const t = useTranslations("swap");
    const hasInputAmount = exchangeRate > 0 && minReceived > 0;

    return (
        <div className="w-full max-w-[530px] mt-6 space-y-3">
            <SwapInfoRow
                label={t("info.exchangeRate")}
                isInactive={!hasInputAmount}
                tooltip={t("info.tooltips.exchangeRate")}
                tooltipMinWidth="260px"
            >
                {hasInputAmount
                    ? `1 ${fromToken.symbol} ~ ${formatTokenAmount(
                          exchangeRate,
                          6
                      )} ${toToken.symbol}`
                    : "-"}
            </SwapInfoRow>

            <SwapInfoRow
                label={t("info.slippageTolerance")}
                isInactive={!hasInputAmount}
                tooltip={t("info.tooltips.slippageTolerance")}
            >
                {hasInputAmount ? `${(slippageBps / 100).toFixed(2)}%` : "-"}
            </SwapInfoRow>

            <SwapInfoRow
                label={t("info.minimumReceived")}
                isInactive={!hasInputAmount}
                tooltip={t("info.tooltips.minimumReceived")}
            >
                {hasInputAmount ? (
                    <>
                        {`${formatTokenAmount(minReceived, 6)} ${
                            toToken.symbol
                        } `}
                        <span className="text-[#808080]">
                            {formatUSDValue(minReceivedUsd ?? 0)}
                        </span>
                    </>
                ) : (
                    "-"
                )}
            </SwapInfoRow>

            <SwapInfoRow
                label={t("info.gasFee")}
                isInactive={!hasInputAmount}
                tooltip={t("info.tooltips.gasFee")}
                tooltipMinWidth="190px"
            >
                {hasInputAmount && gasFeeUsd != null
                    ? `$${gasFeeUsd.toFixed(3)}`
                    : "-"}
            </SwapInfoRow>
        </div>
    );
};

export default SwapInfo;
