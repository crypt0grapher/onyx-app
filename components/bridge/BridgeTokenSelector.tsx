"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type BridgeTokenSymbol } from "@/lib/api/services/bridge";
import ethIcon from "@/assets/icons/eth.svg";
import xcnIcon from "@/assets/icons/XCN.svg";
import usdcIcon from "@/assets/icons/usdc.svg";

interface TokenInfo {
    symbol: BridgeTokenSymbol;
    label: string;
    icon: string;
}

const BRIDGE_TOKENS: TokenInfo[] = [
    { symbol: "ETH", label: "ETH", icon: ethIcon },
    { symbol: "USDC", label: "USDC", icon: usdcIcon },
    { symbol: "XCN", label: "XCN", icon: xcnIcon },
];

interface BridgeTokenSelectorProps {
    selectedToken: BridgeTokenSymbol;
    onSelect: (token: BridgeTokenSymbol) => void;
}

const BridgeTokenSelector: React.FC<BridgeTokenSelectorProps> = ({
    selectedToken,
    onSelect,
}) => {
    const t = useTranslations("bridge");

    return (
        <div className="flex flex-col gap-1">
            <span className="text-secondary text-[14px] font-medium leading-[20px]">
                {t("form.selectToken")}
            </span>
            <div className="flex gap-2">
                {BRIDGE_TOKENS.map((token) => {
                    const isActive = token.symbol === selectedToken;
                    return (
                        <button
                            key={token.symbol}
                            type="button"
                            onClick={() => onSelect(token.symbol)}
                            className={[
                                "flex items-center gap-2 px-4 py-[10px] rounded-full",
                                "transition-all duration-200 cursor-pointer",
                                "text-[14px] font-medium leading-[20px]",
                                "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
                                isActive
                                    ? "bg-[#1B1B1B] border border-[#292929] text-[#E6E6E6]"
                                    : "bg-transparent border border-transparent text-[#808080] hover:text-[#B0B0B0] hover:bg-[#1B1B1B]/50",
                            ].join(" ")}
                            aria-label={token.label}
                        >
                            <Image
                                src={token.icon}
                                alt=""
                                width={20}
                                height={20}
                                aria-hidden
                                className={`transition-opacity duration-200 ${
                                    isActive ? "opacity-100" : "opacity-60"
                                }`}
                            />
                            <span>{token.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BridgeTokenSelector;
