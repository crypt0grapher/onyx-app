"use client";

import { useTranslations } from "next-intl";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SwapHeader from "@/components/swap/SwapHeader";
import CurrencyPair from "@/components/swap/CurrencyPair";
import SwapInfo from "@/components/swap/SwapInfo";
import OnyxBackground from "@/components/ui/common/OnyxBackground";
import swapIcon from "@/assets/icons/swap.svg";
import useSwapController from "@/hooks/swap/useSwapController";
import useNetworkCheck from "@/hooks/common/useNetworkCheck";
import useToast from "@/hooks/ui/useToast";

export default function Swap() {
    const t = useTranslations("swap");
    const tt = useTranslations("toast");
    const { isOnEthereum } = useNetworkCheck();
    const { showDangerToast } = useToast();
    const {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        fromUsdValue,
        toUsdValue,
        balances,
        needApproval,
        isApprovePending,
        isSwapPending,
        isSwapDisabled,
        hasInsufficientFunds,
        exchangeRate,
        minReceivedTokens,
        minReceivedUsd,
        gasFeeUsd,
        slippageBps,
        handleFromTokenSelect,
        handleToTokenSelect,
        handleFromAmountChange,
        handleToAmountChange,
        handleSwapCurrencies,
        executeSwap,
    } = useSwapController();

    return (
        <div className="h-full flex justify-center md:min-h-screen lg:pt-12 px-4 overflow-hidden">
            <div className="w-full max-w-[530px] flex flex-col items-center justify-between lg:ml-[304px]">
                <div className="w-full flex flex-col items-center">
                    <SwapHeader />

                    <CurrencyPair
                        fromToken={fromToken}
                        toToken={toToken}
                        fromAmount={fromAmount}
                        toAmount={toAmount}
                        fromUsdValue={fromUsdValue}
                        toUsdValue={toUsdValue}
                        balances={balances}
                        onFromTokenSelect={handleFromTokenSelect}
                        onToTokenSelect={handleToTokenSelect}
                        onFromAmountChange={handleFromAmountChange}
                        onToAmountChange={handleToAmountChange}
                        onSwapCurrencies={handleSwapCurrencies}
                    />

                    <SwapInfo
                        fromToken={fromToken}
                        toToken={toToken}
                        exchangeRate={exchangeRate}
                        minReceived={minReceivedTokens}
                        minReceivedUsd={minReceivedUsd}
                        gasFeeUsd={gasFeeUsd}
                        slippageBps={slippageBps}
                    />

                    <div className="w-full max-w-[530px] mt-5">
                        <PrimaryButton
                            label={
                                !isOnEthereum
                                    ? t("wrongNetwork")
                                    : hasInsufficientFunds
                                    ? t("insufficientFunds")
                                    : isApprovePending
                                    ? t("approving")
                                    : isSwapPending
                                    ? t("swapping")
                                    : needApproval
                                    ? t("approveXcn")
                                    : t("swapButton")
                            }
                            icon={swapIcon}
                            onClick={() => {
                                if (!isOnEthereum) {
                                    showDangerToast(
                                        tt("network.wrongNetwork"),
                                        tt("network.wrongNetworkSubtext")
                                    );
                                    return;
                                }

                                executeSwap({
                                    successText: tt("swapTransaction.success"),
                                    successSubtext: tt(
                                        "swapTransaction.successSubtext"
                                    ),
                                    errorText: tt("swapTransaction.failed"),
                                });
                            }}
                            disabled={
                                !isOnEthereum ||
                                isSwapDisabled ||
                                isApprovePending ||
                                isSwapPending
                            }
                        />
                    </div>
                </div>

                <OnyxBackground />
            </div>
        </div>
    );
}
