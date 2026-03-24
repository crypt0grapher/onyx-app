import { describe, it, expect } from "vitest";
import { toWei, applySlippageBps, isNative } from "@/utils/swap";

describe("toWei", () => {
    it("converts a decimal string to bigint with 18 decimals", () => {
        const result = toWei("1", 18);
        expect(result).toBe(10n ** 18n);
    });

    it("converts a decimal string with fractional part", () => {
        const result = toWei("1.5", 18);
        expect(result).toBe(15n * 10n ** 17n);
    });

    it("handles 6 decimals (USDC-like)", () => {
        const result = toWei("100", 6);
        expect(result).toBe(100_000_000n);
    });

    it("handles empty string by defaulting to 0", () => {
        const result = toWei("", 18);
        expect(result).toBe(0n);
    });

    it("handles zero", () => {
        const result = toWei("0", 18);
        expect(result).toBe(0n);
    });
});

describe("applySlippageBps", () => {
    it("returns original value when bps is 0", () => {
        expect(applySlippageBps(1000n, 0, "min")).toBe(1000n);
        expect(applySlippageBps(1000n, 0, "max")).toBe(1000n);
    });

    it("returns original value when bps is negative", () => {
        expect(applySlippageBps(1000n, -1, "min")).toBe(1000n);
    });

    it("calculates minimum with 0.5% slippage (50 bps)", () => {
        const result = applySlippageBps(10000n, 50, "min");
        // (10000 * (10000 - 50)) / 10000 = (10000 * 9950) / 10000 = 9950
        expect(result).toBe(9950n);
    });

    it("calculates maximum with 0.5% slippage (50 bps)", () => {
        const result = applySlippageBps(10000n, 50, "max");
        // (10000 * (10000 + 50)) / 10000 = (10000 * 10050) / 10000 = 10050
        expect(result).toBe(10050n);
    });

    it("calculates minimum with 1% slippage (100 bps)", () => {
        const result = applySlippageBps(10000n, 100, "min");
        expect(result).toBe(9900n);
    });

    it("calculates maximum with 1% slippage (100 bps)", () => {
        const result = applySlippageBps(10000n, 100, "max");
        expect(result).toBe(10100n);
    });

    it("works with large amounts (1 ETH in wei)", () => {
        const oneEth = 10n ** 18n;
        const min = applySlippageBps(oneEth, 50, "min");
        const max = applySlippageBps(oneEth, 50, "max");
        expect(min).toBeLessThan(oneEth);
        expect(max).toBeGreaterThan(oneEth);
        // 0.5% of 1 ETH = 0.005 ETH = 5 * 10^15
        expect(oneEth - min).toBe(5n * 10n ** 15n);
        expect(max - oneEth).toBe(5n * 10n ** 15n);
    });
});

describe("isNative", () => {
    it("returns true when token has no address", () => {
        expect(isNative({})).toBe(true);
        expect(isNative({ address: undefined })).toBe(true);
    });

    it("returns true when token is undefined", () => {
        expect(isNative(undefined)).toBe(true);
    });

    it("returns false when token has an address", () => {
        expect(isNative({ address: "0x123" })).toBe(false);
    });

    it("returns false for empty string address", () => {
        // Empty string is falsy in JS, so isNative returns true
        expect(isNative({ address: "" })).toBe(true);
    });
});
