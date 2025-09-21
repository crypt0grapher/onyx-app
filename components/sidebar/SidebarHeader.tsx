"use client";

import Image from "next/image";
import Link from "next/link";
import logoOnyx from "@/assets/logo-onyx.svg";
import { useTokenQuote } from "@/hooks/api/useTokenQuote";
import { formatToReadablePercentage } from "@/utils/format";

interface SidebarHeaderProps {
  showPricePill?: boolean;
  className?: string;
}

export default function SidebarHeader({
  showPricePill = false,
  className = "",
}: SidebarHeaderProps) {
  const { data, isLoading } = useTokenQuote("XCN", {
    refreshIntervalMs: 30_000,
  });
  const priceText = isLoading
    ? "--"
    : typeof data?.valueUsd === "number"
    ? `$${data.valueUsd.toFixed(5)}`
    : "--";
  const change = data?.change24hPct ?? null;
  const isUp = typeof change === "number" ? change >= 0 : true;
  const changeText =
    change === null ? "--" : `${formatToReadablePercentage(change, 2)}`;
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Link
        className="flex items-center gap-2 cursor-pointer"
        href="https://onyx.org/"
        target="_blank"
        rel="noreferrer"
        aria-label="Onyx Protocol"
      >
        <Image
          className={showPricePill ? "ml-3" : ""}
          src={logoOnyx}
          alt="Onyx Protocol"
          width={85}
          height={24}
        />
      </Link>
      {showPricePill && (
        <div
          className="flex items-center gap-2"
          aria-label="XCN price and change"
        >
          <span
            className={[
              "text-secondary",
              "text-[14px] leading-5 font-medium",
            ].join(" ")}
          >
            {priceText}
          </span>
          <span
            className={[
              "px-2 py-[2px] rounded-full",
              "text-[12px] leading-4 font-medium",
              "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
              isUp
                ? "bg-success/20 text-success"
                : "bg-red-500/20 text-red-500",
            ].join(" ")}
            aria-label="XCN 24h change"
          >
            {isLoading ? "--" : changeText}
          </span>
        </div>
      )}
    </div>
  );
}
