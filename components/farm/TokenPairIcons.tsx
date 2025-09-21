"use client";

import React from "react";
import Image from "next/image";
import { type ImageLikeSrc, toSrc } from "@/utils/image";

type TokenPairIconsProps = {
    firstTokenIcon: ImageLikeSrc;
    secondTokenIcon: ImageLikeSrc;
};

const TokenPairIcons: React.FC<TokenPairIconsProps> = ({
    firstTokenIcon,
    secondTokenIcon,
}) => {
    return (
        <div className="flex items-center">
            <div className="flex w-10 shrink-0 h-10 p-2.5 justify-center items-center rounded-full border border-[#292929] bg-[#1B1B1B] shadow-[0_0_0_2px_#141414] relative z-10">
                <Image
                    src={toSrc(firstTokenIcon)}
                    alt="First token"
                    width={20}
                    height={20}
                />
            </div>
            <div className="flex w-10 shrink-0 h-10 justify-center items-center rounded-full border border-[#292929] bg-[#1B1B1B] -ml-[16px] relative z-0">
                <Image
                    src={toSrc(secondTokenIcon)}
                    alt="Second token"
                    width={20}
                    height={20}
                />
            </div>
        </div>
    );
};

export default TokenPairIcons;
