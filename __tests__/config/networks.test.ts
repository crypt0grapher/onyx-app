import { describe, it, expect } from "vitest";
import {
    SUPPORTED_NETWORKS,
    getGoliathNetwork,
    isGoliathChain,
    getNetworkByChainId,
    getNetworkBySymbol,
    getNetworkByHexChainId,
    getOnyxNetwork,
    networkToChainConfig,
} from "@/config/networks";

describe("networks", () => {
    it("includes Goliath in SUPPORTED_NETWORKS", () => {
        const goliath = SUPPORTED_NETWORKS.find((n) => n.id === "goliath");
        expect(goliath).toBeDefined();
        expect(goliath!.chainId).toBe(327);
        expect(goliath!.nativeCurrency.symbol).toBe("XCN");
    });

    it("includes Ethereum in SUPPORTED_NETWORKS", () => {
        const eth = SUPPORTED_NETWORKS.find((n) => n.id === "ethereum");
        expect(eth).toBeDefined();
        expect(eth!.chainId).toBe(1);
        expect(eth!.nativeCurrency.symbol).toBe("ETH");
    });

    it("includes Onyx in SUPPORTED_NETWORKS", () => {
        const onyx = SUPPORTED_NETWORKS.find((n) => n.id === "onyx");
        expect(onyx).toBeDefined();
        expect(onyx!.chainId).toBe(80888);
        expect(onyx!.nativeCurrency.symbol).toBe("XCN");
    });

    it("getGoliathNetwork returns correct metadata", () => {
        const g = getGoliathNetwork();
        expect(g.id).toBe("goliath");
        expect(g.rpcUrl).toBeTruthy();
        expect(g.blockExplorerUrl).toBeTruthy();
    });

    it("getOnyxNetwork returns correct metadata", () => {
        const o = getOnyxNetwork();
        expect(o.id).toBe("onyx");
        expect(o.chainId).toBe(80888);
    });

    it("isGoliathChain works", () => {
        expect(isGoliathChain(327)).toBe(true);
        expect(isGoliathChain(1)).toBe(false);
        expect(isGoliathChain(80888)).toBe(false);
    });

    it("getNetworkByChainId returns Goliath for 327", () => {
        expect(getNetworkByChainId(327)?.id).toBe("goliath");
    });

    it("getNetworkByChainId returns Ethereum for 1", () => {
        expect(getNetworkByChainId(1)?.id).toBe("ethereum");
    });

    it("getNetworkByChainId returns undefined for unknown chain", () => {
        expect(getNetworkByChainId(999)).toBeUndefined();
    });

    it("getNetworkBySymbol finds by network name", () => {
        expect(getNetworkBySymbol("Ethereum Mainnet")?.id).toBe("ethereum");
        expect(getNetworkBySymbol("Onyx Network")?.id).toBe("onyx");
        expect(getNetworkBySymbol("Goliath Mainnet")?.id).toBe("goliath");
    });

    it("getNetworkBySymbol returns undefined for unknown symbol", () => {
        expect(getNetworkBySymbol("Unknown")).toBeUndefined();
    });

    it("getNetworkByHexChainId works", () => {
        expect(getNetworkByHexChainId("0x1")?.id).toBe("ethereum");
        expect(getNetworkByHexChainId("0x13bf8")?.id).toBe("onyx");
    });

    it("getNetworkByHexChainId returns undefined for unknown hex", () => {
        expect(getNetworkByHexChainId("0xfffff")).toBeUndefined();
    });

    it("networkToChainConfig produces correct structure", () => {
        const eth = getNetworkByChainId(1)!;
        const cfg = networkToChainConfig(eth);
        expect(cfg.chainId).toBe("0x1");
        expect(cfg.chainName).toBe("Ethereum Mainnet");
        expect(cfg.rpcUrls).toHaveLength(1);
        expect(cfg.nativeCurrency.symbol).toBe("ETH");
        expect(cfg.blockExplorerUrls).toHaveLength(1);
    });

    it("all networks have required fields", () => {
        for (const net of SUPPORTED_NETWORKS) {
            expect(net.id).toBeTruthy();
            expect(net.chainId).toBeGreaterThan(0);
            expect(net.rpcUrl).toBeTruthy();
            expect(net.blockExplorerUrl).toBeTruthy();
            expect(net.nativeCurrency).toBeDefined();
            expect(net.nativeCurrency.decimals).toBe(18);
            expect(net.chainIdHex).toMatch(/^0x/);
        }
    });

    it("has exactly 3 supported networks", () => {
        expect(SUPPORTED_NETWORKS).toHaveLength(3);
    });
});
