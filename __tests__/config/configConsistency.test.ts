import { describe, it, expect } from "vitest";
import { BRIDGE_CONFIG } from "@/lib/api/config";
import { goliathConfig } from "@/config/goliath";
import mainAddresses from "@/contracts/addresses/main.json";
import tokenAddresses from "@/contracts/addresses/tokens.json";
import { SWAP_TOKENS } from "@/config/swapTokens";
import { CONTRACTS } from "@/contracts/config";
import { getChainFeatures } from "@/config/features";
import { SUPPORTED_NETWORKS } from "@/config/networks";

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

// ---------------------------------------------------------------------------
// 1. Bridge API config consistency
// ---------------------------------------------------------------------------

describe("Bridge API config consistency", () => {
    it("BRIDGE_CONFIG.BASE_URL contains bridge.goliath.net", () => {
        expect(BRIDGE_CONFIG.BASE_URL).toContain("bridge.goliath.net");
    });

    it("goliathConfig.bridge.statusApiBaseUrl contains bridge.goliath.net", () => {
        expect(goliathConfig.bridge.statusApiBaseUrl).toContain(
            "bridge.goliath.net",
        );
    });

    it("both URLs use HTTPS", () => {
        expect(BRIDGE_CONFIG.BASE_URL).toMatch(/^https:\/\//);
        expect(goliathConfig.bridge.statusApiBaseUrl).toMatch(/^https:\/\//);
    });

    it('both URLs include "/api/v1" path', () => {
        expect(BRIDGE_CONFIG.BASE_URL).toContain("/api/v1");
        expect(goliathConfig.bridge.statusApiBaseUrl).toContain("/api/v1");
    });

    it("BRIDGE_CONFIG.DEFAULT_TIMEOUT is greater than 0", () => {
        expect(BRIDGE_CONFIG.DEFAULT_TIMEOUT).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// 2. Ethereum contract addresses (main.json)
// ---------------------------------------------------------------------------

describe("Ethereum contract addresses (main.json)", () => {
    it('xcnStaking address for chain "1" exists and is valid', () => {
        expect(mainAddresses.xcnStaking["1"]).toBeDefined();
        expect(mainAddresses.xcnStaking["1"]).toMatch(ETH_ADDRESS_RE);
    });

    it('xcnClaim address for chain "1" exists and is valid', () => {
        expect(mainAddresses.xcnClaim["1"]).toBeDefined();
        expect(mainAddresses.xcnClaim["1"]).toMatch(ETH_ADDRESS_RE);
    });

    it('uniSwapRouter address for chain "1" exists and is valid', () => {
        expect(mainAddresses.uniSwapRouter["1"]).toBeDefined();
        expect(mainAddresses.uniSwapRouter["1"]).toMatch(ETH_ADDRESS_RE);
    });

    it('masterChef address for chain "1" exists and is valid', () => {
        expect(mainAddresses.masterChef["1"]).toBeDefined();
        expect(mainAddresses.masterChef["1"]).toMatch(ETH_ADDRESS_RE);
    });

    it('governorBravoDelegator address for chain "1" exists and is valid', () => {
        expect(mainAddresses.governorBravoDelegator["1"]).toBeDefined();
        expect(mainAddresses.governorBravoDelegator["1"]).toMatch(
            ETH_ADDRESS_RE,
        );
    });

    it('oracle address for chain "1" exists and is valid', () => {
        expect(mainAddresses.oracle["1"]).toBeDefined();
        expect(mainAddresses.oracle["1"]).toMatch(ETH_ADDRESS_RE);
    });

    it("all addresses match the Ethereum address pattern", () => {
        for (const [key, mapping] of Object.entries(mainAddresses)) {
            const addr = (mapping as Record<string, string>)["1"];
            expect(addr).toMatch(ETH_ADDRESS_RE);
        }
    });
});

// ---------------------------------------------------------------------------
// 3. Ethereum token addresses (tokens.json)
// ---------------------------------------------------------------------------

describe("Ethereum token addresses (tokens.json)", () => {
    it("xcn address for chain 1 matches expected value", () => {
        expect(tokenAddresses.xcn["1"].toLowerCase()).toBe(
            "0xA2cd3D43c775978A96BdBf12d733D5A1ED94fb18".toLowerCase(),
        );
    });

    it("usdc address for chain 1 matches expected value", () => {
        expect(tokenAddresses.usdc["1"].toLowerCase()).toBe(
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".toLowerCase(),
        );
    });

    it("usdt address for chain 1 matches expected value", () => {
        expect(tokenAddresses.usdt["1"].toLowerCase()).toBe(
            "0xdAC17F958D2ee523a2206206994597C13D831ec7".toLowerCase(),
        );
    });

    it("all token addresses in the file are valid", () => {
        for (const [, mapping] of Object.entries(tokenAddresses)) {
            const addr = (mapping as Record<string, string>)["1"];
            expect(addr).toMatch(ETH_ADDRESS_RE);
        }
    });

    it("no duplicate addresses across different tokens", () => {
        const addresses: string[] = [];
        for (const [, mapping] of Object.entries(tokenAddresses)) {
            const addr = (
                mapping as Record<string, string>
            )["1"].toLowerCase();
            addresses.push(addr);
        }
        const unique = new Set(addresses);
        expect(unique.size).toBe(addresses.length);
    });
});

// ---------------------------------------------------------------------------
// 4. Swap tokens match token addresses
// ---------------------------------------------------------------------------

describe("Swap tokens match token addresses", () => {
    it("SWAP_TOKENS.XCN.address matches tokenAddresses.xcn[1]", () => {
        expect(SWAP_TOKENS.XCN.address.toLowerCase()).toBe(
            tokenAddresses.xcn["1"].toLowerCase(),
        );
    });

    it("SWAP_TOKENS.USDC.address matches tokenAddresses.usdc[1]", () => {
        expect(SWAP_TOKENS.USDC.address.toLowerCase()).toBe(
            tokenAddresses.usdc["1"].toLowerCase(),
        );
    });

    it("SWAP_TOKENS.USDT.address matches tokenAddresses.usdt[1]", () => {
        expect(SWAP_TOKENS.USDT.address.toLowerCase()).toBe(
            tokenAddresses.usdt["1"].toLowerCase(),
        );
    });

    it("SWAP_TOKENS.DAI.address matches tokenAddresses.dai[1]", () => {
        expect(SWAP_TOKENS.DAI.address.toLowerCase()).toBe(
            tokenAddresses.dai["1"].toLowerCase(),
        );
    });

    it("SWAP_TOKENS.WBTC.address matches tokenAddresses.wbtc[1]", () => {
        expect(SWAP_TOKENS.WBTC.address.toLowerCase()).toBe(
            tokenAddresses.wbtc["1"].toLowerCase(),
        );
    });
});

// ---------------------------------------------------------------------------
// 5. CONTRACTS config uses correct addresses
// ---------------------------------------------------------------------------

describe("CONTRACTS config uses correct addresses", () => {
    it("CONTRACTS.xcnToken.address matches tokenAddresses.xcn[1]", () => {
        expect(CONTRACTS.xcnToken.address.toLowerCase()).toBe(
            tokenAddresses.xcn["1"].toLowerCase(),
        );
    });

    it("CONTRACTS.xcnStaking.address matches mainAddresses.xcnStaking[1]", () => {
        expect(CONTRACTS.xcnStaking.address.toLowerCase()).toBe(
            mainAddresses.xcnStaking["1"].toLowerCase(),
        );
    });

    it("CONTRACTS.masterChef.address matches mainAddresses.masterChef[1]", () => {
        expect(CONTRACTS.masterChef.address.toLowerCase()).toBe(
            mainAddresses.masterChef["1"].toLowerCase(),
        );
    });

    it("CONTRACTS.governorBravoDelegator.address matches mainAddresses.governorBravoDelegator[1]", () => {
        expect(
            CONTRACTS.governorBravoDelegator.address.toLowerCase(),
        ).toBe(
            mainAddresses.governorBravoDelegator["1"].toLowerCase(),
        );
    });

    it("all CONTRACTS entries have chainId === 1", () => {
        for (const [, contract] of Object.entries(CONTRACTS)) {
            expect(
                (contract as { chainId: number }).chainId,
            ).toBe(1);
        }
    });

    it("all CONTRACTS entries have an abi property", () => {
        for (const [key, contract] of Object.entries(CONTRACTS)) {
            // treasury is a known exception with no abi
            if (key === "treasury") continue;
            expect(
                (contract as { abi: unknown }).abi,
            ).toBeDefined();
        }
    });
});

// ---------------------------------------------------------------------------
// 6. Goliath tokens don't collide with Ethereum tokens
// ---------------------------------------------------------------------------

describe("Goliath tokens don't collide with Ethereum tokens", () => {
    it("goliathConfig.tokens.USDC differs from tokenAddresses.usdc[1]", () => {
        expect(goliathConfig.tokens.USDC.toLowerCase()).not.toBe(
            tokenAddresses.usdc["1"].toLowerCase(),
        );
    });

    it("goliathConfig.tokens.USDT differs from tokenAddresses.usdt[1]", () => {
        expect(goliathConfig.tokens.USDT.toLowerCase()).not.toBe(
            tokenAddresses.usdt["1"].toLowerCase(),
        );
    });
});

// ---------------------------------------------------------------------------
// 7. Feature flags cover all networks
// ---------------------------------------------------------------------------

describe("Feature flags cover all networks", () => {
    it("getChainFeatures(1) returns valid config for Ethereum", () => {
        const cfg = getChainFeatures(1);
        expect(cfg.chainId).toBe(1);
        expect(cfg.networkId).toBe("ethereum");
    });

    it("getChainFeatures(327) returns valid config for Goliath", () => {
        const cfg = getChainFeatures(327);
        expect(cfg.chainId).toBe(327);
        expect(cfg.networkId).toBe("goliath");
    });

    it("getChainFeatures(80888) returns valid config for Onyx", () => {
        const cfg = getChainFeatures(80888);
        expect(cfg.chainId).toBe(80888);
        expect(cfg.networkId).toBe("onyx");
    });

    it("Ethereum has: swap, stake, governance, farm, points, history", () => {
        const eth = getChainFeatures(1);
        expect(eth.features.swap).toBe(true);
        expect(eth.features.stake).toBe(true);
        expect(eth.features.governance).toBe(true);
        expect(eth.features.farm).toBe(true);
        expect(eth.features.points).toBe(true);
        expect(eth.features.history).toBe(true);
    });

    it("Goliath has: swap, yield, bridge, migrate, history", () => {
        const g = getChainFeatures(327);
        expect(g.features.swap).toBe(true);
        expect(g.features.yield).toBe(true);
        expect(g.features.bridge).toBe(true);
        expect(g.features.migrate).toBe(true);
        expect(g.features.history).toBe(true);
    });

    it("no network has all features enabled (sanity check)", () => {
        for (const chainId of [1, 327, 80888]) {
            const cfg = getChainFeatures(chainId);
            const allEnabled = Object.values(cfg.features).every(
                (v) => v === true,
            );
            expect(allEnabled).toBe(false);
        }
    });
});

// ---------------------------------------------------------------------------
// 8. Network configuration completeness
// ---------------------------------------------------------------------------

describe("Network configuration completeness", () => {
    const ethereum = SUPPORTED_NETWORKS.find((n) => n.id === "ethereum")!;
    const onyx = SUPPORTED_NETWORKS.find((n) => n.id === "onyx")!;
    const goliath = SUPPORTED_NETWORKS.find((n) => n.id === "goliath")!;

    it("all 3 networks exist", () => {
        expect(ethereum).toBeDefined();
        expect(onyx).toBeDefined();
        expect(goliath).toBeDefined();
    });

    it("all 3 networks have rpcUrl starting with https", () => {
        expect(ethereum.rpcUrl).toMatch(/^https:\/\//);
        expect(onyx.rpcUrl).toMatch(/^https:\/\//);
        expect(goliath.rpcUrl).toMatch(/^https:\/\//);
    });

    it("all 3 networks have blockExplorerUrl starting with https", () => {
        expect(ethereum.blockExplorerUrl).toMatch(/^https:\/\//);
        expect(onyx.blockExplorerUrl).toMatch(/^https:\/\//);
        expect(goliath.blockExplorerUrl).toMatch(/^https:\/\//);
    });

    it("Goliath chainId is 327", () => {
        expect(goliath.chainId).toBe(327);
    });

    it('Goliath rpcUrl contains "goliath"', () => {
        expect(goliath.rpcUrl).toContain("goliath");
    });

    it('Goliath explorer contains "goliath"', () => {
        expect(goliath.blockExplorerUrl).toContain("goliath");
    });
});
