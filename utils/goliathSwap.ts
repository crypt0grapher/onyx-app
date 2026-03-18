import { getAddress, keccak256, encodePacked, type Address } from "viem";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum reserve threshold -- pairs with reserves below this are ignored. */
export const MIN_RESERVE = 10n ** 15n; // 0.001 tokens (18 decimals)

/** Maximum allowable price impact (basis points). Trades above this are blocked. */
export const MAX_PRICE_IMPACT_BPS = 1500n; // 15%

/** Price impact warning threshold (basis points). */
export const WARN_PRICE_IMPACT_BPS = 500n; // 5%

/** Basis-point denominator. */
export const BPS_BASE = 10000n;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** On-chain pair reserve snapshot. */
export interface PairData {
  pairAddress: Address;
  token0: Address;
  token1: Address;
  reserve0: bigint;
  reserve1: bigint;
}

/** A fully-evaluated trade route through one or more pairs. */
export interface TradeRoute {
  path: Address[];
  pairs: PairData[];
  inputAmount: bigint;
  outputAmount: bigint;
  priceImpactBps: bigint;
}

// ---------------------------------------------------------------------------
// CREATE2 pair address computation
// ---------------------------------------------------------------------------

/**
 * Compute the deterministic Uniswap V2 pair address via CREATE2.
 *
 * address = keccak256(0xff ++ factory ++ salt ++ initCodeHash)[12:]
 * where salt = keccak256(abi.encodePacked(token0, token1))
 */
export function computePairAddress(
  factoryAddress: Address,
  tokenA: Address,
  tokenB: Address,
  initCodeHash: `0x${string}`,
): Address {
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const salt = keccak256(
    encodePacked(["address", "address"], [token0, token1]),
  );

  const hash = keccak256(
    encodePacked(
      ["bytes1", "address", "bytes32", "bytes32"],
      ["0xff", factoryAddress, salt, initCodeHash],
    ),
  );

  // Last 20 bytes of the 32-byte hash
  return getAddress(`0x${hash.slice(26)}`) as Address;
}

// ---------------------------------------------------------------------------
// Uniswap V2 exact swap math
// ---------------------------------------------------------------------------

/**
 * Calculate the output amount for a given input (exact-in).
 * Applies the 0.3 % fee (factor 997/1000).
 */
export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;

  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

/**
 * Calculate the input amount required for a desired output (exact-out).
 * Applies the 0.3 % fee (factor 997/1000).
 */
export function getAmountIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): bigint {
  if (amountOut <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  if (amountOut >= reserveOut) return 0n; // Cannot buy more than the reserve

  const numerator = reserveIn * amountOut * 1000n;
  const denominator = (reserveOut - amountOut) * 997n;
  return numerator / denominator + 1n;
}

// ---------------------------------------------------------------------------
// Price impact
// ---------------------------------------------------------------------------

/**
 * Calculate price impact in basis points.
 *
 * midPrice       = reserveOut / reserveIn
 * executionPrice = amountOut  / amountIn
 * impact         = 1 - executionPrice / midPrice
 *                = 1 - (amountOut * reserveIn) / (amountIn * reserveOut)
 */
export function calculatePriceImpactBps(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): bigint {
  if (reserveIn === 0n || amountIn === 0n) return 0n;

  const midValue = amountIn * reserveOut;
  const execValue = amountOut * reserveIn;
  if (midValue === 0n) return 0n;

  return ((midValue - execValue) * BPS_BASE) / midValue;
}

// ---------------------------------------------------------------------------
// Slippage helpers
// ---------------------------------------------------------------------------

/** Apply slippage to a minimum-received amount (exact-in trade). */
export function applySlippageMinimum(
  amount: bigint,
  slippageBps: number,
): bigint {
  return (amount * (BPS_BASE - BigInt(slippageBps))) / BPS_BASE;
}

/** Apply slippage to a maximum-sent amount (exact-out trade). */
export function applySlippageMaximum(
  amount: bigint,
  slippageBps: number,
): bigint {
  return (amount * (BPS_BASE + BigInt(slippageBps))) / BPS_BASE;
}

// ---------------------------------------------------------------------------
// Route finding
// ---------------------------------------------------------------------------

/**
 * Find the pair matching `tokenA` / `tokenB` from a list (order-independent).
 */
function findPair(
  pairs: PairData[],
  tokenA: Address,
  tokenB: Address,
): PairData | undefined {
  const a = tokenA.toLowerCase();
  const b = tokenB.toLowerCase();
  return pairs.find(
    (p) =>
      (p.token0.toLowerCase() === a && p.token1.toLowerCase() === b) ||
      (p.token0.toLowerCase() === b && p.token1.toLowerCase() === a),
  );
}

/**
 * Evaluate a route (one or more hops) and return the resulting trade, or
 * `null` if the route is invalid (e.g. insufficient reserves).
 */
function calculateRoute(
  routePairs: PairData[],
  path: Address[],
  amountIn: bigint,
): TradeRoute | null {
  let currentAmount = amountIn;
  let totalImpactBps = 0n;

  for (let i = 0; i < routePairs.length; i++) {
    const pair = routePairs[i];
    const [reserveIn, reserveOut] =
      path[i].toLowerCase() === pair.token0.toLowerCase()
        ? [pair.reserve0, pair.reserve1]
        : [pair.reserve1, pair.reserve0];

    if (reserveIn < MIN_RESERVE || reserveOut < MIN_RESERVE) return null;

    const outAmount = getAmountOut(currentAmount, reserveIn, reserveOut);
    const impact = calculatePriceImpactBps(
      currentAmount,
      outAmount,
      reserveIn,
      reserveOut,
    );
    totalImpactBps += impact;
    currentAmount = outAmount;
  }

  if (currentAmount === 0n) return null;

  return {
    path,
    pairs: routePairs,
    inputAmount: amountIn,
    outputAmount: currentAmount,
    priceImpactBps: totalImpactBps,
  };
}

/**
 * Return whichever route has the higher output amount.
 * If `current` is `null`, the candidate wins unconditionally.
 */
function betterRoute(
  current: TradeRoute | null,
  candidate: TradeRoute | null,
): TradeRoute | null {
  if (!candidate) return current;
  if (!current) return candidate;
  return candidate.outputAmount > current.outputAmount ? candidate : current;
}

/**
 * Find the best trade route from `tokenIn` to `tokenOut`.
 *
 * Considers:
 *   1. A direct pair (zero intermediate hops).
 *   2. All 1-hop routes through each token in `baseTokens`.
 *
 * Returns the route with the highest output amount, or `null` if no valid
 * route exists.
 */
export function findBestRoute(
  pairs: PairData[],
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  baseTokens: Address[],
): TradeRoute | null {
  let bestRoute: TradeRoute | null = null;

  // 1. Direct pair
  const directPair = findPair(pairs, tokenIn, tokenOut);
  if (directPair) {
    const route = calculateRoute([directPair], [tokenIn, tokenOut], amountIn);
    bestRoute = betterRoute(bestRoute, route);
  }

  // 2. 1-hop routes through base tokens
  for (const base of baseTokens) {
    if (
      base.toLowerCase() === tokenIn.toLowerCase() ||
      base.toLowerCase() === tokenOut.toLowerCase()
    ) {
      continue;
    }

    const pair1 = findPair(pairs, tokenIn, base);
    const pair2 = findPair(pairs, base, tokenOut);
    if (pair1 && pair2) {
      const route = calculateRoute(
        [pair1, pair2],
        [tokenIn, base, tokenOut],
        amountIn,
      );
      bestRoute = betterRoute(bestRoute, route);
    }
  }

  return bestRoute;
}
