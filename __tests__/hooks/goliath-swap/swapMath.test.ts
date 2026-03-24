import { describe, it, expect } from "vitest";
import {
    getAmountOut,
    getAmountIn,
    calculatePriceImpactBps,
    applySlippageMinimum,
    applySlippageMaximum,
    computePairAddress,
    findBestRoute,
    type PairData,
} from "@/utils/goliathSwap";
import { parseEther, type Address } from "viem";

describe("getAmountOut", () => {
    it("matches Uniswap V2 formula", () => {
        const amountIn = parseEther("1"); // 1 token
        const reserveIn = parseEther("100"); // 100 tokens
        const reserveOut = parseEther("200"); // 200 tokens

        const out = getAmountOut(amountIn, reserveIn, reserveOut);
        // Expected: (1 * 997 * 200) / (100 * 1000 + 1 * 997)
        // = (997 * 200) / (100000 + 997) = 199400 / 100997 ~ 1.974
        expect(out).toBeGreaterThan(parseEther("1.97"));
        expect(out).toBeLessThan(parseEther("1.98"));
    });

    it("returns 0 for zero input", () => {
        expect(getAmountOut(0n, 100n, 200n)).toBe(0n);
    });

    it("returns 0 for zero reserves", () => {
        expect(getAmountOut(100n, 0n, 200n)).toBe(0n);
        expect(getAmountOut(100n, 200n, 0n)).toBe(0n);
    });

    it("returns 0 for negative input", () => {
        expect(getAmountOut(-1n, 100n, 200n)).toBe(0n);
    });

    it("produces smaller output relative to input as trade grows", () => {
        const reserveIn = parseEther("10000");
        const reserveOut = parseEther("10000");

        const out1 = getAmountOut(parseEther("1"), reserveIn, reserveOut);
        const out10 = getAmountOut(parseEther("10"), reserveIn, reserveOut);
        const out100 = getAmountOut(parseEther("100"), reserveIn, reserveOut);

        // Each successive trade gets worse price per unit
        const price1 = (out1 * 10000n) / parseEther("1");
        const price10 = (out10 * 10000n) / parseEther("10");
        const price100 = (out100 * 10000n) / parseEther("100");

        expect(price1).toBeGreaterThan(price10);
        expect(price10).toBeGreaterThan(price100);
    });

    it("accounts for 0.3% fee", () => {
        const amountIn = parseEther("1000");
        const reserveIn = parseEther("1000000");
        const reserveOut = parseEther("1000000");

        const out = getAmountOut(amountIn, reserveIn, reserveOut);
        // Without fee: 1000 * 1000000 / (1000000 + 1000) = ~999.001
        // With fee the output should be less
        expect(out).toBeLessThan(parseEther("999.001"));
        // But still close to 997 (fee-adjusted)
        expect(out).toBeGreaterThan(parseEther("995"));
    });
});

describe("getAmountIn", () => {
    it("inverse of getAmountOut", () => {
        const reserveIn = parseEther("100");
        const reserveOut = parseEther("200");

        const out = getAmountOut(parseEther("1"), reserveIn, reserveOut);
        const inBack = getAmountIn(out, reserveIn, reserveOut);

        // Should be approximately 1 ETH (within rounding)
        expect(inBack).toBeGreaterThanOrEqual(parseEther("1"));
        expect(inBack).toBeLessThan(parseEther("1.001"));
    });

    it("returns 0 when amountOut >= reserveOut", () => {
        expect(getAmountIn(200n, 100n, 200n)).toBe(0n);
    });

    it("returns 0 for zero amountOut", () => {
        expect(getAmountIn(0n, 100n, 200n)).toBe(0n);
    });

    it("returns 0 for zero reserves", () => {
        expect(getAmountIn(50n, 0n, 200n)).toBe(0n);
        expect(getAmountIn(50n, 200n, 0n)).toBe(0n);
    });

    it("round-trips correctly for various amounts", () => {
        const reserveIn = parseEther("5000");
        const reserveOut = parseEther("8000");

        for (const amtStr of ["0.1", "1", "10", "100"]) {
            const amtIn = parseEther(amtStr);
            const out = getAmountOut(amtIn, reserveIn, reserveOut);
            const recoveredIn = getAmountIn(out, reserveIn, reserveOut);
            // Recovered should be >= original (rounding up) and very close
            expect(recoveredIn).toBeGreaterThanOrEqual(amtIn);
            expect(recoveredIn - amtIn).toBeLessThanOrEqual(1n);
        }
    });
});

describe("slippage", () => {
    it("minimum reduces amount", () => {
        expect(applySlippageMinimum(10000n, 50)).toBe(9950n); // 0.5%
        expect(applySlippageMinimum(10000n, 100)).toBe(9900n); // 1%
    });

    it("maximum increases amount", () => {
        expect(applySlippageMaximum(10000n, 50)).toBe(10050n);
        expect(applySlippageMaximum(10000n, 100)).toBe(10100n);
    });

    it("zero slippage returns original amount", () => {
        expect(applySlippageMinimum(10000n, 0)).toBe(10000n);
        expect(applySlippageMaximum(10000n, 0)).toBe(10000n);
    });

    it("works with large amounts (1 ETH in wei)", () => {
        const oneEth = parseEther("1");
        const min = applySlippageMinimum(oneEth, 50); // 0.5%
        const max = applySlippageMaximum(oneEth, 50);
        expect(min).toBeLessThan(oneEth);
        expect(max).toBeGreaterThan(oneEth);
        expect(oneEth - min).toBe(5n * 10n ** 15n);
        expect(max - oneEth).toBe(5n * 10n ** 15n);
    });
});

describe("priceImpact", () => {
    it("small trade has low impact", () => {
        const amountIn = parseEther("1");
        const reserveIn = parseEther("10000");
        const reserveOut = parseEther("10000");
        const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);

        const impact = calculatePriceImpactBps(
            amountIn,
            amountOut,
            reserveIn,
            reserveOut,
        );
        expect(impact).toBeLessThan(100n); // < 1%
    });

    it("large trade has higher impact", () => {
        const amountIn = parseEther("1000");
        const reserveIn = parseEther("10000");
        const reserveOut = parseEther("10000");
        const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);

        const impact = calculatePriceImpactBps(
            amountIn,
            amountOut,
            reserveIn,
            reserveOut,
        );
        expect(impact).toBeGreaterThan(100n); // > 1%
    });

    it("returns 0 when reserves or input are zero", () => {
        expect(calculatePriceImpactBps(0n, 0n, 100n, 200n)).toBe(0n);
        expect(calculatePriceImpactBps(100n, 50n, 0n, 200n)).toBe(0n);
    });

    it("larger trades produce larger impact", () => {
        const reserveIn = parseEther("10000");
        const reserveOut = parseEther("10000");

        const smallIn = parseEther("10");
        const smallOut = getAmountOut(smallIn, reserveIn, reserveOut);
        const smallImpact = calculatePriceImpactBps(
            smallIn,
            smallOut,
            reserveIn,
            reserveOut,
        );

        const largeIn = parseEther("1000");
        const largeOut = getAmountOut(largeIn, reserveIn, reserveOut);
        const largeImpact = calculatePriceImpactBps(
            largeIn,
            largeOut,
            reserveIn,
            reserveOut,
        );

        expect(largeImpact).toBeGreaterThan(smallImpact);
    });
});

describe("computePairAddress", () => {
    it("produces a valid address", () => {
        const factory =
            "0x561B0342878bcdeF1a7E7D9BA7654B3C84A81819" as Address;
        const tokenA =
            "0x88A07F7BBb61A2945D8Ac541461fc62efb1F4066" as Address;
        const tokenB =
            "0x4BE65Dce1D79B8728485B759eE06cC8053E824F4" as Address;
        const initCodeHash =
            "0x29ac827a7d364439c40cf6909f17f7f9144875302b275bae9498ac55cafc04ea" as `0x${string}`;

        const pair = computePairAddress(
            factory,
            tokenA,
            tokenB,
            initCodeHash,
        );
        expect(pair).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("is order-independent", () => {
        const factory =
            "0x561B0342878bcdeF1a7E7D9BA7654B3C84A81819" as Address;
        const tokenA =
            "0x88A07F7BBb61A2945D8Ac541461fc62efb1F4066" as Address;
        const tokenB =
            "0x4BE65Dce1D79B8728485B759eE06cC8053E824F4" as Address;
        const initCodeHash =
            "0x29ac827a7d364439c40cf6909f17f7f9144875302b275bae9498ac55cafc04ea" as `0x${string}`;

        const pair1 = computePairAddress(
            factory,
            tokenA,
            tokenB,
            initCodeHash,
        );
        const pair2 = computePairAddress(
            factory,
            tokenB,
            tokenA,
            initCodeHash,
        );
        expect(pair1).toBe(pair2);
    });

    it("different tokens produce different addresses", () => {
        const factory =
            "0x561B0342878bcdeF1a7E7D9BA7654B3C84A81819" as Address;
        const tokenA =
            "0x88A07F7BBb61A2945D8Ac541461fc62efb1F4066" as Address;
        const tokenB =
            "0x4BE65Dce1D79B8728485B759eE06cC8053E824F4" as Address;
        const tokenC =
            "0x1111111111111111111111111111111111111111" as Address;
        const initCodeHash =
            "0x29ac827a7d364439c40cf6909f17f7f9144875302b275bae9498ac55cafc04ea" as `0x${string}`;

        const pairAB = computePairAddress(
            factory,
            tokenA,
            tokenB,
            initCodeHash,
        );
        const pairAC = computePairAddress(
            factory,
            tokenA,
            tokenC,
            initCodeHash,
        );
        expect(pairAB).not.toBe(pairAC);
    });
});

describe("findBestRoute", () => {
    const tokenA =
        "0x1000000000000000000000000000000000000001" as Address;
    const tokenB =
        "0x2000000000000000000000000000000000000002" as Address;
    const tokenC =
        "0x3000000000000000000000000000000000000003" as Address;

    it("finds direct route", () => {
        const pairs: PairData[] = [
            {
                pairAddress:
                    "0x0000000000000000000000000000000000000000" as Address,
                token0: tokenA,
                token1: tokenB,
                reserve0: parseEther("1000"),
                reserve1: parseEther("2000"),
            },
        ];

        const route = findBestRoute(
            pairs,
            tokenA,
            tokenB,
            parseEther("1"),
            [],
        );
        expect(route).not.toBeNull();
        expect(route!.path).toEqual([tokenA, tokenB]);
        expect(route!.outputAmount).toBeGreaterThan(0n);
    });

    it("finds route through base token", () => {
        const pairs: PairData[] = [
            {
                pairAddress:
                    "0x0000000000000000000000000000000000000001" as Address,
                token0: tokenA,
                token1: tokenC,
                reserve0: parseEther("1000"),
                reserve1: parseEther("1000"),
            },
            {
                pairAddress:
                    "0x0000000000000000000000000000000000000002" as Address,
                token0: tokenC,
                token1: tokenB,
                reserve0: parseEther("1000"),
                reserve1: parseEther("1000"),
            },
        ];

        const route = findBestRoute(
            pairs,
            tokenA,
            tokenB,
            parseEther("1"),
            [tokenC],
        );
        expect(route).not.toBeNull();
        expect(route!.path).toEqual([tokenA, tokenC, tokenB]);
    });

    it("returns null when no route exists", () => {
        const route = findBestRoute(
            [],
            tokenA,
            tokenB,
            parseEther("1"),
            [],
        );
        expect(route).toBeNull();
    });

    it("prefers route with better output", () => {
        // Direct route with poor liquidity
        const directPair: PairData = {
            pairAddress:
                "0x0000000000000000000000000000000000000010" as Address,
            token0: tokenA,
            token1: tokenB,
            reserve0: parseEther("10"),
            reserve1: parseEther("10"),
        };

        // Indirect route with deeper liquidity
        const pair1: PairData = {
            pairAddress:
                "0x0000000000000000000000000000000000000011" as Address,
            token0: tokenA,
            token1: tokenC,
            reserve0: parseEther("100000"),
            reserve1: parseEther("100000"),
        };
        const pair2: PairData = {
            pairAddress:
                "0x0000000000000000000000000000000000000012" as Address,
            token0: tokenC,
            token1: tokenB,
            reserve0: parseEther("100000"),
            reserve1: parseEther("100000"),
        };

        const route = findBestRoute(
            [directPair, pair1, pair2],
            tokenA,
            tokenB,
            parseEther("5"),
            [tokenC],
        );

        expect(route).not.toBeNull();
        // The indirect route through deep pools should give a better output
        // than the shallow direct pair for a 5 ETH trade
        expect(route!.path).toEqual([tokenA, tokenC, tokenB]);
    });

    it("route output includes price impact", () => {
        const pairs: PairData[] = [
            {
                pairAddress:
                    "0x0000000000000000000000000000000000000000" as Address,
                token0: tokenA,
                token1: tokenB,
                reserve0: parseEther("10000"),
                reserve1: parseEther("10000"),
            },
        ];

        const route = findBestRoute(
            pairs,
            tokenA,
            tokenB,
            parseEther("100"),
            [],
        );
        expect(route).not.toBeNull();
        expect(route!.priceImpactBps).toBeGreaterThan(0n);
    });
});
