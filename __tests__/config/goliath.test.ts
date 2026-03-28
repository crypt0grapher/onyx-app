import { describe, it, expect } from "vitest";
import { goliathConfig } from "@/config/goliath";

describe("goliathConfig", () => {
    it("loads with default values", () => {
        expect(goliathConfig).toBeDefined();
        expect(goliathConfig.dex.factoryAddress).toMatch(/^0x/);
        expect(goliathConfig.dex.routerAddress).toMatch(/^0x/);
    });

    it("has valid dex addresses", () => {
        expect(goliathConfig.dex.factoryAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(goliathConfig.dex.routerAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(goliathConfig.dex.multicall3Address).toMatch(
            /^0x[0-9a-fA-F]{40}$/,
        );
    });

    it("has valid initCodeHash", () => {
        expect(goliathConfig.dex.initCodeHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it("has valid token addresses", () => {
        for (const [, addr] of Object.entries(goliathConfig.tokens)) {
            expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
        }
    });

    it("has all expected tokens", () => {
        const tokenKeys = Object.keys(goliathConfig.tokens);
        expect(tokenKeys).toContain("WXCN");
        expect(tokenKeys).toContain("USDC");
        expect(tokenKeys).toContain("ETH");
        expect(tokenKeys).toContain("BTC");
        expect(tokenKeys).toContain("XAUX");
        expect(tokenKeys).toContain("XAGX");
        expect(tokenKeys).toContain("USDT");
        expect(tokenKeys).toContain("stXCN");
    });

    it("has bridge config", () => {
        expect(goliathConfig.bridge.statusApiBaseUrl).toBeTruthy();
        expect(goliathConfig.bridge.sourceBridgeAddress).toMatch(/^0x/);
        expect(goliathConfig.bridge.goliathBridgeAddress).toMatch(/^0x/);
        expect(goliathConfig.bridge.relayerWalletAddress).toMatch(/^0x/);
        expect(goliathConfig.bridge.sourceChainId).toBeGreaterThan(0);
        expect(goliathConfig.bridge.statusPollInterval).toBeGreaterThan(0);
    });

    it("has bridge source tokens", () => {
        expect(goliathConfig.bridge.sourceTokens.USDC).toMatch(
            /^0x[0-9a-fA-F]{40}$/,
        );
        expect(goliathConfig.bridge.sourceTokens.XCN).toMatch(
            /^0x[0-9a-fA-F]{40}$/,
        );
    });

    it("has bridge boolean flags", () => {
        expect(typeof goliathConfig.bridge.bridgeEnabled).toBe("boolean");
        expect(typeof goliathConfig.bridge.allowCustomRecipient).toBe("boolean");
    });

    it("has migration config", () => {
        expect(goliathConfig.migration.sourceStakingAddress).toMatch(/^0x/);
        expect(goliathConfig.migration.deadline).toBeGreaterThan(0);
        expect(goliathConfig.migration.statusPollMs).toBeGreaterThan(0);
        expect(goliathConfig.migration.dataPollMs).toBeGreaterThan(0);
    });

    it("has migration boolean flags", () => {
        expect(typeof goliathConfig.migration.migrationEnabled).toBe("boolean");
        expect(typeof goliathConfig.migration.claimEnabled).toBe("boolean");
        expect(typeof goliathConfig.migration.statsEnabled).toBe("boolean");
        expect(typeof goliathConfig.migration.historyEnabled).toBe("boolean");
    });

    it("has staking config", () => {
        expect(goliathConfig.staking.stXcnAddress).toMatch(/^0x/);
        expect(goliathConfig.staking.protocolPollMs).toBeGreaterThan(0);
        expect(goliathConfig.staking.balancePollMs).toBeGreaterThan(0);
    });

    it("has staking boolean flag", () => {
        expect(typeof goliathConfig.staking.stakingEnabled).toBe("boolean");
    });

    it("stXCN address matches between tokens and staking config", () => {
        expect(goliathConfig.tokens.stXCN).toBe(
            goliathConfig.staking.stXcnAddress,
        );
    });
});
