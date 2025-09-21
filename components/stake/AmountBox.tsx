import React from "react";

interface AmountBoxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  maxBalance?: number;
}

const AmountBox: React.FC<AmountBoxProps> = ({
  value,
  onChange,
  className,
  maxBalance = 100,
}) => {
  const percentageOptions = [
    { value: 0, label: "0%" },
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "Max" },
  ];

  const handleInputChange = (inputValue: string) => {
    const normalized = inputValue.replace(",", ".");
    if (normalized === "" || /^\d*\.?\d*$/.test(normalized)) {
      if (normalized === "") {
        onChange("");
        return;
      }
      const numValue = parseFloat(normalized);
      if (isNaN(numValue)) return;
      if (numValue > maxBalance) {
        const floored = Math.floor(maxBalance * 1e6) / 1e6;
        const trimmed = floored
          .toFixed(6)
          .replace(/\.0+$|(?<=\..*?)0+$/g, "")
          .replace(/\.$/, "");
        onChange(trimmed);
        return;
      }
      onChange(normalized);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (percentage === 0) {
      onChange("");
    } else {
      const raw = (maxBalance * percentage) / 100;
      const floored = Math.floor(raw * 1e6) / 1e6;
      const trimmed = floored
        .toFixed(6)
        .replace(/\.0+$|(?<=\..*?)0+$/g, "")
        .replace(/\.$/, "");
      onChange(trimmed);
    }
  };

  return (
    <div
      className={`flex p-4 w-full flex-col items-start gap-2 self-stretch rounded-[8px] border border-[#292929] bg-[#1B1B1B] ${className}`}
    >
      <div className="flex justify-between items-center w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`bg-transparent border-none outline-none text-[20px] font-medium leading-[28px] placeholder-[#808080] w-full ${
            value && parseFloat(value) > 0 ? "text-[#E6E6E6]" : "text-[#808080]"
          } [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]`}
          placeholder="0.00"
        />
        <div className="flex gap-1">
          {percentageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePercentageClick(option.value)}
              className={`flex cursor-pointer px-2 py-2 flex-col justify-center items-center gap-2 rounded-full border border-[#292929] bg-[#1B1B1B] text-[#808080] text-[12px] font-medium leading-[16px] hover:text-[#E6E6E6] hover:border-[#636363] transition-colors duration-200 ${
                option.value === 25 || option.value === 75
                  ? "hidden md:flex"
                  : ""
              } [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AmountBox;
