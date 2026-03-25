import { afterEach, describe, expect, it, vi } from "vitest";

const originalGoliathChainId = process.env.NEXT_PUBLIC_GOLIATH_CHAIN_ID;

describe("Goliath chain ID config", () => {
    afterEach(() => {
        if (originalGoliathChainId === undefined) {
            delete process.env.NEXT_PUBLIC_GOLIATH_CHAIN_ID;
        } else {
            process.env.NEXT_PUBLIC_GOLIATH_CHAIN_ID = originalGoliathChainId;
        }
        vi.resetModules();
    });

    it("keeps MetaMask add/switch config pinned to mainnet chain 327", async () => {
        process.env.NEXT_PUBLIC_GOLIATH_CHAIN_ID = "8901";
        vi.resetModules();

        const {
            GOLIATH_MAINNET_CHAIN_ID,
            GOLIATH_MAINNET_CHAIN_ID_HEX,
            getGoliathNetwork,
            networkToChainConfig,
        } = await import("@/config/networks");

        const goliath = getGoliathNetwork();
        const chainConfig = networkToChainConfig(goliath);

        expect(GOLIATH_MAINNET_CHAIN_ID).toBe(327);
        expect(GOLIATH_MAINNET_CHAIN_ID_HEX).toBe("0x147");
        expect(goliath.chainId).toBe(327);
        expect(goliath.chainIdHex).toBe("0x147");
        expect(chainConfig.chainId).toBe("0x147");
    });
});
