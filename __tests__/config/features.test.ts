import { describe, it, expect } from "vitest";
import {
    getChainFeatures,
    hasFeature,
    getSwapVariant,
    getStakeVariant,
} from "@/config/features";

describe("features", () => {
    it("Ethereum has correct capabilities", () => {
        const eth = getChainFeatures(1);
        expect(eth.chainId).toBe(1);
        expect(eth.networkId).toBe("ethereum");
        expect(eth.features.swap).toBe(true);
        expect(eth.features.stake).toBe(true);
        expect(eth.features.governance).toBe(true);
        expect(eth.features.farm).toBe(true);
        expect(eth.features.points).toBe(true);
        expect(eth.features.history).toBe(true);
        expect(eth.features.bridge).toBe(false);
        expect(eth.features.migrate).toBe(false);
        expect(eth.features.yield).toBe(false);
    });

    it("Goliath has correct capabilities", () => {
        const g = getChainFeatures(327);
        expect(g.networkId).toBe("goliath");
        expect(g.features.swap).toBe(true);
        expect(g.features.yield).toBe(true);
        expect(g.features.bridge).toBe(true);
        expect(g.features.migrate).toBe(true);
        expect(g.features.history).toBe(true);
        expect(g.features.governance).toBe(false);
        expect(g.features.farm).toBe(false);
        expect(g.features.stake).toBe(false);
        expect(g.features.points).toBe(false);
    });

    it("Onyx has correct capabilities", () => {
        const o = getChainFeatures(80888);
        expect(o.networkId).toBe("onyx");
        expect(o.features.history).toBe(true);
        expect(o.features.swap).toBe(false);
        expect(o.features.stake).toBe(false);
        expect(o.features.governance).toBe(false);
        expect(o.features.bridge).toBe(false);
    });

    it("hasFeature works for bridge", () => {
        expect(hasFeature(327, "bridge")).toBe(true);
        expect(hasFeature(1, "bridge")).toBe(false);
        expect(hasFeature(80888, "bridge")).toBe(false);
    });

    it("hasFeature works for governance", () => {
        expect(hasFeature(1, "governance")).toBe(true);
        expect(hasFeature(327, "governance")).toBe(false);
    });

    it("hasFeature returns false for unknown chain", () => {
        expect(hasFeature(999, "swap")).toBe(false);
        expect(hasFeature(999, "bridge")).toBe(false);
    });

    it("swap variants correct", () => {
        expect(getSwapVariant(1)).toBe("uniswap-ethereum");
        expect(getSwapVariant(327)).toBe("coolswap-goliath");
    });

    it("swap variant null for Onyx and unknown chains", () => {
        expect(getSwapVariant(80888)).toBeNull();
        expect(getSwapVariant(999)).toBeNull();
    });

    it("stake variants correct", () => {
        expect(getStakeVariant(1)).toBe("xcn-masterchef");
        expect(getStakeVariant(327)).toBe("stxcn-goliath");
    });

    it("stake variant null for Onyx and unknown chains", () => {
        expect(getStakeVariant(80888)).toBeNull();
        expect(getStakeVariant(999)).toBeNull();
    });

    it("unknown chain returns all-false features", () => {
        const unknown = getChainFeatures(999);
        expect(
            Object.values(unknown.features).every((v) => v === false),
        ).toBe(true);
    });

    it("unknown chain preserves the queried chainId", () => {
        const unknown = getChainFeatures(42161);
        expect(unknown.chainId).toBe(42161);
        expect(unknown.networkId).toBe("unknown");
    });
});
