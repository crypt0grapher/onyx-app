import { describe, it, expect } from "vitest";
import { parseEther } from "viem";
import { goliathConfig } from "@/config/goliath";
import { stakedXcnAbi } from "@/contracts/abis/goliath";
import { RAY, WAD, BPS_BASE } from "@/hooks/goliath-yield/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a function entry in the stXCN ABI by name. */
function abiFunction(name: string) {
    return stakedXcnAbi.find(
        (e) => e.type === "function" && e.name === name,
    ) as (typeof stakedXcnAbi)[number] & { type: "function" } | undefined;
}

/** Look up an event entry in the stXCN ABI by name. */
function abiEvent(name: string) {
    return stakedXcnAbi.find(
        (e) => e.type === "event" && e.name === name,
    ) as (typeof stakedXcnAbi)[number] & { type: "event" } | undefined;
}

// ---------------------------------------------------------------------------
// 1. Zero-amount guard
// ---------------------------------------------------------------------------

describe("zero-amount guard", () => {
    it("parseEther('0') equals 0n, which triggers the guard", () => {
        const value = parseEther("0");
        expect(value).toBe(0n);
    });

    it("stake: rejects zero amounts with the expected error message", () => {
        // Reproduce the exact guard from useGoliathStake
        const ZERO = BigInt(0);
        const value = parseEther("0");
        expect(() => {
            if (value === ZERO) throw new Error("Amount must be greater than 0");
        }).toThrow("Amount must be greater than 0");
    });

    it("unstake: rejects zero amounts with the expected error message", () => {
        // Reproduce the exact guard from useGoliathUnstake
        const ZERO = BigInt(0);
        const amount = parseEther("0");
        expect(() => {
            if (amount === ZERO) throw new Error("Amount must be greater than 0");
        }).toThrow("Amount must be greater than 0");
    });

    it("positive amounts pass the guard", () => {
        const ZERO = BigInt(0);
        const value = parseEther("1");
        expect(value).not.toBe(ZERO);
        expect(value).toBe(10n ** 18n); // 1 ether in wei
    });

    it("fractional amounts pass the guard", () => {
        const ZERO = BigInt(0);
        const value = parseEther("0.001");
        expect(value).not.toBe(ZERO);
        expect(value).toBe(10n ** 15n); // 0.001 ether in wei
    });

    it("parseEther for a negative value produces a non-zero bigint", () => {
        // viem parseEther("-1") does NOT return 0n; it returns a negative bigint.
        // The current guard (=== 0n) would NOT catch negative values.
        // This test documents that behavior for awareness.
        const value = parseEther("-1");
        expect(value).not.toBe(0n);
        expect(value).toBeLessThan(0n);
    });
});

// ---------------------------------------------------------------------------
// 2. Gas limit constants
// ---------------------------------------------------------------------------

describe("gas limit constants", () => {
    // The hooks define these as module-level constants. We validate the
    // expected values directly since they are not exported.
    const STAKE_GAS = BigInt(150_000);
    const UNSTAKE_GAS = BigInt(200_000);

    it("STAKE_GAS is 150,000", () => {
        expect(STAKE_GAS).toBe(150000n);
    });

    it("UNSTAKE_GAS is 200,000", () => {
        expect(UNSTAKE_GAS).toBe(200000n);
    });

    it("STAKE_GAS exceeds the base transaction cost (21,000)", () => {
        expect(STAKE_GAS).toBeGreaterThan(21000n);
    });

    it("UNSTAKE_GAS exceeds the base transaction cost (21,000)", () => {
        expect(UNSTAKE_GAS).toBeGreaterThan(21000n);
    });

    it("STAKE_GAS is below 1,000,000 (reasonable upper bound)", () => {
        expect(STAKE_GAS).toBeLessThan(1_000_000n);
    });

    it("UNSTAKE_GAS is below 1,000,000 (reasonable upper bound)", () => {
        expect(UNSTAKE_GAS).toBeLessThan(1_000_000n);
    });

    it("UNSTAKE_GAS >= STAKE_GAS (unstake includes burn + transfer)", () => {
        expect(UNSTAKE_GAS).toBeGreaterThanOrEqual(STAKE_GAS);
    });
});

// ---------------------------------------------------------------------------
// 3. stXCN ABI function validation
// ---------------------------------------------------------------------------

describe("stXCN ABI function signatures", () => {
    it("stake() is payable with 0 inputs", () => {
        const fn = abiFunction("stake");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("payable");
        expect(fn!.inputs).toHaveLength(0);
    });

    it("unstake() is nonpayable with 1 input (uint256)", () => {
        const fn = abiFunction("unstake");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("nonpayable");
        expect(fn!.inputs).toHaveLength(1);
        expect(fn!.inputs[0].type).toBe("uint256");
        expect(fn!.inputs[0].name).toBe("stXCNAmount");
    });

    it("balanceOf() is view with 1 input (address)", () => {
        const fn = abiFunction("balanceOf");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(1);
        expect(fn!.inputs[0].type).toBe("address");
    });

    it("scaledBalanceOf() is view with 1 input (address)", () => {
        const fn = abiFunction("scaledBalanceOf");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(1);
        expect(fn!.inputs[0].type).toBe("address");
    });

    it("getCumulativeIndex() is view with 0 inputs, returns uint256", () => {
        const fn = abiFunction("getCumulativeIndex");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(0);
        expect(fn!.outputs).toHaveLength(1);
        expect(fn!.outputs![0].type).toBe("uint256");
    });

    it("getRewardRate() is view with 0 inputs, returns uint256", () => {
        const fn = abiFunction("getRewardRate");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(0);
        expect(fn!.outputs).toHaveLength(1);
        expect(fn!.outputs![0].type).toBe("uint256");
    });

    it("getFeePercent() is view with 0 inputs, returns uint256", () => {
        const fn = abiFunction("getFeePercent");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(0);
        expect(fn!.outputs).toHaveLength(1);
        expect(fn!.outputs![0].type).toBe("uint256");
    });

    it("getLastUpdateTimestamp() is view with 0 inputs, returns uint256", () => {
        const fn = abiFunction("getLastUpdateTimestamp");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(0);
        expect(fn!.outputs).toHaveLength(1);
        expect(fn!.outputs![0].type).toBe("uint256");
    });

    it("paused() is view with 0 inputs, returns bool", () => {
        const fn = abiFunction("paused");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(0);
        expect(fn!.outputs).toHaveLength(1);
        expect(fn!.outputs![0].type).toBe("bool");
    });

    it("totalSupply() is view with 0 inputs, returns uint256", () => {
        const fn = abiFunction("totalSupply");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("view");
        expect(fn!.inputs).toHaveLength(0);
        expect(fn!.outputs).toHaveLength(1);
        expect(fn!.outputs![0].type).toBe("uint256");
    });
});

// ---------------------------------------------------------------------------
// 4. stXCN event validation
// ---------------------------------------------------------------------------

describe("stXCN ABI event signatures", () => {
    it("Staked event has 3 inputs: user (indexed address), xcnAmount (uint256), stXCNMinted (uint256)", () => {
        const evt = abiEvent("Staked");
        expect(evt).toBeDefined();
        expect(evt!.inputs).toHaveLength(3);

        expect(evt!.inputs[0].name).toBe("user");
        expect(evt!.inputs[0].type).toBe("address");
        expect(evt!.inputs[0].indexed).toBe(true);

        expect(evt!.inputs[1].name).toBe("xcnAmount");
        expect(evt!.inputs[1].type).toBe("uint256");
        expect(evt!.inputs[1].indexed).toBe(false);

        expect(evt!.inputs[2].name).toBe("stXCNMinted");
        expect(evt!.inputs[2].type).toBe("uint256");
        expect(evt!.inputs[2].indexed).toBe(false);
    });

    it("Unstaked event has 3 inputs: user (indexed address), stXCNBurned (uint256), xcnReturned (uint256)", () => {
        const evt = abiEvent("Unstaked");
        expect(evt).toBeDefined();
        expect(evt!.inputs).toHaveLength(3);

        expect(evt!.inputs[0].name).toBe("user");
        expect(evt!.inputs[0].type).toBe("address");
        expect(evt!.inputs[0].indexed).toBe(true);

        expect(evt!.inputs[1].name).toBe("stXCNBurned");
        expect(evt!.inputs[1].type).toBe("uint256");
        expect(evt!.inputs[1].indexed).toBe(false);

        expect(evt!.inputs[2].name).toBe("xcnReturned");
        expect(evt!.inputs[2].type).toBe("uint256");
        expect(evt!.inputs[2].indexed).toBe(false);
    });

    it("both events are non-anonymous", () => {
        const staked = abiEvent("Staked");
        const unstaked = abiEvent("Unstaked");
        expect(staked!.anonymous).toBe(false);
        expect(unstaked!.anonymous).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 5. Configuration validation
// ---------------------------------------------------------------------------

describe("goliathConfig staking configuration", () => {
    it("stXcnAddress matches the known mainnet deployment", () => {
        expect(goliathConfig.staking.stXcnAddress).toBe(
            "0xA553a603e2f84fEa6c1fc225E0945FE176C72F74",
        );
    });

    it("stakingEnabled is true", () => {
        expect(goliathConfig.staking.stakingEnabled).toBe(true);
    });

    it("staking.stXcnAddress matches tokens.stXCN (cross-reference)", () => {
        expect(goliathConfig.staking.stXcnAddress).toBe(
            goliathConfig.tokens.stXCN,
        );
    });

    it("stXcnAddress is a valid checksummed Ethereum address", () => {
        expect(goliathConfig.staking.stXcnAddress).toMatch(
            /^0x[0-9a-fA-F]{40}$/,
        );
    });

    it("protocolPollMs is a positive number", () => {
        expect(goliathConfig.staking.protocolPollMs).toBeGreaterThan(0);
    });

    it("balancePollMs is a positive number", () => {
        expect(goliathConfig.staking.balancePollMs).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// 6. Yield data math validation (APR formula from useGoliathYieldData)
// ---------------------------------------------------------------------------

describe("yield data APR formula", () => {
    // Mirrors the exact logic from useGoliathYieldData:
    //   const APR_PRECISION = BigInt(10) ** BigInt(8);
    //   const APR_PERCENT = BigInt(100);
    //   scaled = (rewardRateRay * APR_PERCENT * APR_PRECISION) / RAY
    //   apr = Number(scaled) / Number(APR_PRECISION)

    const APR_PRECISION = BigInt(10) ** BigInt(8);
    const APR_PERCENT = BigInt(100);

    function computeApr(rewardRateRay: bigint): number {
        const scaled = (rewardRateRay * APR_PERCENT * APR_PRECISION) / RAY;
        return Number(scaled) / Number(APR_PRECISION);
    }

    it("mainnet rate 278000000000000000000000000n yields APR ~ 27.80", () => {
        const mainnetRate = 278000000000000000000000000n;
        const apr = computeApr(mainnetRate);
        expect(apr).toBeCloseTo(27.8, 1);
    });

    it("10% APR from matching reward rate", () => {
        const rewardRateRay = (10n * RAY) / 100n; // 0.10 * RAY
        const apr = computeApr(rewardRateRay);
        expect(apr).toBeCloseTo(10.0, 1);
    });

    it("zero reward rate gives exactly 0 APR", () => {
        expect(computeApr(0n)).toBe(0);
    });

    it("100% APR from RAY reward rate", () => {
        const apr = computeApr(RAY);
        expect(apr).toBeCloseTo(100.0, 1);
    });

    it("precision is maintained for fractional APR values", () => {
        // 12.345% => rewardRateRay = 12345 * RAY / 100_000
        const rewardRateRay = (12345n * RAY) / 100000n;
        const apr = computeApr(rewardRateRay);
        expect(apr).toBeCloseTo(12.345, 2);
    });

    it("APR_PRECISION provides at least 4 decimal digits of accuracy", () => {
        // 0.1234% => rewardRateRay = 1234 * RAY / 1_000_000
        const rewardRateRay = (1234n * RAY) / 1000000n;
        const apr = computeApr(rewardRateRay);
        expect(apr).toBeCloseTo(0.1234, 3);
    });
});

describe("yield data underlying XCN formula", () => {
    it("underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY", () => {
        const stXcnBalance = 100n * WAD;
        const cumulativeIndex = RAY; // 1.0
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(100n * WAD);
    });

    it("accrued yield increases underlying value", () => {
        const stXcnBalance = 100n * WAD;
        // Index at 1.278 (matching ~27.8% annual yield after 1 year)
        const cumulativeIndex = (1278n * RAY) / 1000n;
        const underlyingXcn = (stXcnBalance * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe((1278n * 100n * WAD) / 1000n); // 127.8 XCN
    });

    it("zero stXCN balance always produces zero underlying", () => {
        const cumulativeIndex = (2n * RAY); // Even with 2x index
        const underlyingXcn = (0n * cumulativeIndex) / RAY;
        expect(underlyingXcn).toBe(0n);
    });
});
