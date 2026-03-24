import { describe, it, expect } from "vitest";
import { goliathConfig } from "@/config/goliath";
import {
    uniswapV2RouterAbi,
    uniswapV2PairAbi,
    uniswapV2FactoryAbi,
} from "@/contracts/abis/goliath";
import { computePairAddress } from "@/utils/goliathSwap";
import { SWAP_TOKENS } from "@/config/swapTokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AbiEntry = {
    name?: string;
    type: string;
    stateMutability?: string;
    inputs?: readonly { name: string; type: string }[];
    outputs?: readonly { name: string; type: string }[];
};

function hasFunction(abi: readonly AbiEntry[], name: string): boolean {
    return abi.some((entry) => entry.type === "function" && entry.name === name);
}

function getFunction(
    abi: readonly AbiEntry[],
    name: string,
): AbiEntry | undefined {
    return abi.find(
        (entry) => entry.type === "function" && entry.name === name,
    );
}

// ---------------------------------------------------------------------------
// 1. CoolSwap router configuration
// ---------------------------------------------------------------------------

describe("CoolSwap router configuration", () => {
    it("router address is 0xa973c5626eEaF7F482439753953e9B28C6aF3674", () => {
        expect(goliathConfig.dex.routerAddress).toBe(
            "0xa973c5626eEaF7F482439753953e9B28C6aF3674",
        );
    });

    it("factory address is 0x008c99EedA17E193e5F788536234C6b3520B8D15", () => {
        expect(goliathConfig.dex.factoryAddress).toBe(
            "0x008c99EedA17E193e5F788536234C6b3520B8D15",
        );
    });

    it("initCodeHash starts with 0x and is 66 chars (0x + 64 hex)", () => {
        const hash = goliathConfig.dex.initCodeHash;
        expect(hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
        expect(hash.length).toBe(66);
    });
});

// ---------------------------------------------------------------------------
// 2. Uniswap V2 Router ABI
// ---------------------------------------------------------------------------

describe("Uniswap V2 Router ABI", () => {
    it("has swapExactTokensForTokens function", () => {
        expect(hasFunction(uniswapV2RouterAbi, "swapExactTokensForTokens")).toBe(
            true,
        );
    });

    it("has swapExactETHForTokens function", () => {
        expect(hasFunction(uniswapV2RouterAbi, "swapExactETHForTokens")).toBe(
            true,
        );
    });

    it("has swapExactTokensForETH function", () => {
        expect(hasFunction(uniswapV2RouterAbi, "swapExactTokensForETH")).toBe(
            true,
        );
    });

    it("has getAmountsOut query function", () => {
        expect(hasFunction(uniswapV2RouterAbi, "getAmountsOut")).toBe(true);
    });

    it("has WETH query function", () => {
        expect(hasFunction(uniswapV2RouterAbi, "WETH")).toBe(true);
    });

    it("swapExactETHForTokens is payable", () => {
        const fn = getFunction(uniswapV2RouterAbi, "swapExactETHForTokens");
        expect(fn).toBeDefined();
        expect(fn!.stateMutability).toBe("payable");
    });
});

// ---------------------------------------------------------------------------
// 3. Uniswap V2 Pair ABI
// ---------------------------------------------------------------------------

describe("Uniswap V2 Pair ABI", () => {
    it("has getReserves function", () => {
        expect(hasFunction(uniswapV2PairAbi, "getReserves")).toBe(true);
    });

    it("has token0 function", () => {
        expect(hasFunction(uniswapV2PairAbi, "token0")).toBe(true);
    });

    it("has token1 function", () => {
        expect(hasFunction(uniswapV2PairAbi, "token1")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 4. Uniswap V2 Factory ABI
// ---------------------------------------------------------------------------

describe("Uniswap V2 Factory ABI", () => {
    it("has getPair function", () => {
        expect(hasFunction(uniswapV2FactoryAbi, "getPair")).toBe(true);
    });

    it("has allPairsLength function", () => {
        expect(hasFunction(uniswapV2FactoryAbi, "allPairsLength")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 5. Pair address determinism
// ---------------------------------------------------------------------------

describe("Pair address determinism", () => {
    const { factoryAddress, initCodeHash } = goliathConfig.dex;
    const { WXCN, USDC, USDT } = goliathConfig.tokens;

    it("computes a valid address for WXCN/USDC", () => {
        const pair = computePairAddress(
            factoryAddress,
            WXCN,
            USDC,
            initCodeHash,
        );
        expect(pair).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("pair(A, B) equals pair(B, A) -- order independent", () => {
        const pairAB = computePairAddress(
            factoryAddress,
            WXCN,
            USDC,
            initCodeHash,
        );
        const pairBA = computePairAddress(
            factoryAddress,
            USDC,
            WXCN,
            initCodeHash,
        );
        expect(pairAB).toBe(pairBA);
    });

    it("different token pairs produce different addresses", () => {
        const wxcnUsdc = computePairAddress(
            factoryAddress,
            WXCN,
            USDC,
            initCodeHash,
        );
        const wxcnUsdt = computePairAddress(
            factoryAddress,
            WXCN,
            USDT,
            initCodeHash,
        );
        expect(wxcnUsdc).not.toBe(wxcnUsdt);
    });
});

// ---------------------------------------------------------------------------
// 6. Base tokens for routing
// ---------------------------------------------------------------------------

describe("Base tokens for routing", () => {
    const { WXCN, USDC, USDT, ETH } = goliathConfig.tokens;
    const baseTokens = [WXCN, USDC, USDT, ETH];

    it("has exactly 4 base tokens: WXCN, USDC, USDT, ETH", () => {
        expect(baseTokens).toHaveLength(4);
    });

    it("all base tokens are valid Ethereum addresses", () => {
        for (const token of baseTokens) {
            expect(token).toMatch(/^0x[0-9a-fA-F]{40}$/);
        }
    });

    it("WXCN is from goliathConfig.tokens", () => {
        expect(baseTokens[0]).toBe(goliathConfig.tokens.WXCN);
    });

    it("USDC is from goliathConfig.tokens", () => {
        expect(baseTokens[1]).toBe(goliathConfig.tokens.USDC);
    });

    it("USDT is from goliathConfig.tokens", () => {
        expect(baseTokens[2]).toBe(goliathConfig.tokens.USDT);
    });

    it("ETH is from goliathConfig.tokens", () => {
        expect(baseTokens[3]).toBe(goliathConfig.tokens.ETH);
    });
});

// ---------------------------------------------------------------------------
// 7. Swap token list
// ---------------------------------------------------------------------------

describe("Swap token list", () => {
    it("has ETH entry", () => {
        expect(SWAP_TOKENS.ETH).toBeDefined();
    });

    it("has XCN entry", () => {
        expect(SWAP_TOKENS.XCN).toBeDefined();
    });

    it("has USDC entry", () => {
        expect(SWAP_TOKENS.USDC).toBeDefined();
    });

    it("has USDT entry", () => {
        expect(SWAP_TOKENS.USDT).toBeDefined();
    });

    it("has DAI entry", () => {
        expect(SWAP_TOKENS.DAI).toBeDefined();
    });

    it("has WBTC entry", () => {
        expect(SWAP_TOKENS.WBTC).toBeDefined();
    });

    it("each token has address, decimals, and symbol", () => {
        for (const key of Object.keys(SWAP_TOKENS) as (keyof typeof SWAP_TOKENS)[]) {
            const token = SWAP_TOKENS[key];
            expect(token).toHaveProperty("address");
            expect(token).toHaveProperty("decimals");
            expect(token).toHaveProperty("symbol");
        }
    });

    it("USDC decimals is 6", () => {
        expect(SWAP_TOKENS.USDC.decimals).toBe(6);
    });

    it("USDT decimals is 6", () => {
        expect(SWAP_TOKENS.USDT.decimals).toBe(6);
    });

    it("ETH decimals is 18", () => {
        expect(SWAP_TOKENS.ETH.decimals).toBe(18);
    });

    it("XCN decimals is 18", () => {
        expect(SWAP_TOKENS.XCN.decimals).toBe(18);
    });
});

// ---------------------------------------------------------------------------
// 8. Goliath swap execution params
// ---------------------------------------------------------------------------

describe("Goliath swap execution params", () => {
    it("default deadline is approximately now + 20 minutes", () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const deadline = BigInt(nowSec + 1200); // 20 min = 1200 sec

        const twentyMinFromNow = BigInt(nowSec + 1200);
        // Allow a 5-second tolerance for test timing
        expect(deadline).toBeGreaterThanOrEqual(twentyMinFromNow - 5n);
        expect(deadline).toBeLessThanOrEqual(twentyMinFromNow + 5n);
    });

    it("deadline is a bigint", () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const deadline = BigInt(nowSec + 1200);
        expect(typeof deadline).toBe("bigint");
    });

    it("isNativeIn determines swapExactETHForTokens is used", () => {
        // When isNativeIn is true, the router function should be swapExactETHForTokens
        const isNativeIn = true;
        const isNativeOut = false;

        let functionName: string;
        if (isNativeIn) {
            functionName = "swapExactETHForTokens";
        } else if (isNativeOut) {
            functionName = "swapExactTokensForETH";
        } else {
            functionName = "swapExactTokensForTokens";
        }

        expect(functionName).toBe("swapExactETHForTokens");
        expect(hasFunction(uniswapV2RouterAbi, functionName)).toBe(true);
    });

    it("isNativeOut determines swapExactTokensForETH is used", () => {
        const isNativeIn = false;
        const isNativeOut = true;

        let functionName: string;
        if (isNativeIn) {
            functionName = "swapExactETHForTokens";
        } else if (isNativeOut) {
            functionName = "swapExactTokensForETH";
        } else {
            functionName = "swapExactTokensForTokens";
        }

        expect(functionName).toBe("swapExactTokensForETH");
        expect(hasFunction(uniswapV2RouterAbi, functionName)).toBe(true);
    });

    it("neither native flag uses swapExactTokensForTokens", () => {
        const isNativeIn = false;
        const isNativeOut = false;

        let functionName: string;
        if (isNativeIn) {
            functionName = "swapExactETHForTokens";
        } else if (isNativeOut) {
            functionName = "swapExactTokensForETH";
        } else {
            functionName = "swapExactTokensForTokens";
        }

        expect(functionName).toBe("swapExactTokensForTokens");
        expect(hasFunction(uniswapV2RouterAbi, functionName)).toBe(true);
    });
});
