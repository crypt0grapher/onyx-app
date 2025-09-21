"use client";

import Image from "next/image";
import searchIcon from "@/assets/icons/search.svg";

interface SearchBarProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    backgroundColor?: string;
    borderColor?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = "Search",
    value,
    onChange,
    className = "",
    backgroundColor = "bg-bg-boxes",
    borderColor = "border-stroke-lines",
}) => {
    return (
        <div
            className={`flex p-[10px_16px] flex-col items-start gap-2 rounded-[1000px] border ${borderColor} ${backgroundColor} ${className}`}
        >
            <div className="flex w-full items-center gap-2">
                <Image
                    src={searchIcon}
                    alt="Search"
                    width={20}
                    height={20}
                    className="opacity-60"
                />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="bg-transparent w-full border-none outline-none text-secondary text-[14px] font-medium leading-5 placeholder:text-secondary [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] flex-1"
                />
            </div>
        </div>
    );
};

export default SearchBar;
