"use client";

import { type ReactNode } from "react";

type PlaceBigProps = {
  children: ReactNode;
  className?: string;
};

const PlaceBig = ({ children, className = "" }: PlaceBigProps) => {
  const baseClasses = [
    "flex",
    "w-[43px]",
    "px-2 py-[2px]",
    "justify-center",
    "items-center",
    "gap-2",
    "bg-bg-boxes",
    "text-secondary",
    "text-[12px] leading-4 font-medium",
    "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
    "rounded-full",
  ];

  const allClasses = [...baseClasses, className].join(" ");

  return <div className={allClasses}>{children}</div>;
};

export default PlaceBig;
