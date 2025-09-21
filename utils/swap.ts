import { parseUnits } from "viem";

export const toWei = (value: string, decimals: number) =>
    parseUnits(value || "0", decimals);

export const applySlippageBps = (
    valueWei: bigint,
    bps: number,
    type: "min" | "max"
) => {
    if (bps <= 0) return valueWei;
    const v = BigInt(valueWei);
    const s = BigInt(bps);
    const base = BigInt(10000);
    return type === "min" ? (v * (base - s)) / base : (v * (base + s)) / base;
};

export const isNative = (token?: { address?: string }) => !token?.address;
