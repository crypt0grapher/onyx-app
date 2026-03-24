import { describe, it, expect } from "vitest";
import { buildExplorerUrl, buildEtherscanUrl } from "@/utils/explorer";

describe("buildExplorerUrl", () => {
    it("builds Etherscan URL for chain 1", () => {
        const url = buildExplorerUrl("0x123", "tx", 1);
        expect(url).toBe("https://etherscan.io/tx/0x123");
    });

    it("builds Goliath explorer URL for chain 327", () => {
        const url = buildExplorerUrl("0x123", "tx", 327);
        expect(url).toContain("/tx/0x123");
        expect(url).toContain("goliath");
    });

    it("builds Onyx explorer URL for chain 80888", () => {
        const url = buildExplorerUrl("0xabc", "address", 80888);
        expect(url).toBe("https://explorer.onyx.org/address/0xabc");
    });

    it("builds address URL", () => {
        const url = buildExplorerUrl("0xabc", "address", 1);
        expect(url).toBe("https://etherscan.io/address/0xabc");
    });

    it("builds block URL", () => {
        const url = buildExplorerUrl(12345, "block", 1);
        expect(url).toBe("https://etherscan.io/block/12345");
    });

    it("converts numeric value to string", () => {
        const url = buildExplorerUrl(42, "block", 1);
        expect(url).toBe("https://etherscan.io/block/42");
    });

    it("falls back to Onyx explorer when no chain id provided", () => {
        const url = buildExplorerUrl("0x123", "tx");
        expect(url).toBe("https://explorer.onyx.org/tx/0x123");
    });

    it("falls back to Onyx explorer for unknown chain", () => {
        const url = buildExplorerUrl("0x123", "tx", 999999);
        expect(url).toBe("https://explorer.onyx.org/tx/0x123");
    });
});

describe("buildEtherscanUrl", () => {
    it("always uses etherscan.io regardless of chain", () => {
        const url = buildEtherscanUrl("0xdef", "tx");
        expect(url).toBe("https://etherscan.io/tx/0xdef");
    });

    it("builds address URL", () => {
        const url = buildEtherscanUrl("0xaaa", "address");
        expect(url).toBe("https://etherscan.io/address/0xaaa");
    });

    it("builds block URL with numeric value", () => {
        const url = buildEtherscanUrl(100, "block");
        expect(url).toBe("https://etherscan.io/block/100");
    });
});
