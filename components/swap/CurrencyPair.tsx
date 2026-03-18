"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import Currency from "./Currency";
import { Token } from "@/config/swap";
import swapVerticalIcon from "@/assets/icons/swap-vertical.svg";

interface CurrencyPairProps {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  fromUsdValue: number;
  toUsdValue: number;
  balances: Record<string, string>;
  onFromTokenSelect: (token: Token) => void;
  onToTokenSelect: (token: Token) => void;
  onFromAmountChange: (amount: string) => void;
  onToAmountChange: (amount: string) => void;
  onSwapCurrencies: () => void;
  /** Optional custom token list forwarded to Currency dropdowns. */
  tokenList?: Token[];
}

const CurrencyPair = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  fromUsdValue,
  toUsdValue,
  balances,
  onFromTokenSelect,
  onToTokenSelect,
  onFromAmountChange,
  onToAmountChange,
  onSwapCurrencies,
  tokenList,
}: CurrencyPairProps) => {
  const t = useTranslations("swap");

  return (
    <div className="relative w-full">
      <Currency
        label={t("from")}
        selectedToken={fromToken}
        amount={fromAmount}
        usdValue={fromUsdValue}
        balance={balances[fromToken.symbol as keyof typeof balances] || "0"}
        onTokenSelect={onFromTokenSelect}
        onAmountChange={onFromAmountChange}
        excludeToken={toToken.symbol}
        tokenList={tokenList}
      />

      <div className="h-2" />

      <Currency
        label={t("to")}
        selectedToken={toToken}
        amount={toAmount}
        usdValue={toUsdValue}
        balance={balances[toToken.symbol as keyof typeof balances] || "0"}
        onTokenSelect={onToTokenSelect}
        onAmountChange={onToAmountChange}
        excludeToken={fromToken.symbol}
        tokenList={tokenList}
      />

      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <button
          onClick={onSwapCurrencies}
          className={[
            "w-12 h-12 rounded-full",
            "bg-bg-primary border-[6px] border-bg-primary",
            "flex items-center justify-center",
            "hover:bg-white/5 transition-all duration-300",
            "cursor-pointer",
          ].join(" ")}
          aria-label="Swap currencies"
        >
          <div className="w-8 h-8 rounded-full bg-bg-boxes border border-stroke-lines flex items-center justify-center">
            <Image
              src={swapVerticalIcon}
              alt="Swap"
              width={18}
              height={18}
              className="transition-transform duration-300"
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default CurrencyPair;
