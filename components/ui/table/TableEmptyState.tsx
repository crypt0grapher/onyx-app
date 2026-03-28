"use client";

import React from "react";
import Image from "next/image";
import onyxLogoShadow from "@/assets/onyx_logo_shadow.svg";

export type TableEmptyStateProps = {
  title?: string;
  description?: string | React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title = "Empty History",
  description = (
    <>
      Your history will appear here
      <br />
      once you make your first stake.
    </>
  ),
  className = "",
  icon,
}) => {
  return (
    <div
      className={`flex items-center justify-center py-[48px] px-[16px] w-full ${className}`}
    >
      <div className="flex md:flex-row flex-col items-center justify-center gap-4 md:gap-6">
        {icon ?? (
          <Image
            src={onyxLogoShadow}
            alt="Onyx Logo Shadow"
            width={136}
            height={140}
            priority={false}
          />
        )}
        <div className="flex flex-col pb-[20px]">
          <h3 className="text-primary text-center md:text-left text-[20px] font-medium leading-[28px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
            {title}
          </h3>
          <p className="text-secondary text-center md:text-left text-[14px] font-normal leading-[20px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TableEmptyState;
