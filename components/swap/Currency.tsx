"use client";

import { useTranslations } from "next-intl";
import { Token, formatUSDValue, SUPPORTED_TOKENS } from "@/config/swap";
import Dropdown, { DropdownOption } from "@/components/ui/common/Dropdown";

interface CurrencyProps {
    label: string;
    selectedToken: Token;
    amount: string;
    usdValue: number;
    balance: string;
    onTokenSelect: (token: Token) => void;
    onAmountChange: (amount: string) => void;
    excludeToken?: string;
    isReadOnly?: boolean;
    /** Optional custom token list. Falls back to SUPPORTED_TOKENS when omitted. */
    tokenList?: Token[];
}

const limitDecimals = (value: string, maxDecimals: number): string => {
    const parts = value.split(".");
    if (parts[1] && parts[1].length > maxDecimals) {
        return parts[0] + "." + parts[1].substring(0, maxDecimals);
    }
    return value;
};

const Currency = ({
    label,
    selectedToken,
    amount,
    usdValue,
    balance,
    onTokenSelect,
    onAmountChange,
    excludeToken,
    isReadOnly = false,
    tokenList,
}: CurrencyProps) => {
    const t = useTranslations("swap");
    const tokens = tokenList ?? SUPPORTED_TOKENS;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) || value === "") {
            const limitedValue = limitDecimals(value, selectedToken.decimals);
            if (limitedValue && parseFloat(limitedValue) > 1e15) {
                onAmountChange("1000000000000000");
                return;
            }
            onAmountChange(limitedValue);
        }
    };

    const tokenOptions: DropdownOption[] = tokens.filter(
        (token) => token.symbol !== excludeToken
    ).map((token) => ({
        id: token.symbol,
        label: token.symbol,
        icon: token.icon,
    }));

    const handleTokenSelect = (tokenSymbol: string) => {
        const found = tokens.find(
            (token) => token.symbol === tokenSymbol
        );
        if (found) {
            onTokenSelect(found);
        }
    };

    return (
        <div className="flex w-full max-w-[530px] p-4 flex-col items-start gap-2 rounded-lg border border-stroke-lines bg-[#141414]">
            <div className="flex justify-between items-center w-full">
                <span className="text-text-secondary text-sm font-medium leading-5">
                    {label}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-sm font-normal leading-5">
                        {t("availableBalance")}
                    </span>
                    <span className="text-text-primary text-sm font-normal leading-5">
                        {balance} {selectedToken.symbol}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center w-full">
                <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder={t("placeholder")}
                            disabled={isReadOnly}
                            className={[
                                "bg-transparent max-w-[100px] lg:max-w-[16.3rem] border-none outline-none",
                                "text-text-primary text-[32px] font-medium leading-10",
                                "placeholder:text-text-secondary",
                                "min-w-0 flex-shrink-0",
                                "font-mono",
                                "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
                                isReadOnly ? "cursor-not-allowed" : "",
                            ].join(" ")}
                            style={{
                                width: `${Math.max(amount.length || 1, 1)}ch`,
                            }}
                        />
                        <span
                            className={`text-text-secondary text-[14px] font-medium leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] ml-[8px]`}
                        >
                            {usdValue === 0
                                ? "~ $0.00"
                                : formatUSDValue(usdValue)}
                        </span>
                    </div>
                </div>

                <Dropdown
                    options={tokenOptions}
                    selectedId={selectedToken.symbol}
                    onSelect={handleTokenSelect}
                    backgroundColor="bg-[#1B1B1B]"
                    borderColor="border-[#292929]"
                    dropdownBackgroundColor="bg-[#141414]"
                    dropdownBorderColor="border-[#1F1F1F]"
                    forcePrimaryColors={true}
                    gap="lg:gap-5 gap-0"
                />
            </div>
        </div>
    );
};

export default Currency;
