"use client";

import React from "react";
import Switcher from "@/components/ui/buttons/Switcher";
import Divider from "@/components/ui/common/Divider";
import AmountBox from "@/components/stake/AmountBox";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import { type ImageLikeSrc } from "@/utils/image";
import LoadingDots from "@/components/ui/common/LoadingDots";

export interface SwitcherItem {
  id: string;
  label: string;
  icon: ImageLikeSrc;
}

export interface InfoRow {
  label: string;
  value: string | React.ReactElement;
}

export interface InteractivePanelProps {
  title: string;
  availableBalanceLabel: string;
  availableBalanceValue: string | React.ReactElement;
  switcherItems: SwitcherItem[];
  activeMode: string;
  onSwitch: (id: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  maxBalance: number;
  infoRows: InfoRow[];
  buttonLabel: string;
  onAction: () => void;
  isButtonDisabled: boolean;
  actionIcon: ImageLikeSrc;
  isConnected: boolean;
  isLoading: boolean;
}

const InteractivePanel: React.FC<InteractivePanelProps> = ({
  title,
  availableBalanceLabel,
  availableBalanceValue,
  switcherItems,
  activeMode,
  onSwitch,
  amount,
  onAmountChange,
  maxBalance,
  infoRows,
  buttonLabel,
  onAction,
  isButtonDisabled,
  actionIcon,
  isConnected,
  isLoading,
}) => {
  return (
    <div className="flex w-full h-full flex-col py-4 items-start rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start w-full px-4">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:flex-col md:items-start">
          <h3 className="text-[#E6E6E6] text-[20px] font-medium leading-[28px] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
            {title}
          </h3>
          <div className="text-[#808080] text-[14px] font-normal leading-[20px] mt-0 md:mt-0 [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
            {availableBalanceLabel}{" "}
            <span className="text-[#E6E6E6] font-medium inline-flex items-center">
              {!isConnected ? (
                "0.00"
              ) : isLoading ? (
                <LoadingDots size="sm" variant="inline" className="ml-1" />
              ) : (
                availableBalanceValue
              )}
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <Switcher
            items={switcherItems}
            activeId={activeMode}
            onSwitch={onSwitch}
          />
        </div>
      </div>

      <Divider className="mt-[16px] mb-[17px] md:my-4" />

      <div className="px-4 w-full">
        <AmountBox
          value={amount}
          onChange={onAmountChange}
          maxBalance={maxBalance}
        />
      </div>

      <div className="flex flex-col gap-3 w-full mt-4 px-4">
        {infoRows.map((row, index) => (
          <div key={index} className="flex justify-between items-center w-full">
            <span className="text-[#808080] text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
              {row.label}
            </span>
            <span className="text-[#E6E6E6] text-[14px] font-medium leading-[20px] [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off] inline-flex items-center">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <Divider className="mt-4 md:mt-8 mb-[17px]" />
      <div className="px-4 w-full">
        <PrimaryButton
          label={buttonLabel}
          icon={actionIcon}
          disabled={isButtonDisabled}
          onClick={onAction}
        />
      </div>
    </div>
  );
};

export default InteractivePanel;
