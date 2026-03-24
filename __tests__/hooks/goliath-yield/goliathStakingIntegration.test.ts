import { describe, it, expect } from "vitest";
import { parseEther } from "viem";
import { goliathConfig } from "@/config/goliath";
import { stakedXcnAbi } from "@/contracts/abis/goliath";
import {
    RAY,
    WAD,
    SECONDS_PER_YEAR,
    BPS_BASE,
} from "@/hooks/goliath-yield/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AbiEntry = (typeof stakedXcnAbi)[number];
type AbiFn = Extract<AbiEntry, { type: "function" }>;

/** Find a function entry in the ABI by name. */
function findFn(name: string): AbiFn | undefined {
    return stakedXcnAbi.find(
        (e): e is AbiFn => e.type === "function" && e.name === name,
    );
}

// Gas constants mirrored from the hook source files.
const STAKE_GAS = 150_000n;
const UNSTAKE_GAS = 200_000n;

// ---------------------------------------------------------------------------
// 1. stXCN configuration
// ---------------------------------------------------------------------------

describe("stXCN configuration", () => {
    it("staking.stXcnAddress is the expected address", () => {
        expect(goliathConfig.staking.stXcnAddress).toBe(
            "0xA553a603e2f84fEa6c1fc225E0945FE176C72F74",
        );
    });

    it("staking.stakingEnabled is true by default", () => {
        expect(goliathConfig.staking.stakingEnabled).toBe(true);
    });

    it("staking.protocolPollMs is greater than 0", () => {
        expect(goliathConfig.staking.protocolPollMs).toBeGreaterThan(0);
    });

    it("staking.balancePollMs is greater than 0", () => {
        expect(goliathConfig.staking.balancePollMs).toBeGreaterThan(0);
    });

    it("staking.stXcnAddress matches tokens.stXCN (consistency)", () => {
        expect(goliathConfig.staking.stXcnAddress).toBe(
            goliathConfig.tokens.stXCN,
        );
    });

    it("stXcnAddress is a valid Ethereum address", () => {
        expect(goliathConfig.staking.stXcnAddress).toMatch(
            /^0x[0-9a-fA-F]{40}$/,
        );
    });
});

// ---------------------------------------------------------------------------
// 2. stakedXCN ABI
// ---------------------------------------------------------------------------

describe("stakedXCN ABI", () => {
    it("has stake function (payable, no args besides value)", () => {
        const fn = findFn("stake");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("payable");
        expect(fn!.inputs).toHaveLength(0);
    });

    it("has unstake function with args [amount: uint256]", () => {
        const fn = findFn("unstake");
        expect(fn).toBeDefined();
        expect(fn!.inputs).toHaveLength(1);
        expect(fn!.inputs[0].type).toBe("uint256");
    });

    it("has totalSupply view function", () => {
        const fn = findFn("totalSupply");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });

    it("has balanceOf view function", () => {
        const fn = findFn("balanceOf");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });

    it("has scaledBalanceOf view function", () => {
        const fn = findFn("scaledBalanceOf");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });

    it("has getCumulativeIndex view function", () => {
        const fn = findFn("getCumulativeIndex");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });

    it("has getRewardRate view function", () => {
        const fn = findFn("getRewardRate");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });

    it("has getFeePercent view function", () => {
        const fn = findFn("getFeePercent");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });

    it("has getLastUpdateTimestamp view function", () => {
        const fn = findFn("getLastUpdateTimestamp");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });

    it("has paused view function", () => {
        const fn = findFn("paused");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
    });
});

// ---------------------------------------------------------------------------
// 3. Yield math -- underlying XCN from stXCN
// ---------------------------------------------------------------------------

describe("Yield math - underlying XCN from stXCN", () => {
    it("with index 1.0 (RAY): 100 stXCN = 100 XCN", () => {
        const stXcnBalance = 100n * WAD;
        const cumulativeIndex = RAY; // 1.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(100n * WAD);
    });

    it("with index 1.5: 100 stXCN = 150 XCN", () => {
        const stXcnBalance = 100n * WAD;
        const cumulativeIndex = (15n * RAY) / 10n; // 1.5
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(150n * WAD);
    });

    it("with index 2.0: 50 stXCN = 100 XCN", () => {
        const stXcnBalance = 50n * WAD;
        const cumulativeIndex = 2n * RAY; // 2.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(100n * WAD);
    });

    it("with index 1.1: 1000 stXCN = 1100 XCN", () => {
        const stXcnBalance = 1000n * WAD;
        const cumulativeIndex = (11n * RAY) / 10n; // 1.1
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(1100n * WAD);
    });

    it("with zero balance: result is 0", () => {
        const stXcnBalance = 0n;
        const cumulativeIndex = (15n * RAY) / 10n;
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(0n);
    });

    it("formula: underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY", () => {
        // Verify the formula directly with an arbitrary index (1.23)
        const stXcnBalance = 200n * WAD;
        const cumulativeIndex = (123n * RAY) / 100n; // 1.23
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(246n * WAD); // 200 * 1.23 = 246
    });
});

// ---------------------------------------------------------------------------
// 4. APR calculation from reward rate
// ---------------------------------------------------------------------------

describe("APR calculation from reward rate", () => {
    /**
     * The protocol formula (from useGoliathYieldData):
     *   apr = (rewardRateRay * SECONDS_PER_YEAR * 100) / RAY
     *
     * To derive rewardRateRay for a target APR:
     *   rewardRateRay = targetApr * RAY / (SECONDS_PER_YEAR * 100)
     */

    const computeApr = (rewardRateRay: bigint): number => {
        const aprScaled =
            (rewardRateRay * SECONDS_PER_YEAR * 100n) / RAY;
        return Number(aprScaled);
    };

    it("5% APR: result should be approximately 5", () => {
        const rewardRateRay = (5n * RAY) / (SECONDS_PER_YEAR * 100n);
        const apr = computeApr(rewardRateRay);
        expect(apr).toBeGreaterThanOrEqual(4);
        expect(apr).toBeLessThanOrEqual(6);
    });

    it("20% APR: result should be approximately 20", () => {
        const rewardRateRay = (20n * RAY) / (SECONDS_PER_YEAR * 100n);
        const apr = computeApr(rewardRateRay);
        expect(apr).toBeGreaterThanOrEqual(19);
        expect(apr).toBeLessThanOrEqual(21);
    });

    it("0% APR: result should be 0", () => {
        const apr = computeApr(0n);
        expect(apr).toBe(0);
    });

    it("100% APR: result should be approximately 100", () => {
        const rewardRateRay = (100n * RAY) / (SECONDS_PER_YEAR * 100n);
        const apr = computeApr(rewardRateRay);
        expect(apr).toBeGreaterThanOrEqual(99);
        expect(apr).toBeLessThanOrEqual(101);
    });

    it("higher reward rate always gives higher APR (monotonic)", () => {
        const lowRate = (5n * RAY) / (SECONDS_PER_YEAR * 100n);
        const midRate = (20n * RAY) / (SECONDS_PER_YEAR * 100n);
        const highRate = (100n * RAY) / (SECONDS_PER_YEAR * 100n);

        const lowApr = computeApr(lowRate);
        const midApr = computeApr(midRate);
        const highApr = computeApr(highRate);

        expect(midApr).toBeGreaterThan(lowApr);
        expect(highApr).toBeGreaterThan(midApr);
    });
});

// ---------------------------------------------------------------------------
// 5. Fee deduction
// ---------------------------------------------------------------------------

describe("Fee deduction", () => {
    it("100 BPS (1%) fee on 1000 WAD = 10 WAD fee", () => {
        const amount = 1000n * WAD;
        const feeBps = 100n;
        const fee = (amount * feeBps) / BPS_BASE;
        expect(fee).toBe(10n * WAD);
    });

    it("50 BPS (0.5%) fee on 1000 WAD = 5 WAD fee", () => {
        const amount = 1000n * WAD;
        const feeBps = 50n;
        const fee = (amount * feeBps) / BPS_BASE;
        expect(fee).toBe(5n * WAD);
    });

    it("0 BPS fee = 0", () => {
        const amount = 1000n * WAD;
        const fee = (amount * 0n) / BPS_BASE;
        expect(fee).toBe(0n);
    });

    it("net amount = amount - fee", () => {
        const amount = 1000n * WAD;
        const feeBps = 100n;
        const fee = (amount * feeBps) / BPS_BASE;
        const net = amount - fee;
        expect(net).toBe(990n * WAD);
    });

    it("formula: fee = (amount * feeBps) / BPS_BASE", () => {
        // 250 BPS (2.5%) on 2000 WAD = 50 WAD
        const amount = 2000n * WAD;
        const feeBps = 250n;
        const fee = (amount * feeBps) / BPS_BASE;
        expect(fee).toBe(50n * WAD);
    });
});

// ---------------------------------------------------------------------------
// 6. Stake/unstake validation
// ---------------------------------------------------------------------------

describe("Stake/unstake validation", () => {
    it("parseEther('0') should equal 0n", () => {
        const value = parseEther("0");
        expect(value).toBe(0n);
    });

    it("parseEther('1') should be > 0n", () => {
        const value = parseEther("1");
        expect(value).toBeGreaterThan(0n);
    });

    it("parseEther('0.001') should be > 0n (smallest valid amount)", () => {
        const value = parseEther("0.001");
        expect(value).toBeGreaterThan(0n);
    });

    it("parseEther('1000000') should be valid (large amount)", () => {
        const value = parseEther("1000000");
        expect(value).toBeGreaterThan(0n);
        expect(value).toBe(1_000_000n * WAD);
    });

    it("STAKE_GAS is 150000n", () => {
        expect(STAKE_GAS).toBe(150_000n);
    });

    it("UNSTAKE_GAS is 200000n", () => {
        expect(UNSTAKE_GAS).toBe(200_000n);
    });
});

// ---------------------------------------------------------------------------
// 7. Exchange rate scenarios
// ---------------------------------------------------------------------------

describe("Exchange rate scenarios", () => {
    it("early staker with low index: close to 1:1", () => {
        const stXcnBalance = 500n * WAD;
        // Slightly above 1.0 -- e.g. 1.001
        const cumulativeIndex = (1001n * RAY) / 1000n;
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;

        // Should be very close to 500 WAD but slightly above
        expect(underlyingXcn).toBeGreaterThanOrEqual(500n * WAD);
        expect(underlyingXcn).toBeLessThan(501n * WAD);
    });

    it("late staker with high index: 1 stXCN worth multiple XCN", () => {
        const stXcnBalance = 1n * WAD; // 1 stXCN
        const cumulativeIndex = 5n * RAY; // index = 5.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(5n * WAD);
    });

    it("precision: no precision loss for amounts < 10^18 WAD", () => {
        // Test that multiplying a sub-WAD amount by index and dividing by RAY
        // preserves the expected value without rounding artifacts when
        // the numbers divide evenly.
        const stXcnBalance = WAD / 2n; // 0.5 stXCN
        const cumulativeIndex = 2n * RAY; // index = 2.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(WAD); // 0.5 * 2.0 = 1.0
    });

    it("large amounts (10M XCN) do not overflow", () => {
        const stXcnBalance = 10_000_000n * WAD; // 10M stXCN
        const cumulativeIndex = 3n * RAY; // index = 3.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(30_000_000n * WAD);
    });
});
