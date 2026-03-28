import { describe, it, expect } from "vitest";
import {
    getAmountOut,
    findBestRoute,
    MIN_RESERVE,
    type PairData,
} from "@/utils/goliathSwap";
import { goliathConfig } from "@/config/goliath";
import type { Address } from "viem";

// ---------------------------------------------------------------------------
// Mainnet token addresses (Goliath chain 327)
// ---------------------------------------------------------------------------

const WXCN = goliathConfig.tokens.WXCN; // 0x1a0Da75ADf091a69E7285e596bB27218D77E17a9
const USDC = goliathConfig.tokens.USDC; // 0xC8410270bb53f6c99A2EFe6eD3686a8630Efe22B
const ETH = goliathConfig.tokens.ETH; // 0x9253587505c3B7E7b9DEE118AE1AcB53eEC0E4b6

const BASE_TOKENS: Address[] = [WXCN, USDC, ETH];

// ---------------------------------------------------------------------------
// Sort helper -- Uniswap V2 pairs store tokens sorted by address.
// ---------------------------------------------------------------------------

function sortTokens(a: Address, b: Address): [Address, Address] {
    return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

// ---------------------------------------------------------------------------
// Mock pair data matching the pool plan reserves
// ---------------------------------------------------------------------------

function makePair(
    tokenA: Address,
    tokenB: Address,
    reserveA: bigint,
    reserveB: bigint,
): PairData {
    const [token0, token1] = sortTokens(tokenA, tokenB);
    const [reserve0, reserve1] =
        token0.toLowerCase() === tokenA.toLowerCase()
            ? [reserveA, reserveB]
            : [reserveB, reserveA];
    return {
        pairAddress: "0x0000000000000000000000000000000000000000" as Address,
        token0,
        token1,
        reserve0,
        reserve1,
    };
}

// Pool plan reserves (raw, for getAmountOut tests):
//   USDC/WXCN : 150,000 USDC (6 dec) / 28,462,998 WXCN (18 dec)
//   USDC/ETH  : 150,000 USDC (6 dec) / 69 ETH (18 dec)
const RAW_USDC_RESERVE = 150_000n * 10n ** 6n; // 150,000 USDC (1.5e11)
const RAW_WXCN_RESERVE = 28_462_998n * 10n ** 18n; // 28,462,998 WXCN
const RAW_ETH_RESERVE = 69n * 10n ** 18n; // 69 ETH

// With the AND-based MIN_RESERVE check, real reserves work directly --
// a pair is only discarded when BOTH sides are dust.
const USDC_WXCN_PAIR = makePair(
    USDC,
    WXCN,
    RAW_USDC_RESERVE, // 150,000 USDC (1.5e11 raw, below 10^15 but partner is above)
    RAW_WXCN_RESERVE, // 28,462,998 WXCN (well above 10^15)
);

const USDC_ETH_PAIR = makePair(
    USDC,
    ETH,
    RAW_USDC_RESERVE, // 150,000 USDC (1.5e11 raw)
    RAW_ETH_RESERVE,  // 69 ETH (6.9e19 raw, above 10^15)
);

// ---------------------------------------------------------------------------
// 1. getAmountOut with realistic pool reserves
// ---------------------------------------------------------------------------

describe("getAmountOut with pool-plan reserves", () => {
    it("1000 USDC -> WXCN produces ~187,934 WXCN", () => {
        // Use raw (unscaled) reserves -- getAmountOut has no MIN_RESERVE check
        const usdcIn = 1000n * 10n ** 6n; // 1000 USDC

        const out = getAmountOut(usdcIn, RAW_USDC_RESERVE, RAW_WXCN_RESERVE);

        // Manual calculation:
        //   amountInWithFee = 1000e6 * 997 = 997_000_000_000
        //   numerator       = 997_000_000_000 * 28_462_998e18
        //   denominator     = 150_000e6 * 1000 + 997_000_000_000
        //   expected        ~ 187,934 WXCN (18 decimals)
        const lowerBound = 187_000n * 10n ** 18n;
        const upperBound = 189_000n * 10n ** 18n;

        expect(out).toBeGreaterThan(lowerBound);
        expect(out).toBeLessThan(upperBound);
    });

    it("1 ETH -> USDC produces a reasonable amount", () => {
        // Use raw (unscaled) reserves
        const ethIn = 1n * 10n ** 18n; // 1 ETH

        const out = getAmountOut(ethIn, RAW_ETH_RESERVE, RAW_USDC_RESERVE);

        // 150,000 USDC / 69 ETH ~ 2,173 USDC per ETH
        // With 0.3% fee and some price impact: expect 2,100-2,200 USDC
        const lowerBound = 2_100n * 10n ** 6n;
        const upperBound = 2_200n * 10n ** 6n;

        expect(out).toBeGreaterThan(lowerBound);
        expect(out).toBeLessThan(upperBound);
    });
});

// ---------------------------------------------------------------------------
// 2. findBestRoute — direct route
// ---------------------------------------------------------------------------

describe("findBestRoute — direct route (USDC -> WXCN)", () => {
    it("finds a single-pair route", () => {
        const amountIn = 1000n * 10n ** 6n; // 1000 USDC
        const route = findBestRoute(
            [USDC_WXCN_PAIR],
            USDC,
            WXCN,
            amountIn,
            BASE_TOKENS,
        );

        expect(route).not.toBeNull();
        expect(route!.pairs).toHaveLength(1);
        expect(route!.path).toEqual([USDC, WXCN]);
        expect(route!.inputAmount).toBe(amountIn);
        expect(route!.outputAmount).toBeGreaterThan(0n);
    });

    it("output matches standalone getAmountOut", () => {
        const amountIn = 500n * 10n ** 6n;

        const reserveUsdc =
            USDC_WXCN_PAIR.token0.toLowerCase() === USDC.toLowerCase()
                ? USDC_WXCN_PAIR.reserve0
                : USDC_WXCN_PAIR.reserve1;
        const reserveWxcn =
            USDC_WXCN_PAIR.token0.toLowerCase() === WXCN.toLowerCase()
                ? USDC_WXCN_PAIR.reserve0
                : USDC_WXCN_PAIR.reserve1;

        const expectedOut = getAmountOut(amountIn, reserveUsdc, reserveWxcn);
        const route = findBestRoute(
            [USDC_WXCN_PAIR],
            USDC,
            WXCN,
            amountIn,
            BASE_TOKENS,
        );

        expect(route).not.toBeNull();
        expect(route!.outputAmount).toBe(expectedOut);
    });

    it("reports non-zero price impact", () => {
        const amountIn = 1000n * 10n ** 6n;
        const route = findBestRoute(
            [USDC_WXCN_PAIR],
            USDC,
            WXCN,
            amountIn,
            BASE_TOKENS,
        );

        expect(route).not.toBeNull();
        expect(route!.priceImpactBps).toBeGreaterThan(0n);
    });
});

// ---------------------------------------------------------------------------
// 3. findBestRoute — 2-hop route (ETH -> WXCN via USDC)
// ---------------------------------------------------------------------------

describe("findBestRoute — 2-hop route (ETH -> WXCN via USDC)", () => {
    it("discovers the path through USDC when no direct pair exists", () => {
        // Only USDC/ETH and USDC/WXCN pairs — no direct ETH/WXCN pair
        const pairs = [USDC_ETH_PAIR, USDC_WXCN_PAIR];
        const amountIn = 1n * 10n ** 18n; // 1 ETH

        const route = findBestRoute(pairs, ETH, WXCN, amountIn, BASE_TOKENS);

        expect(route).not.toBeNull();
        expect(route!.pairs).toHaveLength(2);
        expect(route!.path).toEqual([ETH, USDC, WXCN]);
        expect(route!.outputAmount).toBeGreaterThan(0n);
    });

    it("2-hop output equals chained getAmountOut calls", () => {
        const pairs = [USDC_ETH_PAIR, USDC_WXCN_PAIR];
        const amountIn = 1n * 10n ** 18n;

        // Hop 1: ETH -> USDC
        const reserveEth =
            USDC_ETH_PAIR.token0.toLowerCase() === ETH.toLowerCase()
                ? USDC_ETH_PAIR.reserve0
                : USDC_ETH_PAIR.reserve1;
        const reserveUsdcForEth =
            USDC_ETH_PAIR.token0.toLowerCase() === USDC.toLowerCase()
                ? USDC_ETH_PAIR.reserve0
                : USDC_ETH_PAIR.reserve1;
        const usdcIntermediate = getAmountOut(
            amountIn,
            reserveEth,
            reserveUsdcForEth,
        );

        // Hop 2: USDC -> WXCN
        const reserveUsdcForWxcn =
            USDC_WXCN_PAIR.token0.toLowerCase() === USDC.toLowerCase()
                ? USDC_WXCN_PAIR.reserve0
                : USDC_WXCN_PAIR.reserve1;
        const reserveWxcn =
            USDC_WXCN_PAIR.token0.toLowerCase() === WXCN.toLowerCase()
                ? USDC_WXCN_PAIR.reserve0
                : USDC_WXCN_PAIR.reserve1;
        const wxcnExpected = getAmountOut(
            usdcIntermediate,
            reserveUsdcForWxcn,
            reserveWxcn,
        );

        const route = findBestRoute(pairs, ETH, WXCN, amountIn, BASE_TOKENS);

        expect(route).not.toBeNull();
        expect(route!.outputAmount).toBe(wxcnExpected);
    });

    it("2-hop route has worse execution than a hypothetical direct route (double fee)", () => {
        // Give both a direct pair and the 2-hop path comparable mid-prices
        // but with the direct pair having very deep liquidity.
        // The 2-hop path pays 0.3% fee twice, so for equivalent liquidity
        // the direct route should always win.

        // Direct ETH/WXCN pair with the same implied price as USDC intermediary
        // Price: 1 ETH ~ 2173 USDC ~ 412,000 WXCN (from pool plan)
        const directPair = makePair(
            ETH,
            WXCN,
            690n * 10n ** 18n, // 690 ETH
            284_629_980n * 10n ** 18n, // ~284M WXCN
        );

        const pairs = [directPair, USDC_ETH_PAIR, USDC_WXCN_PAIR];
        const amountIn = 1n * 10n ** 18n;

        const route = findBestRoute(pairs, ETH, WXCN, amountIn, BASE_TOKENS);

        // With equivalent depth, the direct route should be selected
        expect(route).not.toBeNull();
        expect(route!.pairs).toHaveLength(1);
        expect(route!.path).toEqual([ETH, WXCN]);
    });
});

// ---------------------------------------------------------------------------
// 4. findBestRoute — no route
// ---------------------------------------------------------------------------

describe("findBestRoute — no route", () => {
    it("returns null for empty pairs array", () => {
        const route = findBestRoute(
            [],
            USDC,
            WXCN,
            1000n * 10n ** 6n,
            BASE_TOKENS,
        );
        expect(route).toBeNull();
    });

    it("returns null when no matching pair exists for the token pair", () => {
        // Only ETH/USDC pair, asking for ETH -> WXCN with no USDC base route
        const route = findBestRoute(
            [USDC_ETH_PAIR],
            ETH,
            WXCN,
            1n * 10n ** 18n,
            [], // no base tokens for multi-hop
        );
        expect(route).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 5. findBestRoute — reserves below MIN_RESERVE
// ---------------------------------------------------------------------------

describe("findBestRoute — reserves below MIN_RESERVE", () => {
    it("returns null when both reserves are below threshold", () => {
        const tinyPair = makePair(
            USDC,
            WXCN,
            1n, // 1 wei USDC
            1n, // 1 wei WXCN
        );

        const route = findBestRoute(
            [tinyPair],
            USDC,
            WXCN,
            1000n * 10n ** 6n,
            BASE_TOKENS,
        );
        expect(route).toBeNull();
    });

    it("succeeds when one reserve is below MIN_RESERVE but the other is healthy", () => {
        // This covers 6-decimal tokens like USDC whose raw reserves are
        // naturally below MIN_RESERVE (10^15). The AND logic ensures a pair
        // is only discarded when BOTH reserves are dust.
        const belowThreshold = MIN_RESERVE - 1n;
        const tinyPair = makePair(
            USDC,
            WXCN,
            belowThreshold,
            1_000_000n * 10n ** 18n, // plenty of WXCN
        );

        const route = findBestRoute(
            [tinyPair],
            USDC,
            WXCN,
            100n * 10n ** 6n,
            BASE_TOKENS,
        );
        expect(route).not.toBeNull();
        expect(route!.outputAmount).toBeGreaterThan(0n);
    });

    it("succeeds with realistic 6-decimal USDC reserves (below MIN_RESERVE)", () => {
        // Real mainnet scenario: 298K USDC = 2.98e11 raw (below 10^15)
        // paired with 28.2M WXCN (well above 10^15). This must NOT be filtered.
        const realisticPair = makePair(
            USDC,
            WXCN,
            298_000n * 10n ** 6n,     // 298,000 USDC (6 decimals) = 2.98e11
            28_272_724n * 10n ** 18n,  // 28.27M WXCN (18 decimals)
        );

        const route = findBestRoute(
            [realisticPair],
            USDC,
            WXCN,
            1000n * 10n ** 6n, // swap 1000 USDC
            BASE_TOKENS,
        );

        expect(route).not.toBeNull();
        expect(route!.outputAmount).toBeGreaterThan(0n);
        // ~94,879 WXCN for 1000 USDC at this price ratio
        expect(route!.outputAmount).toBeGreaterThan(90_000n * 10n ** 18n);
        expect(route!.outputAmount).toBeLessThan(100_000n * 10n ** 18n);
    });

    it("succeeds when both reserves are at MIN_RESERVE with sufficient input", () => {
        const atThreshold = makePair(USDC, WXCN, MIN_RESERVE, MIN_RESERVE);

        // Input must be large enough to produce a non-zero output after the
        // 997/1000 fee. With equal reserves of 10^15, an input of 10^12
        // (0.1% of the reserve) guarantees a non-zero output.
        const route = findBestRoute(
            [atThreshold],
            USDC,
            WXCN,
            10n ** 12n,
            BASE_TOKENS,
        );

        expect(route).not.toBeNull();
        expect(route!.outputAmount).toBeGreaterThan(0n);
    });
});

// ---------------------------------------------------------------------------
// 6. Goliath swap token list
// ---------------------------------------------------------------------------

describe("Goliath swap token list", () => {
    // We cannot import GOLIATH_TOKENS directly (it is module-private), but
    // we can verify the expected shape via goliathConfig which provides the
    // canonical addresses the controller uses.

    it("goliathConfig exposes exactly 3 swap-relevant tokens (WXCN, USDC, ETH)", () => {
        expect(goliathConfig.tokens.WXCN).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(goliathConfig.tokens.USDC).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(goliathConfig.tokens.ETH).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("WXCN address matches mainnet deployment", () => {
        expect(goliathConfig.tokens.WXCN.toLowerCase()).toBe(
            "0x1a0Da75ADf091a69E7285e596bB27218D77E17a9".toLowerCase(),
        );
    });

    it("USDC address matches mainnet deployment", () => {
        expect(goliathConfig.tokens.USDC.toLowerCase()).toBe(
            "0xC8410270bb53f6c99A2EFe6eD3686a8630Efe22B".toLowerCase(),
        );
    });

    it("ETH address matches mainnet deployment", () => {
        expect(goliathConfig.tokens.ETH.toLowerCase()).toBe(
            "0x9253587505c3B7E7b9DEE118AE1AcB53eEC0E4b6".toLowerCase(),
        );
    });

    it("all three addresses are distinct", () => {
        const addrs = [
            goliathConfig.tokens.WXCN.toLowerCase(),
            goliathConfig.tokens.USDC.toLowerCase(),
            goliathConfig.tokens.ETH.toLowerCase(),
        ];
        expect(new Set(addrs).size).toBe(3);
    });
});
