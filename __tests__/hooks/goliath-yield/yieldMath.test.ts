import { describe, it, expect } from "vitest";
import {
    RAY,
    WAD,
    SECONDS_PER_YEAR,
    BPS_BASE,
} from "@/hooks/goliath-yield/types";

describe("yield math constants", () => {
    it("RAY is 10^27", () => {
        expect(RAY).toBe(10n ** 27n);
    });

    it("WAD is 10^18", () => {
        expect(WAD).toBe(10n ** 18n);
    });

    it("SECONDS_PER_YEAR is correct", () => {
        expect(SECONDS_PER_YEAR).toBe(31536000n);
        // 365 * 24 * 60 * 60 = 31536000
        expect(SECONDS_PER_YEAR).toBe(BigInt(365 * 24 * 60 * 60));
    });

    it("BPS_BASE is 10000", () => {
        expect(BPS_BASE).toBe(10000n);
    });
});

describe("underlying XCN calculation", () => {
    it("calculates correctly with 1:1 index", () => {
        const stXcnBalance = 100n * WAD; // 100 stXCN
        const cumulativeIndex = RAY; // 1.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(100n * WAD);
    });

    it("calculates correctly with 1.5x index", () => {
        const stXcnBalance = 100n * WAD;
        const cumulativeIndex = (15n * RAY) / 10n; // 1.5
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(150n * WAD);
    });

    it("calculates correctly with 2x index", () => {
        const stXcnBalance = 50n * WAD;
        const cumulativeIndex = 2n * RAY; // 2.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(100n * WAD);
    });

    it("handles zero balance", () => {
        const underlyingXcn = (0n * RAY) / RAY;
        expect(underlyingXcn).toBe(0n);
    });

    it("handles very small balances", () => {
        const stXcnBalance = 1n; // 1 wei of stXCN
        const cumulativeIndex = RAY; // 1.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(1n);
    });

    it("earned yield equals underlying minus principal", () => {
        const principal = 100n * WAD;
        const cumulativeIndex = (12n * RAY) / 10n; // 1.2x index
        const underlying = (principal * cumulativeIndex) / RAY;
        const earned = underlying - principal;
        expect(earned).toBe(20n * WAD); // 20% yield
    });
});

describe("APR calculation", () => {
    // rewardRateRay is an ANNUAL rate in Ray (1e27 = 100%).
    // APR = (rewardRateRay * 100) / RAY
    // To derive rewardRateRay for a target APR: rewardRateRay = targetApr * RAY / 100

    it("calculates APR from annual reward rate", () => {
        // 10% APR => rewardRateRay = 0.10 * RAY
        const rewardRateRay = (10n * RAY) / 100n;
        const aprScaled = (rewardRateRay * 100n) / RAY;
        const apr = Number(aprScaled);
        expect(apr).toBe(10);
    });

    it("27.8% APR (Goliath mainnet rate)", () => {
        // rewardRateRay = 278000000000000000000000000n (0.278 * RAY)
        const rewardRateRay = 278000000000000000000000000n;
        const aprScaled = (rewardRateRay * 100n) / RAY;
        const apr = Number(aprScaled);
        expect(apr).toBe(27);
    });

    it("zero reward rate gives zero APR", () => {
        const rewardRateRay = 0n;
        const aprScaled = (rewardRateRay * 100n) / RAY;
        expect(aprScaled).toBe(0n);
    });

    it("higher reward rate gives higher APR", () => {
        const lowRate = (10n * RAY) / 100n;  // 10%
        const highRate = (20n * RAY) / 100n; // 20%

        const lowApr = (lowRate * 100n) / RAY;
        const highApr = (highRate * 100n) / RAY;

        expect(highApr).toBeGreaterThan(lowApr);
    });
});

describe("fee calculation", () => {
    it("computes fee from BPS", () => {
        const amount = 1000n * WAD;
        const feeBps = 100n; // 1%
        const fee = (amount * feeBps) / BPS_BASE;
        expect(fee).toBe(10n * WAD);
    });

    it("net amount equals amount minus fee", () => {
        const amount = 1000n * WAD;
        const feeBps = 50n; // 0.5%
        const fee = (amount * feeBps) / BPS_BASE;
        const net = amount - fee;
        expect(net).toBe(995n * WAD);
    });

    it("zero fee BPS produces no fee", () => {
        const amount = 1000n * WAD;
        const fee = (amount * 0n) / BPS_BASE;
        expect(fee).toBe(0n);
    });
});
