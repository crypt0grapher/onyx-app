import { describe, it, expect } from "vitest";
import { getAddress } from "viem";
import { goliathConfig } from "@/config/goliath";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const VALID_BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Case-insensitive address comparison.  The config may store addresses in
 * mixed case, so we normalise to lowercase before comparing.
 */
const addressEq = (a: string, b: string): boolean =>
    a.toLowerCase() === b.toLowerCase();

// ---------------------------------------------------------------------------
// 1. Goliath DEX contract addresses
// ---------------------------------------------------------------------------

describe("Goliath DEX contract addresses", () => {
    it("Factory address matches deployed contract", () => {
        expect(addressEq(goliathConfig.dex.factoryAddress, "0x008c99EedA17E193e5F788536234C6b3520B8D15")).toBe(true);
    });

    it("Router address matches deployed contract", () => {
        expect(addressEq(goliathConfig.dex.routerAddress, "0xa973c5626eEaF7F482439753953e9B28C6aF3674")).toBe(true);
    });

    it("all DEX addresses are valid checksummed Ethereum addresses", () => {
        expect(goliathConfig.dex.factoryAddress).toMatch(VALID_ADDRESS_RE);
        expect(goliathConfig.dex.routerAddress).toMatch(VALID_ADDRESS_RE);
        expect(goliathConfig.dex.multicall3Address).toMatch(VALID_ADDRESS_RE);

        // getAddress from viem will throw if the checksum is invalid
        expect(getAddress(goliathConfig.dex.factoryAddress)).toBe(goliathConfig.dex.factoryAddress);
        expect(getAddress(goliathConfig.dex.routerAddress)).toBe(goliathConfig.dex.routerAddress);
        expect(getAddress(goliathConfig.dex.multicall3Address)).toBe(goliathConfig.dex.multicall3Address);
    });

    it("initCodeHash is a valid 32-byte hex string", () => {
        expect(goliathConfig.dex.initCodeHash).toMatch(VALID_BYTES32_RE);
    });
});

// ---------------------------------------------------------------------------
// 2. Goliath token addresses
// ---------------------------------------------------------------------------

describe("Goliath token addresses", () => {
    it("WXCN address matches deployed contract", () => {
        expect(addressEq(goliathConfig.tokens.WXCN, "0x1a0Da75ADf091a69E7285e596bB27218D77E17a9")).toBe(true);
    });

    it("USDC address matches deployed contract", () => {
        expect(addressEq(goliathConfig.tokens.USDC, "0x60bB118298F4a6f54A73891E5Ba66CAAb7229654")).toBe(true);
    });

    it("USDT address matches deployed contract", () => {
        expect(addressEq(goliathConfig.tokens.USDT, "0x86381420c71d404ca6C3C0873e80Fe8AEF2dD6C7")).toBe(true);
    });

    it("XAUX address matches deployed contract", () => {
        expect(addressEq(goliathConfig.tokens.XAUX, "0x3421E2336B39BFb2B4B999b51e33a67AAE45D62d")).toBe(true);
    });

    it("XAGX address matches deployed contract", () => {
        expect(addressEq(goliathConfig.tokens.XAGX, "0x18C1457621178409d8841cE18d2dE6c25aB7D16e")).toBe(true);
    });

    it("stXCN address matches deployed contract", () => {
        expect(addressEq(goliathConfig.tokens.stXCN, "0xA553a603e2f84fEa6c1fc225E0945FE176C72F74")).toBe(true);
    });

    it("all token addresses are unique (no duplicates)", () => {
        const addresses = Object.values(goliathConfig.tokens).map((a) => a.toLowerCase());
        const unique = new Set(addresses);
        expect(unique.size).toBe(addresses.length);
    });

    it("all token addresses are valid checksummed Ethereum addresses", () => {
        for (const [, addr] of Object.entries(goliathConfig.tokens)) {
            expect(addr).toMatch(VALID_ADDRESS_RE);
            expect(getAddress(addr)).toBe(addr);
        }
    });
});

// ---------------------------------------------------------------------------
// 3. Bridge contract addresses
// ---------------------------------------------------------------------------

describe("Bridge contract addresses", () => {
    it("sourceBridgeAddress (BridgeLock on Ethereum) starts with expected prefix", () => {
        expect(goliathConfig.bridge.sourceBridgeAddress.toLowerCase().startsWith("0xa9fd64")).toBe(true);
    });

    it("goliathBridgeAddress (BridgeMint on Goliath) starts with expected prefix", () => {
        expect(goliathConfig.bridge.goliathBridgeAddress.toLowerCase().startsWith("0x1d14ae")).toBe(true);
    });

    it("relayerWalletAddress matches expected address", () => {
        expect(addressEq(goliathConfig.bridge.relayerWalletAddress, "0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB")).toBe(true);
    });

    it("sourceChainId is 1 (Ethereum mainnet)", () => {
        expect(goliathConfig.bridge.sourceChainId).toBe(1);
    });

    it("statusApiBaseUrl contains bridge.goliath.net", () => {
        expect(goliathConfig.bridge.statusApiBaseUrl).toContain("bridge.goliath.net");
    });

    it("sourceTokens.USDC matches Ethereum mainnet USDC", () => {
        expect(addressEq(goliathConfig.bridge.sourceTokens.USDC, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")).toBe(true);
    });

    it("sourceTokens.XCN matches Ethereum mainnet XCN", () => {
        expect(addressEq(goliathConfig.bridge.sourceTokens.XCN, "0xA2cd3D43c775978A96BdBf12d733D5A1ED94fb18")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 4. Staking address consistency
// ---------------------------------------------------------------------------

describe("Staking address consistency", () => {
    it("staking.stXcnAddress equals tokens.stXCN", () => {
        expect(addressEq(goliathConfig.staking.stXcnAddress, goliathConfig.tokens.stXCN)).toBe(true);
    });

    it("staking.stXcnAddress matches expected address", () => {
        expect(addressEq(goliathConfig.staking.stXcnAddress, "0xA553a603e2f84fEa6c1fc225E0945FE176C72F74")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 5. No address collisions
// ---------------------------------------------------------------------------

describe("No address collisions", () => {
    it("Factory, Router, and all token addresses are all unique", () => {
        const allAddresses = [
            goliathConfig.dex.factoryAddress,
            goliathConfig.dex.routerAddress,
            ...Object.values(goliathConfig.tokens),
        ].map((a) => a.toLowerCase());

        const unique = new Set(allAddresses);
        expect(unique.size).toBe(allAddresses.length);
    });

    it("Bridge source and goliath addresses are different", () => {
        expect(
            addressEq(goliathConfig.bridge.sourceBridgeAddress, goliathConfig.bridge.goliathBridgeAddress),
        ).toBe(false);
    });

    it("stXCN address is not the same as any DEX address", () => {
        const stXcn = goliathConfig.tokens.stXCN.toLowerCase();
        expect(stXcn).not.toBe(goliathConfig.dex.factoryAddress.toLowerCase());
        expect(stXcn).not.toBe(goliathConfig.dex.routerAddress.toLowerCase());
        expect(stXcn).not.toBe(goliathConfig.dex.multicall3Address.toLowerCase());
    });
});
