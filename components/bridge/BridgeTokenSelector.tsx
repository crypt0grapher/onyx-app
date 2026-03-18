"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Switcher from "@/components/ui/buttons/Switcher";
import { type BridgeTokenSymbol } from "@/lib/api/services/bridge";
import ethIcon from "@/assets/icons/eth.svg";
import xcnIcon from "@/assets/icons/XCN.svg";
import usdcIcon from "@/assets/icons/usdc.svg";

const TOKEN_ITEMS = [
    { id: "ETH", label: "ETH", icon: ethIcon },
    { id: "USDC", label: "USDC", icon: usdcIcon },
    { id: "XCN", label: "XCN", icon: xcnIcon },
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
            <Switcher
                items={TOKEN_ITEMS}
                activeId={selectedToken}
                onSwitch={(id) => onSelect(id as BridgeTokenSymbol)}
            />
        </div>
    );
};

export default BridgeTokenSelector;
