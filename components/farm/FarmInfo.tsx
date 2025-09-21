"use client";

import React from "react";

type FarmInfoProps = {
    title: string;
    subtitle: string;
};

const FarmInfo: React.FC<FarmInfoProps> = ({ title, subtitle }) => {
    return (
        <div className="flex flex-col ml-4 gap-1 flex-1">
            <h3 className="text-[#E6E6E6] text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
                {title}
            </h3>
            <p className="text-[#808080] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:1] [display:-webkit-box]">
                {subtitle}
            </p>
        </div>
    );
};

export default FarmInfo;
